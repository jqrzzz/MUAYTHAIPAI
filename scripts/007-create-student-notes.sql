-- Student notes table for trainer observations
-- Trainers can add notes in Thai, AI helps translate/analyze

create table if not exists student_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  student_id uuid not null references users(id) on delete cascade,
  trainer_id uuid references users(id),
  
  -- Note content
  content text not null,
  content_language text default 'th',  -- th, en, etc.
  
  -- AI-generated fields (filled automatically)
  content_translated text,  -- English translation if original is Thai
  summary text,  -- Short AI summary
  tags text[],  -- AI-extracted tags like ["clinch", "needs work", "improving"]
  sentiment text,  -- positive, neutral, needs_attention
  
  -- Context
  booking_id uuid references bookings(id),  -- Optional link to specific session
  note_type text default 'session',  -- session, progress, injury, general
  
  created_at timestamptz default now()
);

-- Enable RLS
alter table student_notes enable row level security;

-- Policies
create policy "Staff can manage student notes"
  on student_notes for all
  using (
    org_id in (
      select org_id from org_members 
      where user_id = auth.uid() 
      and role in ('owner', 'admin', 'trainer')
    )
  );

create policy "Students can view own notes"
  on student_notes for select
  using (student_id = auth.uid());

-- Indexes
create index idx_student_notes_student on student_notes(student_id);
create index idx_student_notes_org on student_notes(org_id);
create index idx_student_notes_created on student_notes(created_at desc);
