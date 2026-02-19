# UX Setup Checklist - Muay Thai Pai

## 📅 CALENDLY SETUP (30 minutes)

### Step 1: Create Calendly Account
1. Go to [calendly.com](https://calendly.com)
2. Sign up with your gym email
3. Choose the Basic plan (free) or Pro ($8/month for more features)

### Step 2: Create Event Types
Create these event types in Calendly:

**Group Session**
- Duration: 60 minutes
- Available times: 8:00 AM, 3:00 PM only
- Buffer time: 15 minutes before/after
- Location: Muay Thai Pai, Pai, Thailand

**Private Lesson - Beginner**
- Duration: 60 minutes
- Available times: 7:00 AM - 6:00 PM
- Price: ฿600 (display only)

**Private Lesson - Advanced**
- Duration: 90 minutes
- Available times: 7:00 AM - 6:00 PM
- Price: ฿900 (display only)

**Kids Class**
- Duration: 45 minutes
- Available times: 4:00 PM - 6:00 PM
- Price: ฿500 (display only)

**Certificate Program Consultation**
- Duration: 30 minutes
- Available times: 9:00 AM - 5:00 PM
- Free consultation

### Step 3: Configure Notifications
In Calendly Settings > Notifications:
- ✅ Email confirmations to you
- ✅ Email confirmations to invitees
- ✅ Email reminders (24h and 1h before)
- ✅ SMS notifications (if available in Thailand)

### Step 4: Update Environment Variables
Add to your `.env.local`:
```
NEXT_PUBLIC_CALENDLY_USERNAME=your-calendly-username
```

## 📧 EMAIL SERVICE SETUP (20 minutes)

### Option 1: Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain `muaythaipai.com`
3. Get API key
4. Add to `.env.local`:
```
RESEND_API_KEY=your_resend_api_key
```

### Option 2: SendGrid (Alternative)
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify sender identity
3. Get API key
4. Add to `.env.local`:
```
SENDGRID_API_KEY=your_sendgrid_api_key
```

## 🔔 NOTIFICATION SETUP

### Email Notifications You'll Get:
- ✅ New booking confirmations
- ✅ Payment notifications
- ✅ Customer inquiries from contact form
- ✅ Cancellation requests

### Mobile Notifications (Optional):
- Set up Calendly mobile app
- Enable push notifications
- Connect WhatsApp Business for instant alerts

## 🧪 TESTING CHECKLIST

### Before Going Live:
- [ ] Test Calendly booking flow
- [ ] Test email confirmations
- [ ] Test payment notifications
- [ ] Test contact form emails
- [ ] Verify mobile notifications work

### Test Scenarios:
1. **Customer books Group Session**
   - Should get Calendly confirmation
   - Should get payment confirmation email
   - You should get staff notification

2. **Customer books Private Lesson**
   - Should see available time slots
   - Should get booking confirmation
   - Should get reminder emails

3. **Customer contacts via form**
   - Should get auto-reply
   - You should get notification

## 📱 MOBILE OPTIMIZATION

### Calendly Mobile:
- Download Calendly mobile app
- Enable notifications
- Test booking flow on mobile

### WhatsApp Business:
- Set up WhatsApp Business account
- Add quick replies for common questions
- Link to booking system

## 🎯 SUCCESS METRICS TO TRACK

### Week 1:
- Number of bookings via Calendly
- Email open rates
- Response time to inquiries

### Month 1:
- Booking conversion rate
- Customer satisfaction
- No-show rate

## 🚨 TROUBLESHOOTING

### Common Issues:
1. **Calendly not loading**: Check username in environment variables
2. **Emails not sending**: Verify API keys and domain verification
3. **Notifications not working**: Check spam folders and notification settings

### Support Contacts:
- Calendly Support: help.calendly.com
- Resend Support: resend.com/support
- Your developer: [your contact info]
