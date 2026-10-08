import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BASE_URL = 'https://portal.packzy.com/api/v1';

interface SteadfastKeys {
  apiKey: string;
  secretKey: string;
}

async function getSteadfastKeys(supabase: any): Promise<SteadfastKeys> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'api_settings')
    .maybeSingle();
  if (error) throw new Error('Failed to load api_settings: ' + error.message);
  const v = (data?.value ?? {}) as any;
  const apiKey = v.steadfast_api_key as string | undefined;
  const secretKey = v.steadfast_secret_key as string | undefined;
  if (!apiKey || !secretKey) {
    throw new Error('Steadfast API Key / Secret Key not configured in Admin → API Settings');
  }
  return { apiKey, secretKey };
}

function steadfastHeaders(keys: SteadfastKeys) {
  return {
    'Api-Key': keys.apiKey,
    'Secret-Key': keys.secretKey,
    'Content-Type': 'application/json',
  };
}

function shortInvoice(orderId: string) {
  // Steadfast invoice must be unique alpha-numeric (with -, _). Use full UUID (no dashes) trimmed.
  return orderId.replace(/-/g, '').slice(0, 24);
}

function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  // Convert +8801XXXXXXXXX or 8801XXXXXXXXX to 01XXXXXXXXX
  if (digits.length === 13 && digits.startsWith('880')) return '0' + digits.slice(3);
  if (digits.length === 12 && digits.startsWith('88')) return '0' + digits.slice(2);
  if (digits.length === 10 && digits.startsWith('1')) return '0' + digits;
  return digits;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Require admin auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authErr } = await userClient.auth.getClaims(token);
    if (authErr || !claims?.claims?.sub) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: claims.claims.sub,
      _role: 'admin',
    });
    if (!isAdmin) {
      return json({ error: 'Forbidden: admin only' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    const keys = await getSteadfastKeys(supabase);
    const headers = steadfastHeaders(keys);


    if (action === 'create_order') {
      const orderId = body.order_id as string;
      if (!orderId) return json({ error: 'order_id required' }, 400);

      const { data: order, error } = await supabase
        .from('orders').select('*').eq('id', orderId).maybeSingle();
      if (error || !order) return json({ error: 'Order not found' }, 404);

      if (order.consignment_id) {
        return json({ error: 'Order already dispatched', consignment_id: order.consignment_id }, 400);
      }

      const payload = {
        invoice: shortInvoice(order.id),
        recipient_name: order.full_name,
        recipient_phone: normalizePhone(order.phone),
        recipient_address: `${order.address}, ${order.city}`.slice(0, 250),
        cod_amount: order.payment_method === 'cod' ? Number(order.total_amount) : 0,
        note: order.notes || '',
      };

      const res = await fetch(`${BASE_URL}/create_order`, {
        method: 'POST', headers, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 200) {
        return json({ error: data.message || 'Steadfast error', details: data }, 400);
      }
      const c = data.consignment;
      await supabase.from('orders').update({
        consignment_id: String(c.consignment_id),
        tracking_code: c.tracking_code,
        courier_status: c.status,
        courier_sent_at: new Date().toISOString(),
        courier_status_checked_at: new Date().toISOString(),
      }).eq('id', orderId);

      return json({ success: true, consignment: c });
    }

    if (action === 'bulk_create') {
      const orderIds = body.order_ids as string[];
      if (!Array.isArray(orderIds) || orderIds.length === 0)
        return json({ error: 'order_ids required' }, 400);

      const { data: orders, error } = await supabase
        .from('orders').select('*').in('id', orderIds);
      if (error) return json({ error: error.message }, 400);

      const toSend = (orders || []).filter(o => !o.consignment_id);
      if (toSend.length === 0) return json({ error: 'No undispatched orders selected' }, 400);

      const data = toSend.map(o => ({
        invoice: shortInvoice(o.id),
        recipient_name: o.full_name,
        recipient_phone: normalizePhone(o.phone),
        recipient_address: `${o.address}, ${o.city}`.slice(0, 250),
        cod_amount: o.payment_method === 'cod' ? Number(o.total_amount) : 0,
        note: o.notes || '',
      }));

      const res = await fetch(`${BASE_URL}/create_order/bulk-order`, {
        method: 'POST', headers, body: JSON.stringify({ data: JSON.stringify(data) }),
      });
      const respJson = await res.json();
      const results = respJson?.data || respJson || [];

      // Map results back via invoice
      const invoiceToOrder = new Map(toSend.map(o => [shortInvoice(o.id), o.id]));
      const updates: any[] = [];
      for (const r of results) {
        const oid = invoiceToOrder.get(r.invoice);
        if (!oid || r.status !== 'success' || !r.consignment_id) continue;
        await supabase.from('orders').update({
          consignment_id: String(r.consignment_id),
          tracking_code: r.tracking_code,
          courier_status: 'in_review',
          courier_sent_at: new Date().toISOString(),
          courier_status_checked_at: new Date().toISOString(),
        }).eq('id', oid);
        updates.push(oid);
      }

      return json({ success: true, dispatched: updates.length, total: toSend.length, results });
    }

    if (action === 'refresh_status') {
      // Refresh statuses for all orders that have consignment_id and are not finalized
      const { data: orders } = await supabase
        .from('orders').select('id, consignment_id, courier_status')
        .not('consignment_id', 'is', null)
        .not('courier_status', 'in', '("delivered","cancelled","partial_delivered")');

      const updated: any[] = [];
      for (const o of (orders || [])) {
        try {
          const res = await fetch(`${BASE_URL}/status_by_cid/${o.consignment_id}`, { headers });
          const d = await res.json();
          if (d.status === 200 && d.delivery_status && d.delivery_status !== o.courier_status) {
            await supabase.from('orders').update({
              courier_status: d.delivery_status,
              courier_status_checked_at: new Date().toISOString(),
            }).eq('id', o.id);
            updated.push({ id: o.id, status: d.delivery_status });
          } else {
            await supabase.from('orders').update({
              courier_status_checked_at: new Date().toISOString(),
            }).eq('id', o.id);
          }
        } catch (_e) { /* skip */ }
      }
      return json({ success: true, updated });
    }

    if (action === 'get_balance') {
      const res = await fetch(`${BASE_URL}/get_balance`, { headers });
      const d = await res.json();
      return json(d);
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e: any) {
    return json({ error: e.message || 'Internal error' }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
