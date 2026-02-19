-- Add currency tracking to bookings table
-- This allows distinguishing between THB (cash) and USD (online) payments

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_currency text DEFAULT 'THB';

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_amount_usd integer;

-- Update existing online payments to USD
-- payment_method = 'stripe' indicates online payment in USD
UPDATE bookings 
SET payment_currency = 'USD',
    payment_amount_usd = payment_amount_thb
WHERE payment_method = 'stripe' 
  AND payment_currency = 'THB';

COMMENT ON COLUMN bookings.payment_currency IS 'THB for cash, USD for online Stripe payments';
COMMENT ON COLUMN bookings.payment_amount_usd IS 'Amount in USD cents for online payments';
