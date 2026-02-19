-- Gym subscriptions tracking
create table if not exists gym_subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid unique not null references organizations(id) on delete cascade,
  
  -- Subscription status
  status text default 'trial',  -- trial, active, past_due, cancelled
  
  -- Trial period
  trial_starts_at timestamptz default now(),
  trial_ends_at timestamptz default (now() + interval '30 days'),
  
  -- Billing
  price_thb integer default 999,
  billing_cycle text default 'monthly',
  current_period_start timestamptz,
  current_period_end timestamptz,
  
  -- Stripe
  stripe_customer_id text,
  stripe_subscription_id text,
  
  -- Metadata
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Blacklist for banned individuals
create table if not exists blacklist (
  id uuid primary key default gen_random_uuid(),
  
  -- Person info
  name text not null,
  photo_url text,
  nationality text,
  description text,  -- Why they're blacklisted
  
  -- Who added
  added_by_org_id uuid references organizations(id),
  added_by_user_id uuid references users(id),
  
  -- Status
  is_active boolean default true,
  
  created_at timestamptz default now()
);

-- Comments on blacklist entries
create table if not exists blacklist_comments (
  id uuid primary key default gen_random_uuid(),
  blacklist_id uuid not null references blacklist(id) on delete cascade,
  org_id uuid not null references organizations(id),
  user_id uuid references users(id),
  comment text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table gym_subscriptions enable row level security;
alter table blacklist enable row level security;
alter table blacklist_comments enable row level security;

-- Subscriptions: only platform admins can manage
create policy "Platform admins can manage subscriptions"
  on gym_subscriptions for all
  using (
    exists (select 1 from users where id = auth.uid() and is_platform_admin = true)
  );

-- Gym owners can view their own subscription
create policy "Org owners can view own subscription"
  on gym_subscriptions for select
  using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() 
      and role = 'owner'
    )
  );

-- Blacklist: all gym staff can view
create policy "All gym staff can view blacklist"
  on blacklist for select
  using (
    exists (
      select 1 from org_members 
      where user_id = auth.uid()
    )
  );

-- Blacklist: gym owners/admins can add
create policy "Gym staff can add to blacklist"
  on blacklist for insert
  with check (
    exists (
      select 1 from org_members 
      where user_id = auth.uid() 
      and role in ('owner', 'admin')
    )
  );

-- Platform admins can manage all blacklist
create policy "Platform admins can manage blacklist"
  on blacklist for all
  using (
    exists (select 1 from users where id = auth.uid() and is_platform_admin = true)
  );

-- Blacklist comments: staff can view
create policy "Staff can view blacklist comments"
  on blacklist_comments for select
  using (
    exists (select 1 from org_members where user_id = auth.uid())
  );

-- Blacklist comments: staff can add
create policy "Staff can add blacklist comments"
  on blacklist_comments for insert
  with check (
    exists (
      select 1 from org_members 
      where user_id = auth.uid() 
      and role in ('owner', 'admin', 'trainer')
    )
  );

-- Indexes
create index if not exists idx_gym_subscriptions_org on gym_subscriptions(org_id);
create index if not exists idx_gym_subscriptions_status on gym_subscriptions(status);
create index if not exists idx_blacklist_active on blacklist(is_active);
create index if not exists idx_blacklist_comments_blacklist on blacklist_comments(blacklist_id);
