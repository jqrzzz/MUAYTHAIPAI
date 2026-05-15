-- =====================================================
-- 061-event-covers-bucket
-- =====================================================
-- Storage bucket for fight-event cover images. Public-read because
-- the file is referenced via fight_events.cover_image_url which
-- renders on /ockock/fights, the fight detail page, and the OG card.
-- Writes go through the service-role /api/promoter/events/[id]/cover
-- endpoint after promoter auth + event-ownership checks, so no need
-- for write RLS policies here.
--
-- Same pattern as scripts/058-gym-logos-bucket.sql.

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-covers', 'event-covers', true)
ON CONFLICT (id) DO NOTHING;
