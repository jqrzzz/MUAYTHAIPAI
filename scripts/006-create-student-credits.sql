-- Student credits/packages tracking
-- Tracks balances for session packs, memberships, etc.

create table if not exists student_credits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  
  -- Credit type
  credit_type text not null default 'sessions', -- sessions, monthly, unlimited
  
  -- Balance
  credits_remaining integer default 0,          -- For session packs
  expires_at timestamptz,                       -- For monthly/time-limited
  
  -- Notes
  notes text,
  
  -- Status
  is_active boolean default true,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(org_id, user_id, credit_type)
);

-- Transaction log for credits (payments, deductions, adjustments)
create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  student_credit_id uuid references student_credits(id) on delete set null,
  
  -- Transaction details
  transaction_type text not null,               -- payment, deduction, adjustment, refund
  amount integer not null,                      -- Positive = add, Negative = subtract
  
  -- Payment info (if applicable)
  payment_method text,                          -- cash, card, transfer
  payment_amount_thb integer,
  
  -- Context
  description text,
  recorded_by uuid references users(id),        -- Staff who recorded this
  booking_id uuid references bookings(id),      -- If linked to a booking
  
  created_at timestamptz default now()
);

-- Enable RLS
alter table student_credits enable row level security;
alter table credit_transactions enable row level security;

-- Policies for student_credits
create policy "Staff can view org student credits"
  on student_credits for select
  using (
    org_id in (
      select org_id from org_members where user_id = auth.uid()
    )
  );

create policy "Staff can manage student credits"
  on student_credits for all
  using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() 
      and role in ('owner', 'admin', 'trainer')
    )
  );

create policy "Students can view own credits"
  on student_credits for select
  using (user_id = auth.uid());

-- Policies for credit_transactions
create policy "Staff can view org transactions"
  on credit_transactions for select
  using (
    org_id in (
      select org_id from org_members where user_id = auth.uid()
    )
  );

create policy "Staff can insert transactions"
  on credit_transactions for insert
  with check (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() 
      and role in ('owner', 'admin', 'trainer')
    )
  );

create policy "Students can view own transactions"
  on credit_transactions for select
  using (user_id = auth.uid());

-- Indexes
create index idx_student_credits_org on student_credits(org_id);
create index idx_student_credits_user on student_credits(user_id);
create index idx_credit_transactions_org on credit_transactions(org_id);
create index idx_credit_transactions_user on credit_transactions(user_id);
create index idx_credit_transactions_created on credit_transactions(created_at desc);
