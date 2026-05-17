-- =====================================================
-- 066-matchmaker-suggestions
-- =====================================================
-- The data flywheel for the AI matchmaker. Every time the promoter
-- asks Claude to suggest bouts for an event, the suggestions land
-- here — accepted, rejected, or dismissed — so we can:
--   1. Score future prompt versions against historical pick rates
--   2. Eventually fine-tune (or RAG) on the bouts that actually
--      shipped vs. the ones promoters threw away
--   3. Avoid re-suggesting the same pair twice in a row
--
-- This is the supply-side moat: every promoter who runs the
-- Matchmaker leaves a trail of "what good matchups look like"
-- that no competitor has access to.
--
-- Read side: only the promoters of the event's owning org can see
-- their own suggestion history. Each suggestion belongs to an event
-- (cascade-deleted), references two fighters (NOT cascade-deleted —
-- a fighter leaving the platform shouldn't blow away historical
-- training data; we set their reference to NULL instead).

CREATE TABLE IF NOT EXISTS public.matchmaker_suggestions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.fight_events(id) ON DELETE CASCADE,

  -- The pairing itself. Both fighters live in trainer_profiles.
  -- ON DELETE SET NULL so a fighter offboarding doesn't lose the
  -- training data on which suggestions were good vs bad.
  fighter_red_id  UUID REFERENCES public.trainer_profiles(id) ON DELETE SET NULL,
  fighter_blue_id UUID REFERENCES public.trainer_profiles(id) ON DELETE SET NULL,

  -- AI-generated metadata that came back with the suggestion
  weight_class      TEXT,
  scheduled_rounds  INTEGER DEFAULT 5,
  reasoning         TEXT,
  -- AI's own estimate of how much this matchup would draw.
  -- Useful for training: did "high"-rated ones actually convert?
  estimated_draw    TEXT CHECK (estimated_draw IN ('low', 'medium', 'high')),

  -- Outcome. 'pending' on creation; flipped by the accept/dismiss
  -- endpoints. 'accepted' creates a real event_bouts row + (if cross-
  -- gym) bout_invitations; 'dismissed' just gets recorded for
  -- learning so we know what to filter out next time.
  status         TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'dismissed')),

  -- The actual bout we created when accepted. Lets us trace
  -- "did this suggestion ship, and how did the event do" by joining
  -- to event_bouts -> ticket_orders.
  accepted_bout_id UUID REFERENCES public.event_bouts(id) ON DELETE SET NULL,

  -- Audit + future A/B testing. prompt_version lets us bump the
  -- prompt and measure pick-rate delta. generated_by lets us see
  -- which promoter triggered (the org owner usually).
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  generated_by   UUID REFERENCES public.users(id),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

COMMENT ON TABLE public.matchmaker_suggestions IS
  'AI matchmaker proposals + outcomes. Powers the supply-side data flywheel: every accept/dismiss is a training signal. Migration 066.';
COMMENT ON COLUMN public.matchmaker_suggestions.status IS
  'pending = freshly generated, awaiting promoter decision. accepted = promoter created the bout. dismissed = promoter rejected.';
COMMENT ON COLUMN public.matchmaker_suggestions.estimated_draw IS
  'AI-assigned demand signal (low / medium / high). Compared against actual ticket sales for the resulting bout to score the model.';

-- Index supports "show me the active suggestions for this event"
-- without scanning historical rows.
CREATE INDEX IF NOT EXISTS matchmaker_suggestions_event_status_idx
  ON public.matchmaker_suggestions (event_id, status, created_at DESC);

-- Index for the dedup check: "did we already suggest this pair?"
-- Used so the Matchmaker doesn't propose the same matchup twice in
-- a row when the promoter regenerates.
CREATE INDEX IF NOT EXISTS matchmaker_suggestions_pair_idx
  ON public.matchmaker_suggestions (event_id, fighter_red_id, fighter_blue_id);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.matchmaker_suggestions ENABLE ROW LEVEL SECURITY;

-- Promoter staff of the event's owning org can read their suggestion
-- history. Matches the read pattern used for ticket_interest /
-- bout_invitations.
DROP POLICY IF EXISTS matchmaker_suggestions_promoter_select ON public.matchmaker_suggestions;
CREATE POLICY matchmaker_suggestions_promoter_select ON public.matchmaker_suggestions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.fight_events fe
      JOIN public.org_members om ON om.org_id = fe.org_id
      WHERE fe.id = matchmaker_suggestions.event_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin', 'promoter')
    )
  );

-- Inserts happen from the matchmaker endpoint, which uses the
-- service-role client server-side. Authenticated INSERT policy is
-- here for symmetry but service-role bypasses it.
DROP POLICY IF EXISTS matchmaker_suggestions_promoter_insert ON public.matchmaker_suggestions;
CREATE POLICY matchmaker_suggestions_promoter_insert ON public.matchmaker_suggestions
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

-- Updates happen when the promoter accepts/dismisses. Same gating
-- as SELECT.
DROP POLICY IF EXISTS matchmaker_suggestions_promoter_update ON public.matchmaker_suggestions;
CREATE POLICY matchmaker_suggestions_promoter_update ON public.matchmaker_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.fight_events fe
      JOIN public.org_members om ON om.org_id = fe.org_id
      WHERE fe.id = matchmaker_suggestions.event_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin', 'promoter')
    )
  );
