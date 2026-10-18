# Supabase Custom SMTP & Email Rate Limits

Registration (`POST /api/v1/auth/register`) calls `supabase.auth.signUp`, which makes
Supabase Auth send a **confirmation email**. When Supabase refuses to send it, the API
now returns a safe `429`:

```json
{
  "success": false,
  "code": "EMAIL_RATE_LIMITED",
  "message": "We couldn't send your verification email because too many sign-up emails were requested. Please wait a while before trying again.",
  "retryAfterSeconds": 3600
}
```

Supabase's underlying error is `over_email_send_rate_limit` / `email rate limit exceeded`.

## Why it happens

Supabase's **built-in mailer is for testing only** and is capped at a very small number
of emails per hour for the whole project (not per user). Every sign-up, resend,
password-recovery and magic-link email shares that quota. Real traffic exhausts it
quickly, and no application code change can raise it.

## Required fix: configure custom SMTP (Dashboard only)

> Do this in the Supabase Dashboard. Do **not** put SMTP credentials in code, `.env`
> files committed to git, or the backend/mobile/web bundles.

1. Pick a transactional email provider (e.g. Resend, SendGrid, Postmark, Amazon SES,
   Brevo) and verify your sending domain (SPF, DKIM, DMARC records).
2. Open **Supabase Dashboard → Project → Authentication → Emails → SMTP Settings**
   (older UI: *Project Settings → Authentication → SMTP Settings*).
3. Enable **Custom SMTP** and enter:
   - Sender email / sender name (an address on your verified domain)
   - Host, Port (usually 465 or 587), Username, Password (the provider's API/SMTP key)
4. Save, then raise the limit:
   **Authentication → Rate Limits → "Rate limit for sending emails"**.
   This setting becomes adjustable only after custom SMTP is enabled (default 30/hour).
   Size it to expected sign-ups per hour plus resends and password resets.
5. Review related limits on the same page (sign-ups/sign-ins per IP, OTP/magic-link
   resend interval) so they match the app's registration rate limiter
   (`registerRateLimiter`: 5 per hour per IP).
6. Keep **Confirm email** enabled (**Authentication → Providers → Email**). The
   backend relies on email verification and no longer creates pre-confirmed users.
7. Test: register a new account, confirm the email arrives, and check
   **Authentication → Logs** for send errors.

## Operational notes

- A repeated sign-up for an *unconfirmed* email re-sends the confirmation email and
  consumes quota. The app now blocks concurrent duplicate submissions (backend per-email
  in-flight lock, mobile/web submit locks) and does not retry registration automatically.
- Rate-limit incidents appear in backend logs once, as a `warn` entry
  (`Request rejected`, `statusCode: 429`, `errorCode: EMAIL_RATE_LIMITED`). Alert on
  that code to detect quota exhaustion before users report it.
- The in-flight lock is per backend instance. If you run multiple instances, the
  Supabase quota and `registerRateLimiter` remain the cross-instance protection.

## Deployment checklist

- [ ] Custom SMTP enabled and verified in the Supabase Dashboard
- [ ] Email send rate limit raised for expected load
- [ ] "Confirm email" still enabled
- [ ] Backend redeployed (this change removes the `email_confirm: true` admin fallback;
      with a broken mailer, registration now fails with an error instead of silently
      creating a pre-verified account)
- [ ] Mobile app release / web build shipped for the submit-lock and message changes
