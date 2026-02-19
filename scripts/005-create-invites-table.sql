-- Create invites table for trainer invitations
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  
  -- Invite details
  email text not null,
  role text not null default 'trainer',  -- trainer, admin
  
  -- Token for secure acceptance
  token text unique not null,
  
  -- Status tracking
  status text default 'pending',  -- pending, accepted, expired, cancelled
  
  -- Who invited
  invited_by uuid references users(id),
  
  -- Timestamps
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days'),
  accepted_at timestamptz,
  
  -- Prevent duplicate pending invites
  unique(org_id, email, status)
);

-- Enable RLS
alter table invites enable row level security;

-- Policies
create policy "Staff can view org invites"
  on invites for select
  using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() 
      and role in ('owner', 'admin')
    )
  );

create policy "Owners and admins can create invites"
  on invites for insert
  with check (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() 
      and role in ('owner', 'admin')
    )
  );

create policy "Owners and admins can update invites"
  on invites for update
  using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() 
      and role in ('owner', 'admin')
    )
  );

-- Allow public to read invites by token (for acceptance)
create policy "Anyone can view invite by token"
  on invites for select
  using (true);

-- Index for quick token lookups
create index idx_invites_token on invites(token);
create index idx_invites_email on invites(email);
