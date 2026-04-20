-- Add PromptPay and gallery fields to organizations
-- Run this migration manually in Supabase SQL Editor

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS promptpay_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
