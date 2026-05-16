-- =====================================================
-- 065-ticket-interest
-- =====================================================
-- The "Notify me when tickets go on sale" capture for events that
-- have a public page but haven't opened ticket sales yet. Without
-- this, the event detail page was a dead-end ("Tickets coming
-- soon" with no CTA) — visitors who cared had no way to come
-- back to it.
--
-- Read side: only the promoters of the event's org can see who
-- signed up (to email them manually until we wire the auto-blast,
-- and so the size of the waitlist is visible in the editor).
-- Write side: anyone (anon + authenticated) can register interest.
-- Email is deduped per event so the same person can submit the
-- form twice without us recording duplicates.
--
-- The `notified_at` column is reserved for the eventual feature
-- where opening ticket sales triggers a Resend blast — kept NULL
-- on insert, stamped when the row gets emailed. Out of scope for
-- this migration; just the storage.

CREATE TABLE IF NOT EXISTS public.ticket_interest (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.fight_events(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  -- Lowercased mirror, kept in sync via trigger below. We dedup on
  -- this so "Foo@bar.com" and "foo@bar.com" register once, but the
  -- original casing is preserved for the eventual email greeting.
  email_lower TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified_at TIMESTAMPTZ
);

COMMENT ON TABLE public.ticket_interest IS
  'Public-facing "notify me when tickets go on sale" registrations per event. Migration 065.';
COMMENT ON COLUMN public.ticket_interest.notified_at IS
  'When the "tickets are now on sale" email was sent. NULL = not yet sent. Reserved for the future blast feature; the registration form does not write this.';

-- Dedup per event. We hash on lower(email) so casing variations
-- collapse to one record.
CREATE UNIQUE INDEX IF NOT EXISTS ticket_interest_event_email_uidx
  ON public.ticket_interest (event_id, email_lower);

-- Index supports the eventual cron's WHERE clause for unsent
-- notifications. Cheap to keep around even before that runs.
CREATE INDEX IF NOT EXISTS ticket_interest_pending_idx
  ON public.ticket_interest (event_id)
  WHERE notified_at IS NULL;

-- Trigger to keep email_lower in sync. Simpler than a GENERATED
-- column because it works on UPDATE without forcing a regen.
CREATE OR REPLACE FUNCTION public.ticket_interest_set_email_lower()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_lower := LOWER(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ticket_interest_email_lower ON public.ticket_interest;
CREATE TRIGGER ticket_interest_email_lower
  BEFORE INSERT OR UPDATE OF email ON public.ticket_interest
  FOR EACH ROW
  EXECUTE FUNCTION public.ticket_interest_set_email_lower();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.ticket_interest ENABLE ROW LEVEL SECURITY;

-- Anyone (signed-in OR anonymous) can register. The public endpoint
-- validates the email + the event before inserting, so this policy
-- doesn't need to gate. We rely on the public endpoint to apply
-- light per-IP rate limiting before reaching the DB.
DROP POLICY IF EXISTS ticket_interest_public_insert ON public.ticket_interest;
CREATE POLICY ticket_interest_public_insert ON public.ticket_interest
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only the promoter staff of the event's owning org can read the
-- registration list. Matches the pattern used elsewhere — promoter,
-- owner, or admin on the org.
DROP POLICY IF EXISTS ticket_interest_promoter_select ON public.ticket_interest;
CREATE POLICY ticket_interest_promoter_select ON public.ticket_interest
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.fight_events fe
      JOIN public.org_members om ON om.org_id = fe.org_id
      WHERE fe.id = ticket_interest.event_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin', 'promoter')
    )
  );

-- Same gating for UPDATE — needed when the future blast cron flips
-- notified_at. Restricting to promoter staff (rather than a service
-- role) so we don't depend on a separate worker identity.
DROP POLICY IF EXISTS ticket_interest_promoter_update ON public.ticket_interest;
CREATE POLICY ticket_interest_promoter_update ON public.ticket_interest
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.fight_events fe
      JOIN public.org_members om ON om.org_id = fe.org_id
      WHERE fe.id = ticket_interest.event_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin', 'promoter')
    )
  );
