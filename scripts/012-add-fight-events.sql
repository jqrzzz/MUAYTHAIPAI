-- ============================================
-- 012: Fight Events & Ticket System
-- Extends the platform for fight promoters,
-- event management, and ticket sales.
-- ============================================

-- ============================================
-- 1. EXTEND TRAINER_PROFILES (Fighter Stats)
-- ============================================
-- Add physical stats for fighters who opt in
ALTER TABLE trainer_profiles
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS reach_cm INTEGER,
  ADD COLUMN IF NOT EXISTS weight_class TEXT,
  ADD COLUMN IF NOT EXISTS fighter_country TEXT;

-- ============================================
-- 2. ADD PROMOTER ROLE
-- ============================================
-- Drop and recreate the CHECK constraint to include 'promoter'
ALTER TABLE org_members
  DROP CONSTRAINT IF EXISTS org_members_role_check;

ALTER TABLE org_members
  ADD CONSTRAINT org_members_role_check
  CHECK (role IN ('owner', 'admin', 'trainer', 'student', 'promoter'));

-- ============================================
-- 3. FIGHT EVENTS (Fight Nights / Tournaments)
-- ============================================
CREATE TABLE fight_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Event details
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  cover_image_url TEXT,

  -- Venue
  venue_name TEXT,
  venue_address TEXT,
  venue_city TEXT,
  venue_province TEXT,
  venue_country TEXT DEFAULT 'Thailand',
  venue_latitude NUMERIC(10,7),
  venue_longitude NUMERIC(10,7),

  -- Capacity & status
  max_capacity INTEGER,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  ticket_sales_open BOOLEAN DEFAULT FALSE,

  -- Tracking
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fight_events_org ON fight_events(org_id);
CREATE INDEX idx_fight_events_date ON fight_events(event_date);
CREATE INDEX idx_fight_events_status ON fight_events(status);

-- ============================================
-- 4. EVENT BOUTS (Individual Fights)
-- ============================================
CREATE TABLE event_bouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fight_events(id) ON DELETE CASCADE,

  -- Fighters (reference trainer_profiles)
  fighter_red_id UUID REFERENCES trainer_profiles(id),
  fighter_blue_id UUID REFERENCES trainer_profiles(id),

  -- Bout details
  bout_order INTEGER DEFAULT 0,
  weight_class TEXT,
  scheduled_rounds INTEGER DEFAULT 5,
  is_main_event BOOLEAN DEFAULT FALSE,

  -- Result (filled after fight)
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  result TEXT CHECK (result IN (
    'red_win_ko', 'red_win_tko', 'red_win_decision',
    'blue_win_ko', 'blue_win_tko', 'blue_win_decision',
    'draw', 'no_contest', NULL
  )),
  winner_id UUID REFERENCES trainer_profiles(id),
  result_round INTEGER,
  result_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- A fighter can't fight themselves
  CONSTRAINT different_fighters CHECK (fighter_red_id != fighter_blue_id)
);

CREATE INDEX idx_event_bouts_event ON event_bouts(event_id);
CREATE INDEX idx_event_bouts_fighter_red ON event_bouts(fighter_red_id);
CREATE INDEX idx_event_bouts_fighter_blue ON event_bouts(fighter_blue_id);

-- ============================================
-- 5. EVENT TICKETS (Ticket Tiers)
-- ============================================
CREATE TABLE event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fight_events(id) ON DELETE CASCADE,

  -- Tier info
  tier_name TEXT NOT NULL,
  description TEXT,
  price_thb INTEGER NOT NULL,
  price_usd INTEGER,

  -- Inventory
  quantity_total INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,

  -- Controls
  is_active BOOLEAN DEFAULT TRUE,
  sale_starts_at TIMESTAMPTZ,
  sale_ends_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_tickets_event ON event_tickets(event_id);

-- ============================================
-- 6. TICKET ORDERS (Purchases)
-- ============================================
CREATE TABLE ticket_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES fight_events(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES event_tickets(id),

  -- Buyer (authenticated or guest)
  user_id UUID REFERENCES users(id),
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,

  -- Order details
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price_thb INTEGER NOT NULL,
  total_price_usd INTEGER,

  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'cash', 'transfer', NULL)),
  stripe_payment_intent_id TEXT,

  -- Order status
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'refunded')),
  order_reference TEXT UNIQUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_orders_event ON ticket_orders(event_id);
