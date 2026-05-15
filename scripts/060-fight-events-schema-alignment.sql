-- =====================================================
-- 060-fight-events-schema-alignment
-- =====================================================
-- The earlier "060-ticket-scanning" attempt failed because ticket_orders
-- didn't exist in production — neither did event_tickets, and the events
-- table was named `events` (not `fight_events`) with different column
-- names than the code expects. This migration aligns the schema with
-- the L4 + L5 code shipped in Batches O–T.
--
-- Production state before this migration:
--   - public.events       (0 rows, has poster_url/start_time/no ticket_sales_open)
--   - public.event_bouts  (0 rows, rounds/round_ended/notes — different column names)
--   - public.fighters     (0 rows, separate from trainer_profiles)
--   - NO event_tickets, NO ticket_orders
--   - trainer_profiles missing weight_class / weight_kg / height_cm / reach_cm
--     / fighter_country columns the picker uses
--
-- After this migration:
--   - events → fight_events (with renamed cols + new ticket_sales_open)
--   - event_bouts column names aligned with the code (scheduled_rounds, etc.)
--   - event_tickets + ticket_orders created (with scan tracking baked in)
--   - trainer_profiles has the fighter physical-stat columns the public
--     fighters API maps over
--
-- Idempotent: uses IF EXISTS / IF NOT EXISTS / WHERE NOT EXISTS so the
-- whole file can be re-run safely.

-- ---------------------------------------------------------------
-- 1. Rename events → fight_events + align column names
-- ---------------------------------------------------------------

-- Drop the policies that reference `events` by name BEFORE renaming
-- the table, so the rename doesn't fail. We recreate them below with
-- the new name.
DROP POLICY IF EXISTS "Public can view bouts" ON public.event_bouts;
DROP POLICY IF EXISTS "Event organizers can manage bouts" ON public.event_bouts;
DROP POLICY IF EXISTS "Platform admins full access to bouts" ON public.event_bouts;
DROP POLICY IF EXISTS "Org staff can manage events" ON public.events;
DROP POLICY IF EXISTS "Platform admins full access to events" ON public.events;
DROP POLICY IF EXISTS "Public can view announced events" ON public.events;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='events')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fight_events')
  THEN
    EXECUTE 'ALTER TABLE public.events RENAME TO fight_events';
  END IF;
END $$;

-- Column renames on fight_events. Use DO blocks so re-running is safe
-- even if a column has already been renamed.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fight_events' AND column_name='start_time')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fight_events' AND column_name='event_time')
  THEN EXECUTE 'ALTER TABLE public.fight_events RENAME COLUMN start_time TO event_time'; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fight_events' AND column_name='poster_url')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fight_events' AND column_name='cover_image_url')
  THEN EXECUTE 'ALTER TABLE public.fight_events RENAME COLUMN poster_url TO cover_image_url'; END IF;
END $$;

-- New columns the code expects but the original `events` table didn't have.
ALTER TABLE public.fight_events ADD COLUMN IF NOT EXISTS ticket_sales_open BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.fight_events ADD COLUMN IF NOT EXISTS venue_province TEXT;

-- ---------------------------------------------------------------
-- 2. Align event_bouts column names with the code
-- ---------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_bouts' AND column_name='rounds')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_bouts' AND column_name='scheduled_rounds')
  THEN EXECUTE 'ALTER TABLE public.event_bouts RENAME COLUMN rounds TO scheduled_rounds'; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_bouts' AND column_name='round_ended')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_bouts' AND column_name='result_round')
  THEN EXECUTE 'ALTER TABLE public.event_bouts RENAME COLUMN round_ended TO result_round'; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_bouts' AND column_name='notes')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_bouts' AND column_name='result_notes')
  THEN EXECUTE 'ALTER TABLE public.event_bouts RENAME COLUMN notes TO result_notes'; END IF;
END $$;

-- The code distinguishes `method` (decision/KO/TKO/etc) from `result`
-- (red_win/blue_win/draw/no_contest). Production had `method` only; add
-- the explicit result column.
ALTER TABLE public.event_bouts ADD COLUMN IF NOT EXISTS result TEXT;

-- Default scheduled_rounds if the rename gave us NULLs (shouldn't but
-- defensive). Production has 0 rows, this is a no-op there.
UPDATE public.event_bouts SET scheduled_rounds = 5 WHERE scheduled_rounds IS NULL;

-- ---------------------------------------------------------------
-- 3. event_tickets — ticket-tier definitions (VIP, GA, etc.)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.fight_events(id) ON DELETE CASCADE,
  tier_name TEXT NOT NULL,
  description TEXT,
  price_thb INTEGER NOT NULL DEFAULT 0,
  price_usd INTEGER,
  quantity_total INTEGER NOT NULL DEFAULT 100,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sale_starts_at TIMESTAMPTZ,
  sale_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON public.event_tickets(event_id);

