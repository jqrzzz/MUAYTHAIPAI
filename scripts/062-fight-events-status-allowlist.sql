-- =====================================================
-- 062-fight-events-status-allowlist
-- =====================================================
-- Fixes a real bug: the fight_events.status CHECK constraint
-- (inherited from the original `events` table — predates the rename
-- in migration 060) doesn't include 'published', but the code's
-- togglePublish handler sets exactly that. Clicking Publish on a
-- draft event would 500 with a CHECK violation.
--
-- The code uses a simple draft/published/cancelled/completed model.
-- The old constraint had a richer 7-state enum (draft / announced /
-- ticket_sales / sold_out / live / completed / cancelled) but the
-- code never adopted those finer states. Rather than refactor the
-- code to a richer state machine right now, expand the constraint
-- to accept BOTH the code's simple statuses AND the old richer ones
-- so any pre-rename data is still valid.
--
-- Idempotent: drops the old check before adding the new one. If the
-- new one is already in place, the DROP is a no-op (IF EXISTS).

ALTER TABLE public.fight_events
  DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE public.fight_events
  DROP CONSTRAINT IF EXISTS fight_events_status_check;

ALTER TABLE public.fight_events
  ADD CONSTRAINT fight_events_status_check CHECK (
    status = ANY (ARRAY[
      'draft',
      'announced',
      'ticket_sales',
      'sold_out',
      'live',
      'completed',
      'cancelled',
      -- The code-side statuses the dashboard actually writes:
      'published'
    ])
  );

COMMENT ON CONSTRAINT fight_events_status_check ON public.fight_events IS
  'Accepts both the original richer state machine and the simpler draft/published/cancelled/completed model the dashboard uses. Code only emits published / draft / cancelled / completed right now; richer states reserved for future use.';
