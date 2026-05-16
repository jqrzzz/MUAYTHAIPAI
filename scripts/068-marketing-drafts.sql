-- =====================================================
-- 068-marketing-drafts
-- =====================================================
-- The third strand of the supply-side data flywheel. Every time
-- the promoter generates social copy for an event, the drafts
-- land here so we can later:
--   1. See which (platform, language) combos actually get copied
--      to clipboard / used vs ignored
--   2. Compare prompt versions: did v2 produce captions that the
--      promoter pasted more often than v1?
--   3. Score against event outcome — events whose marketing was
--      "used" sell at what rate vs events that ignored the AI?
--
-- One row per (event, platform, language, generation). Multiple
-- runs are kept as history — regenerating IS the loop. The status
-- column tracks whether the promoter ended up using the copy.

CREATE TABLE IF NOT EXISTS public.marketing_drafts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.fight_events(id) ON DELETE CASCADE,

  -- Platform shapes the tone + length expectation. We only ship
  -- the four that matter in Thailand:
  --   facebook  = long-form story, hashtags at bottom
  --   instagram = visual-first, tease the experience, hashtags grouped
  --   line      = direct announcement, plain-text, friend-texting tone
  --   twitter   = tight 280-char hook
  platform    TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'line', 'twitter')),

  -- en | th. We generate both per platform by default so the
  -- promoter has both ready for their respective audiences.
  language    TEXT NOT NULL CHECK (language IN ('en', 'th')),

  caption     TEXT NOT NULL,
  -- Stored as text[] so the platform-specific render can place
  -- them inline (Twitter) vs grouped at bottom (Instagram).
  hashtags    TEXT[],

  -- Lifecycle:
  --   draft  = fresh from the model, no promoter action yet
  --   used   = promoter clicked Copy (or marked-as-posted later)
  --   dismissed = promoter explicitly rejected this draft
  status      TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'used', 'dismissed')),

  prompt_version TEXT NOT NULL DEFAULT 'v1',
  generated_by   UUID REFERENCES public.users(id),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at     TIMESTAMPTZ
);

COMMENT ON TABLE public.marketing_drafts IS
  'AI-generated social media copy per (event, platform, language). Tracks copy/dismiss for the prompt-quality learning loop. Migration 068.';

-- The editor query: "show me the latest drafts for this event,
-- grouped by platform+language" with the newest on top so a
-- regenerate immediately bubbles up.
CREATE INDEX IF NOT EXISTS marketing_drafts_event_idx
  ON public.marketing_drafts (event_id, created_at DESC);

-- Cross-event analytics: "which prompt version produced the most
-- 'used' copy?" for the eventual prompt v2 selection.
CREATE INDEX IF NOT EXISTS marketing_drafts_used_idx
  ON public.marketing_drafts (status, prompt_version, created_at DESC)
  WHERE status = 'used';

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.marketing_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketing_drafts_promoter_select ON public.marketing_drafts;
CREATE POLICY marketing_drafts_promoter_select ON public.marketing_drafts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.fight_events fe
      JOIN public.org_members om ON om.org_id = fe.org_id
      WHERE fe.id = marketing_drafts.event_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin', 'promoter')
    )
  );

DROP POLICY IF EXISTS marketing_drafts_promoter_insert ON public.marketing_drafts;
CREATE POLICY marketing_drafts_promoter_insert ON public.marketing_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.fight_events fe
      JOIN public.org_members om ON om.org_id = fe.org_id
      WHERE fe.id = event_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin', 'promoter')
    )
  );

DROP POLICY IF EXISTS marketing_drafts_promoter_update ON public.marketing_drafts;
CREATE POLICY marketing_drafts_promoter_update ON public.marketing_drafts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.fight_events fe
      JOIN public.org_members om ON om.org_id = fe.org_id
      WHERE fe.id = marketing_drafts.event_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin', 'promoter')
    )
  );

DROP POLICY IF EXISTS marketing_drafts_promoter_delete ON public.marketing_drafts;
CREATE POLICY marketing_drafts_promoter_delete ON public.marketing_drafts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.fight_events fe
      JOIN public.org_members om ON om.org_id = fe.org_id
      WHERE fe.id = marketing_drafts.event_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin', 'promoter')
    )
  );