-- ---------------------------------------------------------------
-- 4. ticket_orders — purchases (scan tracking baked in)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ticket_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.fight_events(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.event_tickets(id),

  -- Buyer (authenticated or guest)
  user_id UUID REFERENCES public.users(id),
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,

  -- Order details
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price_thb INTEGER NOT NULL,
  total_price_usd INTEGER,

  -- Payment
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'cash', 'transfer')),
  stripe_payment_intent_id TEXT,

  -- Order status
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'refunded')),
  order_reference TEXT UNIQUE,

  -- Door scanning (was migration 060's original scope)
  scanned_at TIMESTAMPTZ,
  scanned_by_user_id UUID REFERENCES public.users(id),
  scan_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_orders_event ON public.ticket_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_orders_user  ON public.ticket_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_orders_ticket ON public.ticket_orders(ticket_id);
CREATE INDEX IF NOT EXISTS ticket_orders_reference_idx
  ON public.ticket_orders(order_reference) WHERE order_reference IS NOT NULL;

COMMENT ON COLUMN public.ticket_orders.scanned_at IS
  'When the ticket was first scanned at the door. NULL = not yet redeemed.';
COMMENT ON COLUMN public.ticket_orders.scan_count IS
  'Total scan attempts. >1 means the same ticket was presented multiple times.';

-- ---------------------------------------------------------------
-- 5. Fighter physical-stat columns on trainer_profiles
-- ---------------------------------------------------------------
-- The public fighters API maps these onto the response shape; without
-- them the picker shows blank weight_class / country fields.

ALTER TABLE public.trainer_profiles
  ADD COLUMN IF NOT EXISTS weight_class TEXT,
  ADD COLUMN IF NOT EXISTS weight_kg INTEGER,
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS reach_cm INTEGER,
  ADD COLUMN IF NOT EXISTS fighter_country TEXT;

-- ---------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------

-- Restore the fight_events / event_bouts policies pointing at the new
-- table name. Same gating as before, just renamed.
ALTER TABLE public.fight_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_bouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view announced events" ON public.fight_events;
CREATE POLICY "Public can view announced events" ON public.fight_events
  FOR SELECT USING (status <> 'draft');

DROP POLICY IF EXISTS "Org staff can manage events" ON public.fight_events;
CREATE POLICY "Org staff can manage events" ON public.fight_events
  FOR ALL USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY(ARRAY['owner','admin','promoter'])
    )
  );

DROP POLICY IF EXISTS "Platform admins full access to events" ON public.fight_events;
CREATE POLICY "Platform admins full access to events" ON public.fight_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_platform_admin = true)
  );

DROP POLICY IF EXISTS "Public can view bouts" ON public.event_bouts;
CREATE POLICY "Public can view bouts" ON public.event_bouts
  FOR SELECT USING (
    event_id IN (SELECT id FROM public.fight_events WHERE status <> 'draft')
  );

DROP POLICY IF EXISTS "Event organizers can manage bouts" ON public.event_bouts;
CREATE POLICY "Event organizers can manage bouts" ON public.event_bouts
  FOR ALL USING (
    event_id IN (
      SELECT e.id FROM public.fight_events e
      JOIN public.org_members om ON e.org_id = om.org_id
      WHERE om.user_id = auth.uid()
        AND om.role = ANY(ARRAY['owner','admin','promoter'])
    )
  );

DROP POLICY IF EXISTS "Platform admins full access to bouts" ON public.event_bouts;
CREATE POLICY "Platform admins full access to bouts" ON public.event_bouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_platform_admin = true)
  );

-- event_tickets policies
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_tickets_public_read ON public.event_tickets;
CREATE POLICY event_tickets_public_read ON public.event_tickets
  FOR SELECT USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.fight_events e
      WHERE e.id = event_tickets.event_id
        AND e.status = 'published'
        AND e.ticket_sales_open = TRUE
    )
  );

DROP POLICY IF EXISTS event_tickets_promoter_all ON public.event_tickets;
CREATE POLICY event_tickets_promoter_all ON public.event_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.fight_events e
      JOIN public.org_members om ON om.org_id = e.org_id
      WHERE e.id = event_tickets.event_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role = ANY(ARRAY['owner','admin','promoter'])
    )
  );

-- ticket_orders policies
ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own orders (when authenticated)
DROP POLICY IF EXISTS ticket_orders_buyer_read ON public.ticket_orders;
CREATE POLICY ticket_orders_buyer_read ON public.ticket_orders
  FOR SELECT USING (user_id = auth.uid());

-- Promoters can see all orders for their org's events
DROP POLICY IF EXISTS ticket_orders_promoter_all ON public.ticket_orders;
CREATE POLICY ticket_orders_promoter_all ON public.ticket_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.fight_events e
      JOIN public.org_members om ON om.org_id = e.org_id
      WHERE e.id = ticket_orders.event_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role = ANY(ARRAY['owner','admin','promoter'])
    )
  );

-- The /checkout endpoint runs with service role so it bypasses RLS; we
-- don't need a public-INSERT policy here. (If we ever drop service-role
-- usage, add one with strict CHECK constraints on what fields can be set.)

COMMENT ON TABLE public.event_tickets IS
  'Ticket tiers (VIP, GA, etc.) for a fight_events row. Buyer purchases a tier via ticket_orders.';
COMMENT ON TABLE public.ticket_orders IS
  'Ticket purchases. payment_status flips to paid via Stripe webhook; scanned_at is set by the door-scan endpoint.';
