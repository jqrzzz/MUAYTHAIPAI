-- Add commission tracking to bookings table

-- Add commission fields
alter table bookings add column if not exists commission_rate numeric(5,4) default 0.15;
alter table bookings add column if not exists commission_amount_usd numeric(10,2);

-- Update existing USD bookings to calculate commission (15%)
update bookings 
set commission_amount_usd = round(payment_amount_usd * 0.15, 2),
    commission_rate = 0.15
where payment_currency = 'USD' 
  and payment_amount_usd is not null
  and commission_amount_usd is null;

-- Create payout tracking table
create table if not exists gym_payouts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  
  -- Period
  period_start date not null,
  period_end date not null,
  
  -- Amounts
  total_bookings integer default 0,
  total_collected_usd numeric(10,2) default 0,
  commission_usd numeric(10,2) default 0,
  payout_usd numeric(10,2) default 0,
  exchange_rate numeric(10,4),
  payout_thb numeric(10,2),
  
  -- Status
  status text default 'pending', -- pending, processing, paid
  paid_at timestamptz,
  paid_by uuid references users(id),
  payment_reference text, -- bank transfer reference
  notes text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for gym_payouts
alter table gym_payouts enable row level security;

create policy "Platform admins can manage payouts"
  on gym_payouts for all
  using (
    exists (select 1 from users where id = auth.uid() and is_platform_admin = true)
  );

create policy "Gym owners can view own payouts"
  on gym_payouts for select
  using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() 
      and role = 'owner'
    )
  );

-- Index for faster queries
create index if not exists idx_gym_payouts_org on gym_payouts(org_id);
create index if not exists idx_gym_payouts_period on gym_payouts(period_start, period_end);
create index if not exists idx_bookings_commission on bookings(org_id, payment_currency, created_at) where payment_currency = 'USD';
