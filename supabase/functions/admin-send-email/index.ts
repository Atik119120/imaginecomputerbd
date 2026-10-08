import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Payload {
  type: 'email_change' | 'recovery' | 'signup' | 'magiclink';
  email: string;          // target email (new email for change, user email otherwise)
  newEmail?: string;      // only for email_change
  redirectTo?: string;
}

const LOGO_URL = 'https://syoenzqclizidypesxqq.supabase.co/storage/v1/object/public/banners/email-logo.png';

const renderEmail = (opts: { title: string; intro: string; cta: string; link: string; siteName: string }) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${opts.title}</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(15,23,42,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#3b82f6 100%);padding:40px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="${opts.siteName}" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;" />
        </td></tr>
        <tr><td style="padding:40px 36px 28px 36px;">
          <h2 style="margin:0 0 16px;font-size:22px;color:#0f172a;font-weight:700;">${opts.title}</h2>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#475569;">${opts.intro}</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${opts.link}" style="display:inline-block;background:linear-gradient(135deg,#2563eb 0%,#3b82f6 100%);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:.5px;box-shadow:0 4px 14px rgba(37,99,235,0.35);">${opts.cta}</a>
          </div>
          <div style="margin:28px 0 0;padding:16px;background:#f8fafc;border-radius:8px;border-left:3px solid #3b82f6;">
            <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
              If the button doesn't work, copy this link:<br>
              <a href="${opts.link}" style="color:#2563eb;word-break:break-all;">${opts.link}</a>
            </p>
          </div>
          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;">
          © ${new Date().getFullYear()} ${opts.siteName} · Sent securely
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      throw new Error('Resend is not configured');
    }

    // Verify caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) throw new Error('Unauthorized');

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) throw new Error('Admin access required');

    const body: Payload = await req.json();
    const siteName = 'Unavailable Attire';
    const redirectTo = body.redirectTo || `${new URL(req.url).origin.replace(/\/functions\/v1.*/, '')}/admin`;

    // Generate the action link via Supabase Admin API
    const linkPayload: any = {
      type: body.type,
      email: body.email,
      options: { redirectTo },
    };
    if (body.type === 'email_change' && body.newEmail) {
      linkPayload.newEmail = body.newEmail;
    }

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink(linkPayload);
    if (linkErr) throw linkErr;

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) throw new Error('Failed to generate verification link');

    // Pick template content
    let subject = '', title = '', intro = '', cta = '';
    switch (body.type) {
      case 'email_change':
        subject = `Confirm your new email · ${siteName}`;
        title = 'Confirm your new email address';
        intro = `You requested to change your account email to <strong>${body.newEmail}</strong>. Click below to confirm this change.`;
        cta = 'Confirm new email';
        break;
      case 'recovery':
        subject = `Reset your password · ${siteName}`;
        title = 'Reset your password';
        intro = 'We received a request to reset your password. Click below to set a new one.';
        cta = 'Reset password';
        break;
      case 'signup':
        subject = `Verify your email · ${siteName}`;
        title = 'Welcome — verify your email';
        intro = 'Thanks for signing up. Please verify your email address to activate your account.';
        cta = 'Verify email';
        break;
      case 'magiclink':
        subject = `Your sign-in link · ${siteName}`;
        title = 'Sign in to your account';
        intro = 'Click the button below to sign in securely. This link will expire shortly.';
        cta = 'Sign in';
        break;
      default:
        throw new Error('Unsupported email type');
    }

    const html = renderEmail({ title, intro, cta, link: actionLink, siteName });

    const recipient = body.type === 'email_change' && body.newEmail ? body.newEmail : body.email;

    // Extract just the email address from RESEND_FROM_EMAIL (strip any existing name)
    const emailMatch = RESEND_FROM_EMAIL.match(/<([^>]+)>/);
    const fromAddress = emailMatch ? emailMatch[1] : RESEND_FROM_EMAIL.trim();
    const fromHeader = `${siteName} <${fromAddress}>`;

    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromHeader,
        reply_to: fromAddress,
        to: [recipient],
        subject,
        html,
      }),
    });
    const sendJson = await sendRes.json();
    if (!sendRes.ok) {
      console.error('Resend error:', sendJson);
      throw new Error(sendJson?.message || 'Failed to send email');
    }

    return new Response(JSON.stringify({ success: true, recipient }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('admin-send-email error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
