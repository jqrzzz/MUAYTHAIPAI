# Stripe Webhook Setup Guide

## ✅ COMPLETED STEPS
You've already completed these steps successfully:

1. **Created webhook endpoint in Stripe** ✅
   - URL: https://www.paimuaythai.com/api/webhooks/stripe
   - Status: Active
   - Events: 22 events selected (including payment_intent.succeeded)

2. **Got webhook secret** ✅
   - Secret: whsec_u4RN2gdBI3nFpoljNlfEywo69z6sNvxh

## 🔄 NEXT STEPS

### Step 1: Add Environment Variable
Add this to your `.env.local` file:
```
STRIPE_WEBHOOK_SECRET=whsec_u4RN2gdBI3nFpoljNlfEywo69z6sNvxh
```

### Step 2: Deploy Your Changes
After adding the environment variable, deploy your site so the webhook can receive the secret.

### Step 3: Test a Real Payment
1. Go to your booking page
2. Use test card: 4242 4242 4242 4242
3. Complete a test booking
4. Check your server logs for webhook events
5. Verify booking confirmation emails are sent

## 🔍 TROUBLESHOOTING

If webhook fails:
- Check environment variables are set in Vercel dashboard
- Verify webhook URL is correct in Stripe dashboard
- Check server logs for errors
- Ensure site is deployed with latest changes
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## 📋 WEBHOOK EVENTS YOU'RE LISTENING FOR

From your screenshot, you have these events selected:
- ✅ checkout.session.completed
- ✅ checkout.session.async_payment_succeeded  
- ✅ checkout.session.async_payment_failed
- ✅ checkout.session.expired
- ✅ payment_intent.succeeded
- ✅ payment_intent.payment_failed
- ✅ payment_intent.amount_capturable_updated

This is perfect for handling all payment scenarios!