CREATE INDEX idx_ticket_orders_user ON ticket_orders(user_id);
CREATE INDEX idx_ticket_orders_ticket ON ticket_orders(ticket_id);

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Fight Events
ALTER TABLE fight_events ENABLE ROW LEVEL SECURITY;

-- Public can view published events
CREATE POLICY "Public can view published events"
  ON fight_events FOR SELECT
  USING (status = 'published');

-- Org staff can view all their events
CREATE POLICY "Org staff can view own events"
  ON fight_events FOR SELECT
  USING (is_org_member(org_id));

-- Owners/admins/promoters can manage events
CREATE POLICY "Staff can manage events"
  ON fight_events FOR ALL
  USING (has_org_role(org_id, ARRAY['owner', 'admin', 'promoter']));

-- Platform admins can manage all
CREATE POLICY "Platform admins manage all events"
  ON fight_events FOR ALL
  USING (is_platform_admin());

-- Event Bouts
ALTER TABLE event_bouts ENABLE ROW LEVEL SECURITY;

-- Public can view bouts for published events
CREATE POLICY "Public can view bouts for published events"
  ON event_bouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fight_events
      WHERE fight_events.id = event_bouts.event_id
      AND fight_events.status = 'published'
    )
  );

-- Org staff can view all bouts for their events
CREATE POLICY "Org staff can view own event bouts"
  ON event_bouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fight_events
      WHERE fight_events.id = event_bouts.event_id
      AND is_org_member(fight_events.org_id)
    )
  );

-- Staff can manage bouts for their events
CREATE POLICY "Staff can manage event bouts"
  ON event_bouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM fight_events
      WHERE fight_events.id = event_bouts.event_id
      AND has_org_role(fight_events.org_id, ARRAY['owner', 'admin', 'promoter'])
    )
  );

-- Platform admins
CREATE POLICY "Platform admins manage all bouts"
  ON event_bouts FOR ALL
  USING (is_platform_admin());

-- Event Tickets
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

-- Public can view active tickets for published events
CREATE POLICY "Public can view active tickets"
  ON event_tickets FOR SELECT
  USING (
    is_active = TRUE AND EXISTS (
      SELECT 1 FROM fight_events
      WHERE fight_events.id = event_tickets.event_id
      AND fight_events.status = 'published'
      AND fight_events.ticket_sales_open = TRUE
    )
  );

-- Staff can manage tickets
CREATE POLICY "Staff can manage tickets"
  ON event_tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM fight_events
      WHERE fight_events.id = event_tickets.event_id
      AND has_org_role(fight_events.org_id, ARRAY['owner', 'admin', 'promoter'])
    )
  );

-- Platform admins
CREATE POLICY "Platform admins manage all tickets"
  ON event_tickets FOR ALL
  USING (is_platform_admin());

-- Ticket Orders
ALTER TABLE ticket_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON ticket_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Staff can view orders for their events
CREATE POLICY "Staff can view event orders"
  ON ticket_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fight_events
      WHERE fight_events.id = ticket_orders.event_id
      AND has_org_role(fight_events.org_id, ARRAY['owner', 'admin', 'promoter'])
    )
  );

-- Staff can manage orders
CREATE POLICY "Staff can manage orders"
  ON ticket_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM fight_events
      WHERE fight_events.id = ticket_orders.event_id
      AND has_org_role(fight_events.org_id, ARRAY['owner', 'admin', 'promoter'])
    )
  );

-- Authenticated users can create orders (buy tickets)
CREATE POLICY "Authenticated users can buy tickets"
  ON ticket_orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Platform admins
CREATE POLICY "Platform admins manage all orders"
  ON ticket_orders FOR ALL
  USING (is_platform_admin());

-- ============================================
-- 8. TRIGGERS (auto-update updated_at)
-- ============================================
CREATE TRIGGER update_fight_events_updated_at
  BEFORE UPDATE ON fight_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
