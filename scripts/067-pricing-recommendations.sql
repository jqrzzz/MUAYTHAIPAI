-- =====================================================
-- 067-pricing-recommendations
-- =====================================================
-- The AI Pricing Oracle's training trail. Every recommendation
-- the promoter generates lands here with both the suggested price
-- AND the price they were considering at the time, so we can
-- later score "did promoters who applied the AI price actually
-- sell better?" — the second supply-side data moat after the
-- matchmaker.
--
-- One row per (event, tier, generation). Multiple recommendations
-- on the same tier are kept as history (the promoter can compare
-- runs after they tweak inputs). We do NOT dedup on tier_id
-- because regenerating IS the loop — every run is a data point.
--
-- The `applied_price_thb` column captures what the promoter
-- actually set the tier to after seeing the rec. NULL = didn't
-- apply. If they applied with a tweak, both numbers stay (rec'd
-- price + applied price) so we can compute "AI was X% off."

CREATE TABLE IF NOT EXISTS public.pricing_recommendations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES public.fight_events(id) ON DELETE CASCADE,

  -- The tier this is for. NULL when the rec is for a not-yet-
  -- created tier (the promoter is sizing it up before adding).
  -- ON DELETE SET NULL keeps the training row when a tier is
  -- deleted post-event.
  tier_id    UUID REFERENCES public.event_tickets(id) ON DELETE SET NULL,
  tier_name  TEXT NOT NULL,

  -- AI output
  recommended_price_thb       INTEGER NOT NULL,
  recommended_quantity_total  INTEGER,
  -- Best-guess projected paid sales at the recommended price + qty.
  -- Compared against actual sold post-event to score the model.
  projected_sold              INTEGER,
  confidence                  TEXT CHECK (confidence IN ('low', 'medium', 'high')),
  -- Directional signal — what's the rec saying compared to the
  -- promoter's current price (if any)?
  --   underpriced  = current too low, raise it
  --   overpriced   = current too high, lower it
  --   on-target    = current is roughly right (±5%)
  --   cold-start   = no comparables, prior-based estimate
  signal      TEXT CHECK (signal IN ('underpriced', 'overpriced', 'on-target', 'cold-start')),
  reasoning   TEXT,

  -- Snapshot of inputs at recommendation time (so re-running with
  -- a different price gives a different row, and we can later see
  -- the trajectory of revisions).
  current_price_thb           INTEGER,
  current_quantity_total      INTEGER,
  -- How many comparable events the model saw. 0 = cold-start.
  comparable_event_count      INTEGER NOT NULL DEFAULT 0,

  -- Outcome / learning signal
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'applied', 'dismissed')),
  applied_price_thb INTEGER,
  applied_quantity_total INTEGER,

  -- Audit + A/B
  prompt_version   TEXT NOT NULL DEFAULT 'v1',
  generated_by     UUID REFERENCES public.users(id),

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);

COMMENT ON TABLE public.pricing_recommendations IS
  'AI Pricing Oracle history. Powers the supply-side learning loop: every applied/dismissed rec sharpens future predictions. Migration 067.';
COMMENT ON COLUMN public.pricing_recommendations.signal IS
  'underpriced/overpriced/on-target relative to current_price_thb; cold-start when comparable_event_count = 0 and the rec is prior-based.';

-- "Show me this event's recommendation history for this tier"
-- in the editor.
CREATE INDEX IF NOT EXISTS pricing_recommendations_event_tier_idx
  ON public.pricing_recommendations (event_id, tier_id, created_at DESC);

-- Cross-event learning queries — "give me all applied recs across
-- the platform sorted by confidence" for prompt v2 training.
CREATE INDEX IF NOT EXISTS pricing_recommendations_applied_idx
  ON public.pricing_recommendations (status, created_at DESC)
  WHERE status = 'applied';

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.pricing_recommendations ENABLE ROW LEVEL SECURITY;

-- Promoter staff of the event's owning org can read their rec history.
DROP POLICY IF EXISTS pricing_recommendations_promoter_select ON public.pricing_recommendations;
CREATE POLICY pricing_recommendations_promoter_select ON public.pricing_recommendations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.fight_events fe
      JOIN public.org_members om ON om.org_id = fe.org_id
      WHERE fe.id = pricing_recommendations.event_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin', 'promoter')
    )
  );

DROP POLICY IF EXISTS pricing_recommendations_promoter_insert ON public.pricing_recommendations;
CREATE POLICY pricing_recommendations_promoter_insert ON public.pricing_recommendations
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

DROP POLICY IF EXISTS pricing_recommendations_promoter_update ON public.pricing_recommendations;
CREATE POLICY pricing_recommendations_promoter_update ON public.pricing_recommendations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.fight_events fe
      JOIN public.org_members om ON om.org_id = fe.org_id
      WHERE fe.id = pricing_recommendations.event_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin', 'promoter')
    )
  );
