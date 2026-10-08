// Unified transactional email function for Gadget er Dokan
// Handles: welcome, order_confirmation, order_accepted, order_status, support_message, admin_reply
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SITE_NAME = 'Gadget er Dokan';
const SITE_URL = 'https://gadgeterdokanbd.com';
const STORE_ALERT_EMAIL = 'gadgeterdokan1@gmail.com';
const LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/banners/email-logo.png`;
// Brand palette: yellow / black / white
const BRAND_PRIMARY = '#111111';   // black
const BRAND_MID = '#1f1f1f';       // soft black
const BRAND_ACCENT = '#FFCC00';    // brand yellow
const BRAND_SOFT = '#FFF9E0';      // pale yellow

type NotifType =
  | 'welcome'
  | 'order_confirmation'
  | 'order_accepted'
  | 'order_status'
  | 'support_message'
  | 'admin_reply'
  | 'new_order';

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  selected_size?: string | null;
  selected_color?: string | null;
}

interface Payload {
  type: NotifType;
  to?: string;            // single recipient
  toList?: string[];      // multiple (used for support to admins)
  data: Record<string, any>;
}

// ---------- shared layout (blue editorial, dark-mode safe) ----------
const layout = (title: string, body: string, preheader = '') => `
<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${title}</title>
<style>
  :root { color-scheme: light only; supported-color-schemes: light; }
  body, table, td { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  /* Force light styles even in Gmail/Outlook dark mode */
  u + .body .ua-card { background:#ffffff !important; }
  [data-ogsc] .ua-card { background:#ffffff !important; }
  .ua-text { color:#0a2540 !important; }
  .ua-muted { color:#5a6b85 !important; }
  @media only screen and (max-width:620px) {
    .ua-pad { padding:28px 20px 24px !important; }
    .ua-header-pad { padding:32px 18px 28px !important; }
    .ua-logo { width:150px !important; max-width:150px !important; }
    .ua-logo-box { padding:12px 20px !important; }
    .ua-th, .ua-td { padding:10px 8px !important; font-size:12px !important; }
    .ua-h2 { font-size:20px !important; }
  }
</style>
</head>
<body class="body" style="margin:0;padding:0;background:#eef3fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0a2540;">
<span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;font-size:1px;line-height:1px;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef3fb;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="ua-card" style="width:100%;max-width:600px;background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 20px 60px -20px rgba(10,37,64,0.35);">
      <!-- top accent bar -->
      <tr><td style="height:6px;background:linear-gradient(90deg,${BRAND_PRIMARY} 0%,${BRAND_MID} 50%,${BRAND_ACCENT} 100%);font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td></tr>
      <!-- header with logo -->
      <tr><td class="ua-header-pad" style="background:linear-gradient(135deg,${BRAND_PRIMARY} 0%,${BRAND_MID} 60%,#2563b8 100%);padding:40px 28px 36px;text-align:center;">
        <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr><td class="ua-logo-box" style="background:#06182e;border:2px solid ${BRAND_ACCENT};border-radius:14px;padding:18px 28px;">
            <img src="${LOGO_URL}" alt="${SITE_NAME}" width="170" class="ua-logo" style="display:block;width:170px;height:auto;max-width:170px;border:0;outline:none;text-decoration:none;" />
          </td></tr>
        </table>
        <p style="margin:18px 0 0;color:#ffffff;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:600;">${SITE_NAME}</p>
        <p style="margin:4px 0 0;color:${BRAND_ACCENT};font-size:10px;letter-spacing:2px;text-transform:uppercase;">— Gadgets & Tech —</p>
      </td></tr>
      <!-- body -->
      <tr><td class="ua-pad ua-text" style="padding:36px 32px 32px;background:#ffffff;color:#0a2540;border-left:4px solid ${BRAND_ACCENT};">${body}</td></tr>
      <!-- footer -->
      <tr><td style="background:linear-gradient(135deg,#06182e 0%,${BRAND_PRIMARY} 100%);padding:24px 20px;text-align:center;">
        <p style="margin:0 0 6px;color:${BRAND_ACCENT};font-size:12px;font-weight:700;letter-spacing:3px;">${SITE_NAME.toUpperCase()}</p>
        <p style="margin:0 0 10px;color:#d9d9d9;font-size:11px;letter-spacing:1px;">Genuine gadgets · Fast delivery</p>
        <p style="margin:0;color:#b0b0b0;font-size:11px;">© ${new Date().getFullYear()} · <a href="${SITE_URL}" style="color:${BRAND_ACCENT};text-decoration:none;">gadgeterdokanbd.com</a></p>
        <p style="margin:8px 0 0;color:#8a8a8a;font-size:10px;">Powered by <span style="color:${BRAND_ACCENT};">Astropixel</span></p>
      </td></tr>
    </table>
    <p style="margin:12px 0 0;color:#b0b0b0;font-size:10px;letter-spacing:1px;">You received this because you interacted with ${SITE_NAME}.</p>
  </td></tr>
</table>
</body></html>`;

const button = (href: string, label: string) => `
<div style="text-align:center;margin:30px 0;">
  <a href="${href}" style="display:inline-block;background:${BRAND_ACCENT};color:#111111;text-decoration:none;padding:15px 40px;border-radius:2px;font-weight:600;font-size:13px;letter-spacing:2px;text-transform:uppercase;box-shadow:0 8px 20px rgba(0,0,0,0.15);border:1px solid #111111;">${label} →</a>
</div>`;

const escape = (s: any) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' } as any)[c]);

// ---------- templates ----------
const tplWelcome = (d: any) => ({
  subject: `Welcome to ${SITE_NAME} — let's get styled ✨`,
  html: layout(
    'Welcome',
    `<h2 style="margin:0 0 12px;font-size:24px;color:${BRAND_PRIMARY};font-weight:700;">Welcome, ${escape(d.name || 'friend')}!</h2>
     <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#444;">Your ${SITE_NAME} account is ready. We bring you genuine gadgets — smart watches, earbuds, chargers and more.</p>
     <div style="margin:20px 0;padding:18px;background:#FFF9E0;border-left:3px solid ${BRAND_ACCENT};border-radius:6px;">
       <p style="margin:0;font-size:14px;color:#555;">🎁 <strong>First-time perk:</strong> Free delivery inside Dhaka on your first order over ৳1500.</p>
     </div>
     ${button(`${SITE_URL}/shop`, 'Start shopping')}
     <p style="margin:24px 0 0;font-size:12px;color:#888;">Need help? Just reply to this email.</p>`,
    `Welcome to ${SITE_NAME}, ${d.name || ''}`
  ),
});

const tplOrderConfirmation = (d: any) => {
  const items = (d.items || []) as OrderItem[];
  const rows = items.map((it) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:13px;color:#333;">
        ${escape(it.product_name)}
        ${it.selected_size || it.selected_color ? `<br><span style="font-size:11px;color:#888;">${[it.selected_size, it.selected_color].filter(Boolean).map(escape).join(' · ')}</span>` : ''}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:13px;text-align:center;color:#555;">${it.quantity}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:13px;text-align:right;color:#333;font-weight:600;">৳${(it.price * it.quantity).toFixed(0)}</td>
    </tr>`).join('');
  const shortId = String(d.orderId || '').slice(0, 8).toUpperCase();
  return {
    subject: `Order #${shortId} confirmed · ${SITE_NAME}`,
    html: layout(
      'Order Confirmed',
      `<h2 style="margin:0 0 8px;font-size:22px;color:${BRAND_PRIMARY};font-weight:700;">Order received! 🎉</h2>
       <p style="margin:0 0 6px;font-size:14px;color:#555;">Hi ${escape(d.customerName || 'there')}, thanks for ordering with us.</p>
       <p style="margin:0 0 22px;font-size:13px;color:#888;">Order ID: <strong style="color:${BRAND_PRIMARY};font-family:monospace;">#${shortId}</strong></p>
       <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;margin:0 0 20px;">
         <thead><tr style="background:#FFF9E0;">
           <th style="padding:10px 8px;text-align:left;font-size:11px;color:${BRAND_PRIMARY};text-transform:uppercase;letter-spacing:.5px;">Product</th>
           <th style="padding:10px 8px;text-align:center;font-size:11px;color:${BRAND_PRIMARY};text-transform:uppercase;letter-spacing:.5px;">Qty</th>
           <th style="padding:10px 8px;text-align:right;font-size:11px;color:${BRAND_PRIMARY};text-transform:uppercase;letter-spacing:.5px;">Total</th>
         </tr></thead>
         <tbody>${rows}</tbody>
       </table>
       <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
         <tr><td style="padding:4px 8px;font-size:13px;color:#666;">Subtotal</td><td style="padding:4px 8px;font-size:13px;text-align:right;color:#333;">৳${Number(d.subtotal || 0).toFixed(0)}</td></tr>
         <tr><td style="padding:4px 8px;font-size:13px;color:#666;">Shipping</td><td style="padding:4px 8px;font-size:13px;text-align:right;color:#333;">৳${Number(d.shippingCost || 0).toFixed(0)}</td></tr>
         ${d.discount ? `<tr><td style="padding:4px 8px;font-size:13px;color:#0a8a3a;">Discount</td><td style="padding:4px 8px;font-size:13px;text-align:right;color:#0a8a3a;">-৳${Number(d.discount).toFixed(0)}</td></tr>` : ''}
         <tr><td style="padding:10px 8px;border-top:2px solid ${BRAND_PRIMARY};font-size:15px;color:${BRAND_PRIMARY};font-weight:700;">Total</td><td style="padding:10px 8px;border-top:2px solid ${BRAND_PRIMARY};font-size:15px;text-align:right;color:${BRAND_PRIMARY};font-weight:700;">৳${Number(d.total || 0).toFixed(0)}</td></tr>
       </table>
       <div style="margin:20px 0;padding:14px 16px;background:#FFF9E0;border-radius:8px;font-size:13px;color:#555;line-height:1.6;">
         <strong style="color:${BRAND_PRIMARY};">Delivery:</strong> ${escape(d.address || '')}, ${escape(d.city || '')}<br>
         <strong style="color:${BRAND_PRIMARY};">Phone:</strong> ${escape(d.phone || '')}<br>
         <strong style="color:${BRAND_PRIMARY};">Payment:</strong> ${escape((d.paymentMethod || 'cod').toUpperCase())}
       </div>
       ${button(`${SITE_URL}/order-tracking?id=${d.orderId}`, 'Track your order')}
       <p style="margin:0;font-size:12px;color:#888;text-align:center;">An invoice is attached to this email. Keep it for your records.</p>`,
      `Your order #${shortId} is confirmed`
    ),
  };
};

const tplOrderAccepted = (d: any) => {
  const shortId = String(d.orderId || '').slice(0, 8).toUpperCase();
  const trackingUrl = d.trackingUrl || `${SITE_URL}/order-tracking?id=${d.orderId}`;
  return {
    subject: `Your order #${shortId} is on the way 🚚`,
    html: layout(
      'Order accepted',
      `<h2 style="margin:0 0 12px;font-size:22px;color:${BRAND_PRIMARY};font-weight:700;">Your order is on the way!</h2>
       <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#444;">Hi ${escape(d.customerName || 'there')}, great news — your order <strong>#${shortId}</strong> has been accepted and dispatched to courier.</p>
       ${d.trackingCode ? `
       <div style="margin:18px 0;padding:18px;background:#FFF9E0;border-radius:10px;text-align:center;">
         <p style="margin:0 0 6px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Tracking Code</p>
         <p style="margin:0;font-size:18px;color:${BRAND_PRIMARY};font-weight:700;font-family:monospace;letter-spacing:1px;">${escape(d.trackingCode)}</p>
       </div>` : ''}
       ${button(trackingUrl, 'Track shipment')}
       <p style="margin:24px 0 0;font-size:13px;color:#666;text-align:center;">Estimated delivery: <strong>1–3 business days</strong></p>`,
      `Order #${shortId} has shipped`
    ),
  };
};

const STATUS_COPY: Record<string, { title: string; line: string; badge: string }> = {
  pending: { title: 'Order received', line: 'We have received your order and it is awaiting confirmation.', badge: '#8a8a8a' },
  processing: { title: 'Order is being processed', line: 'Good news — we are preparing your order for shipment.', badge: '#2563b8' },
  shipped: { title: 'Order shipped', line: 'Your order has been handed over to the courier and is on its way.', badge: '#0a8a3a' },
  delivered: { title: 'Order delivered', line: 'Your order has been delivered. We hope you love it!', badge: '#0a8a3a' },
  cancelled: { title: 'Order cancelled', line: 'Your order has been cancelled. If this was a mistake, please contact us.', badge: '#c62828' },
};

const tplOrderStatus = (d: any) => {
  const shortId = String(d.orderId || '').slice(0, 8).toUpperCase();
  const status = String(d.status || 'pending').toLowerCase();
  const copy = STATUS_COPY[status] || { title: 'Order update', line: `Your order status is now "${status}".`, badge: '#8a8a8a' };
  return {
    subject: `Order #${shortId} — ${copy.title} · ${SITE_NAME}`,
    html: layout(
      copy.title,
      `<h2 style="margin:0 0 12px;font-size:22px;color:${BRAND_PRIMARY};font-weight:700;">${escape(copy.title)}</h2>
       <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">Hi ${escape(d.customerName || 'there')}, ${copy.line}</p>
       <div style="margin:18px 0;padding:16px;background:${BRAND_SOFT};border-left:4px solid ${BRAND_ACCENT};border-radius:8px;">
         <p style="margin:0 0 6px;font-size:12px;color:#777;">Order ID</p>
         <p style="margin:0 0 10px;font-size:16px;font-family:monospace;font-weight:700;color:${BRAND_PRIMARY};">#${shortId}</p>
         <span style="display:inline-block;background:${copy.badge};color:#fff;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding:5px 12px;border-radius:99px;font-weight:700;">${escape(status)}</span>
       </div>
       ${d.trackingCode ? `<p style="margin:0 0 12px;font-size:13px;color:#555;">Tracking code: <strong style="font-family:monospace;">${escape(d.trackingCode)}</strong></p>` : ''}
       ${d.total ? `<p style="margin:0 0 12px;font-size:13px;color:#555;">Order total: <strong>৳${Number(d.total).toFixed(0)}</strong></p>` : ''}
       ${button(`${SITE_URL}/order-tracking?id=${d.orderId}`, 'Track your order')}
       <p style="margin:20px 0 0;font-size:12px;color:#888;text-align:center;">Questions? Just reply to this email.</p>`,
      `Order #${shortId}: ${copy.title}`
    ),
  };
};

const tplSupportMessage = (d: any) => ({
  subject: `New support message from ${d.visitorName || 'a customer'}`,
  html: layout(
    'New support message',
    `<h2 style="margin:0 0 12px;font-size:20px;color:${BRAND_PRIMARY};font-weight:700;">📩 New customer message</h2>
     <div style="margin:18px 0;padding:16px;background:#FFF9E0;border-left:3px solid ${BRAND_ACCENT};border-radius:6px;">
       <p style="margin:0 0 6px;font-size:13px;color:#888;"><strong style="color:#333;">${escape(d.visitorName || 'Guest')}</strong>${d.visitorContact ? ` · ${escape(d.visitorContact)}` : ''}</p>
       <p style="margin:8px 0 0;font-size:15px;color:#333;line-height:1.6;white-space:pre-wrap;">${escape(d.message)}</p>
     </div>
     ${button(`${SITE_URL}/admin/chat`, 'Reply in admin panel')}`,
    `New message: ${String(d.message || '').slice(0, 80)}`
  ),
});

const tplAdminReply = (d: any) => ({
  subject: `${SITE_NAME} replied to your message`,
  html: layout(
    'Reply from support',
    `<h2 style="margin:0 0 12px;font-size:20px;color:${BRAND_PRIMARY};font-weight:700;">We got back to you 💬</h2>
     <p style="margin:0 0 16px;font-size:14px;color:#555;">Hi ${escape(d.customerName || 'there')}, our support team replied to your message:</p>
     <div style="margin:18px 0;padding:18px;background:#FFF9E0;border-left:3px solid ${BRAND_ACCENT};border-radius:6px;">
       <p style="margin:0;font-size:15px;color:#333;line-height:1.6;white-space:pre-wrap;">${escape(d.reply)}</p>
     </div>
     ${button(`${SITE_URL}`, 'Continue the conversation')}
     <p style="margin:20px 0 0;font-size:12px;color:#888;">Just open the chat widget on our site to reply.</p>`,
    `Reply from ${SITE_NAME} support`
  ),
});

const tplNewOrderAlert = (d: any) => {
  const items = (d.items || []) as OrderItem[];
  const shortId = String(d.orderId || '').slice(0, 8).toUpperCase();
  const rows = items.map((it) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:13px;">${escape(it.product_name)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:13px;text-align:center;">${it.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">৳${(it.price * it.quantity).toFixed(0)}</td>
    </tr>`).join('');
  return {
    subject: `🛒 New order #${shortId} · ৳${Number(d.total || 0).toFixed(0)}`,
    html: layout(
      'New order received',
      `<h2 style="margin:0 0 10px;font-size:22px;color:${BRAND_PRIMARY};font-weight:700;">New order on the website 🛒</h2>
       <p style="margin:0 0 18px;font-size:14px;color:#555;">Order <strong style="font-family:monospace;">#${shortId}</strong> was just placed.</p>
       <div style="margin:0 0 18px;padding:16px;background:${BRAND_SOFT};border-left:4px solid ${BRAND_ACCENT};border-radius:8px;font-size:13px;color:#444;line-height:1.7;">
         <strong>Customer:</strong> ${escape(d.customerName || '')}<br>
         <strong>Phone:</strong> ${escape(d.phone || '')}<br>
         ${d.email ? `<strong>Email:</strong> ${escape(d.email)}<br>` : ''}
         <strong>Address:</strong> ${escape(d.address || '')}, ${escape(d.city || '')}<br>
         <strong>Payment:</strong> ${escape((d.paymentMethod || 'cod').toUpperCase())}
       </div>
       <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;margin:0 0 16px;">
         <thead><tr style="background:${BRAND_SOFT};">
           <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;">Product</th>
           <th style="padding:10px 8px;text-align:center;font-size:11px;text-transform:uppercase;">Qty</th>
           <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;">Total</th>
         </tr></thead>
         <tbody>${rows}</tbody>
       </table>
       <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:${BRAND_PRIMARY};">Grand total: ৳${Number(d.total || 0).toFixed(0)}</p>
       ${button(`${SITE_URL}/admin`, 'Open admin panel')}`,
      `New order #${shortId} — ৳${Number(d.total || 0).toFixed(0)}`
    ),
  };
};

// ---------- simple PDF-like invoice (HTML) attached as .html (printable) ----------
// Resend supports attachments with base64 content
const buildInvoiceHTML = (d: any) => {
  const items = (d.items || []) as OrderItem[];
  const shortId = String(d.orderId || '').slice(0, 8).toUpperCase();
  const rows = items.map((it) => `
    <tr>
      <td>${escape(it.product_name)}${it.selected_size || it.selected_color ? ` <small>(${[it.selected_size, it.selected_color].filter(Boolean).join(', ')})</small>` : ''}</td>
      <td style="text-align:center">${it.quantity}</td>
      <td style="text-align:right">৳${it.price.toFixed(0)}</td>
      <td style="text-align:right">৳${(it.price * it.quantity).toFixed(0)}</td>
    </tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${shortId}</title>
<style>
body{font-family:Arial,sans-serif;color:#222;max-width:760px;margin:30px auto;padding:30px}
.head{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid ${BRAND_PRIMARY};padding-bottom:16px;margin-bottom:24px}
.head h1{margin:0;color:${BRAND_PRIMARY};font-size:28px}
.meta{font-size:12px;color:#666}
table{width:100%;border-collapse:collapse;margin:16px 0}
th{background:${BRAND_PRIMARY};color:#fff;padding:10px 8px;text-align:left;font-size:12px}
td{padding:10px 8px;border-bottom:1px solid #eee;font-size:13px}
.totals{width:300px;margin-left:auto}
.totals td{border:none;padding:6px 8px}
.grand{border-top:2px solid ${BRAND_PRIMARY};font-weight:700;color:${BRAND_PRIMARY};font-size:15px}
.foot{margin-top:30px;padding-top:16px;border-top:1px solid #ddd;text-align:center;font-size:11px;color:#888}
@media print{body{margin:0;padding:20px}}
</style></head><body>
<div class="head">
  <div><h1>${SITE_NAME}</h1><div class="meta">${SITE_URL}</div></div>
  <div style="text-align:right">
    <div style="font-size:20px;font-weight:700;color:#333">INVOICE</div>
    <div class="meta">#${shortId}</div>
    <div class="meta">${new Date().toLocaleDateString()}</div>
  </div>
</div>
<div style="display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px">
  <div><strong>Bill To:</strong><br>${escape(d.customerName || '')}<br>${escape(d.address || '')}<br>${escape(d.city || '')}<br>${escape(d.phone || '')}</div>
  <div style="text-align:right"><strong>Payment:</strong> ${escape((d.paymentMethod || 'COD').toUpperCase())}</div>
</div>
<table>
  <thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Subtotal</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<table class="totals">
  <tr><td>Subtotal</td><td style="text-align:right">৳${Number(d.subtotal || 0).toFixed(0)}</td></tr>
  <tr><td>Shipping</td><td style="text-align:right">৳${Number(d.shippingCost || 0).toFixed(0)}</td></tr>
  ${d.discount ? `<tr><td style="color:#0a8a3a">Discount</td><td style="text-align:right;color:#0a8a3a">-৳${Number(d.discount).toFixed(0)}</td></tr>` : ''}
  <tr class="grand"><td>TOTAL</td><td style="text-align:right">৳${Number(d.total || 0).toFixed(0)}</td></tr>
</table>
<div class="foot">Thank you for shopping with ${SITE_NAME} · This is a computer-generated invoice</div>
</body></html>`;
};

const b64encode = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};

// ---------- main handler ----------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !LOVABLE_API_KEY) throw new Error('Email service not configured');

    const body: Payload = await req.json();
    if (!body.type) throw new Error('Missing type');

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // --- AUTH GATE -----------------------------------------------------------
    // Admin-only types: must be invoked by an authenticated admin user.
    const ADMIN_ONLY_TYPES = new Set(['admin_reply', 'order_accepted', 'order_status']);
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    let callerIsAdmin = false;
    let callerUserId: string | null = null;
    if (token) {
      const { data: userData } = await admin.auth.getUser(token);
      callerUserId = userData?.user?.id ?? null;
      if (callerUserId) {
        const { data: isAdmin } = await admin.rpc('has_role', {
          _user_id: callerUserId,
          _role: 'admin',
        });
        callerIsAdmin = !!isAdmin;
      }
    }
    if (ADMIN_ONLY_TYPES.has(body.type) && !callerIsAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // -------------------------------------------------------------------------

    // Newly created orders may not be visible instantly — retry briefly.
    const fetchOrder = async (orderId: string) => {
      for (let attempt = 0; attempt < 4; attempt++) {
        const { data } = await admin.from('orders').select('id,email').eq('id', orderId).maybeSingle();
        if (data?.id) return data as { id: string; email: string | null };
        await new Promise((r) => setTimeout(r, 500));
      }
      return null;
    };

    // Resolve recipients
    let recipients: string[] = [];

    if (body.type === 'new_order') {
      // Store alert — recipient is fixed server-side; validate the order exists.
      const orderId = body.data?.orderId;
      let ok = false;
      if (orderId) {
        const ord = await fetchOrder(orderId);
        ok = !!ord?.id;
      }
      if (!ok) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: admins } = await admin.rpc('list_admin_users');
      const adminEmails = (admins || []).map((a: any) => a.email).filter(Boolean);
      recipients = Array.from(new Set([STORE_ALERT_EMAIL, ...adminEmails]));
    } else if (body.type === 'support_message') {
      // Always send to admins only — ignore any client-supplied recipient
      const { data: admins } = await admin.rpc('list_admin_users');
      recipients = Array.from(new Set([
        STORE_ALERT_EMAIL,
        ...(admins || []).map((a: any) => a.email).filter(Boolean),
      ]));
    } else if (callerIsAdmin) {
      // Admins may target any recipient
      if (body.toList && body.toList.length) recipients = body.toList;
      else if (body.to) recipients = [body.to];
    } else {
      // Anonymous/customer caller: only allow sending to a recipient that matches
      // an existing order or registered user — prevents arbitrary email spam.
      let requested = (body.to || (body.toList && body.toList[0]) || '').toLowerCase().trim();
      // Fallback: for order emails, take the address stored on the order itself.
      if (!requested && body.type === 'order_confirmation' && body.data?.orderId) {
        const ord = await fetchOrder(body.data.orderId);
        if (ord?.email) requested = ord.email.toLowerCase().trim();
      }
      if (!requested) throw new Error('No recipient provided');

      let allowed = false;
      if (body.type === 'order_confirmation') {
        const orderId = body.data?.orderId;
        if (orderId) {
          const ord = await fetchOrder(orderId);
          if (ord?.email && ord.email.trim().toLowerCase() === requested) allowed = true;
        }
      } else if (body.type === 'welcome') {
        if (callerUserId) {
          const { data: u } = await admin.auth.admin.getUserById(callerUserId).catch(() => ({ data: null } as any));
          if (u?.user?.email && u.user.email.toLowerCase() === requested) allowed = true;
        }
      }
      if (!allowed) {
        return new Response(JSON.stringify({ error: 'Recipient not permitted' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      recipients = [requested];
    }

    if (recipients.length === 0) throw new Error('No recipient resolved');

    // Build template
    let tpl: { subject: string; html: string };
    const data = body.data || {};
    switch (body.type) {
      case 'welcome':            tpl = tplWelcome(data); break;
      case 'order_confirmation': tpl = tplOrderConfirmation(data); break;
      case 'order_accepted':     tpl = tplOrderAccepted(data); break;
      case 'order_status':       tpl = tplOrderStatus(data); break;
      case 'support_message':    tpl = tplSupportMessage(data); break;
      case 'admin_reply':        tpl = tplAdminReply(data); break;
      case 'new_order':          tpl = tplNewOrderAlert(data); break;
      default: throw new Error('Unknown notification type');
    }

    // From header
    const emailMatch = RESEND_FROM_EMAIL.match(/<([^>]+)>/);
    const fromAddress = emailMatch ? emailMatch[1] : RESEND_FROM_EMAIL.trim();
    const fromHeader = `${SITE_NAME} <${fromAddress}>`;

    const payload: any = {
      from: fromHeader,
      reply_to: fromAddress,
      to: recipients,
      subject: tpl.subject,
      html: tpl.html,
    };

    // Attach invoice for order_confirmation
    if (body.type === 'order_confirmation') {
      const invoiceHtml = buildInvoiceHTML(data);
      payload.attachments = [{
        filename: `invoice-${String(data.orderId || 'order').slice(0, 8).toUpperCase()}.html`,
        content: b64encode(invoiceHtml),
      }];
    }

    // Resend is linked as a Lovable connector — route through the connector gateway.
    const sendRes = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!sendRes.ok) {
      const errBody = await sendRes.text();
      console.error(`Resend gateway failed [${sendRes.status}]: ${errBody}`);
      throw new Error(`Email provider error (${sendRes.status}): ${errBody}`);
    }
    const sendJson = await sendRes.json();


    return new Response(JSON.stringify({ success: true, recipients, id: sendJson.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('send-notification-email error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
