# Supabase email template copy

Drop these into **Supabase Dashboard → Authentication → Email Templates**.
The defaults are generic and on-brand; this is the SaaS-flavored
replacement.

Variables Supabase substitutes at send time:
- `{{ .ConfirmationURL }}` — the magic link
- `{{ .Token }}` — the 6-digit code (used in OTP variant)
- `{{ .Email }}` — recipient
- `{{ .SiteURL }}` — `https://muaythaipai.com`

---

## Magic Link (sign in)

**Subject:**
```
Your sign-in link for MUAYTHAIPAI 🐃
```

**Body (HTML):**
```html
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:24px auto;color:#222;line-height:1.55">
  <p style="font-size:32px;margin:0 0 8px">🐃</p>
  <h1 style="font-size:22px;margin:0 0 16px;color:#111">Sign in to MUAYTHAIPAI</h1>
  <p style="margin:0 0 16px">Tap the button below to sign in. This link expires in 1 hour and only works once.</p>
  <p style="margin:24px 0">
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:10px">
      Sign in to your gym
    </a>
  </p>
  <p style="margin:0 0 16px;color:#666;font-size:13px">If the button doesn't work, copy and paste this link into your browser:<br>
    <span style="color:#888;word-break:break-all">{{ .ConfirmationURL }}</span>
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#999;font-size:12px;margin:0">If you didn't request this, you can safely ignore this email — nobody has been signed in.</p>
</div>
```

---

## Invite User (gym signup welcome)

This is the email new gyms get when they hit `/signup`. The default
sounds like a forgotten-password reminder; this version sounds like a
welcome.

**Subject:**
```
Welcome to MUAYTHAIPAI 🐃 — set up your gym
```

**Body (HTML):**
```html
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:24px auto;color:#222;line-height:1.55">
  <p style="font-size:32px;margin:0 0 8px">🐃</p>
  <h1 style="font-size:24px;margin:0 0 16px;color:#111">Welcome to the network!</h1>
  <p style="margin:0 0 16px">Your free 30-day trial starts now. Tap below to set up your gym — bookings, the Naga–Garuda cert ladder, and OckOck answering your customers in your gym&apos;s voice.</p>
  <p style="margin:24px 0">
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:10px">
      Set up my gym (60 sec)
    </a>
  </p>
  <p style="margin:0 0 8px;font-weight:600;color:#444">What's next:</p>
  <ul style="margin:0 0 16px;padding-left:20px;color:#444">
    <li>Add your services and hours (we&apos;ve got templates)</li>
    <li>Meet OckOck — your gym&apos;s receptionist</li>
    <li>Connect LINE / WhatsApp (optional, you can come back later)</li>
  </ul>
  <p style="margin:0 0 16px;color:#666;font-size:13px">No credit card needed. Cancel anytime.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#999;font-size:12px;margin:0">Questions? Reply to this email — a real human reads every reply.</p>
</div>
```

---

## Notes for the operator

1. **Sender address.** Set `FROM` to something like `OckOck <hello@muaythaipai.com>` in Supabase → Authentication → Email Settings → SMTP Settings (or use the built-in Supabase sender if you haven't wired SMTP yet).

2. **Plain-text fallback.** Supabase auto-generates a plain-text version, but it's worth pasting a clean version too. For each template:
   ```
   Welcome to MUAYTHAIPAI!

   Tap this link to set up your gym (60 seconds):
   {{ .ConfirmationURL }}

   No credit card needed. Cancel anytime.
   ```

3. **Subject lines without emoji** if your domain reputation is fragile — emoji in subjects can flag spam in some filters. Test deliverability first.

4. **The "Recovery" template** (password reset) is technically unused since we're magic-link only. Either copy the same Magic Link template or leave the default — nobody hits it.
