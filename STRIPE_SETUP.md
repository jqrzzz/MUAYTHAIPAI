# Stripe Setup Guide for Muay Thai Pai

## Step 1: Webhook Setup (5 minutes)

### What you need to do in Stripe Dashboard:

1. **Go to Stripe Dashboard** → https://dashboard.stripe.com
2. **Click "Developers" → "Webhooks"**
3. **Click "Add endpoint"**
4. **Enter your webhook URL:**
   ```
   https://www.paimuaythai.com/api/webhooks/stripe
   ```
5. **Select these events to listen for:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
6. **Click "Add endpoint"**
7. **Copy the "Signing secret"** (starts with `whsec_`)
8. **Add it to your environment variables:**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

## Step 2: Test the Payment Flow

1. **Use Stripe test card numbers:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date (e.g., 12/25)
   - Any 3-digit CVC

2. **Check your webhook logs** in Stripe dashboard to see if events are being received

## Step 3: Go Live Checklist

- [ ] Webhook endpoint added and working
- [ ] Test payments working
- [ ] Email confirmations working
- [ ] Calendar integration working
- [ ] Switch to live Stripe keys (remove test keys)

## Troubleshooting

**If webhooks aren't working:**
1. Check the URL is correct: `https://www.paimuaythai.com/api/webhooks/stripe`
2. Make sure STRIPE_WEBHOOK_SECRET is set correctly
3. Check webhook logs in Stripe dashboard for errors

**If payments aren't working:**
1. Check browser console for errors
2. Verify Stripe publishable key is correct
3. Make sure you're using test card numbers in test mode
