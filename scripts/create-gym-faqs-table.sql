-- Create gym_faqs table for AI knowledge base
CREATE TABLE IF NOT EXISTS gym_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gym_faqs_org_id ON gym_faqs(org_id);
CREATE INDEX IF NOT EXISTS idx_gym_faqs_category ON gym_faqs(category);
CREATE INDEX IF NOT EXISTS idx_gym_faqs_active ON gym_faqs(is_active);

-- Enable RLS
ALTER TABLE gym_faqs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Staff can view org FAQs" ON gym_faqs
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage org FAQs" ON gym_faqs
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Public can view active FAQs (for AI responses on public pages)
CREATE POLICY "Public can view active FAQs" ON gym_faqs
  FOR SELECT USING (is_active = true);
