-- 058-gym-logos-bucket.sql — public bucket for gym logos.
--
-- A gym uploads a logo from /admin → Settings. The /api/admin/gym-logo route
-- handles the upload server-side via service-role and writes the public URL
-- back to organizations.logo_url. The bucket is public so the URL renders
-- directly on the gym's public page (/gyms/[slug]), embeds, and student
-- dashboards.

INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-logos', 'gym-logos', true)
ON CONFLICT (id) DO NOTHING;
