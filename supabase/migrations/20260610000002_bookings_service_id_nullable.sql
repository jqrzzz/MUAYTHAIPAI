-- bookings.service_id → nullable.
--
-- Found by adopting generated DB types (2026-06-10): the column is NOT NULL
-- in prod, but two code paths legitimately create bookings without a service:
--   - the cert-enrollment flow (app/api/public/enroll/*) — a cert level is
--     not a `services` row; its booking carries the THB amount only;
--   - the Stripe webhook's documented fallback ("always still want to save
--     the booking") which passes service_id NULL when the by-name lookup
--     misses.
-- Both inserts would violate the constraint and fail silently today
-- (verified live: 0 cert enrollments have ever been created, so it has not
-- fired yet — the first real one would lose its payment record).
--
-- Reading code already tolerates a null FK (nested `services(name)` selects
-- and `service?.id || null` writes), so dropping NOT NULL is the schema
-- catching up with the code's intent.

alter table public.bookings alter column service_id drop not null;
