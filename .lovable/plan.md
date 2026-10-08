# Fix instant order emails

## Changes
- Use the valid linked Resend connection and its verified `bepro.click` sending address.
- Require a customer email at checkout so every successful order has an invoice recipient.
- Preserve the order, but report email delivery acceptance accurately instead of silently claiming success.
- Add safe order-level logs, redeploy the email function, then test both customer and admin messages against a real recent order.

## Technical details
- Update `send-notification-email` to read `RESEND_API_KEY_1`, return provider status safely, and log provider acceptance IDs without exposing secrets.
- Update checkout validation and invocation handling so failed email calls are visible and bounded retries only apply where appropriate.
