-- App-requested v2 change (mirrored here per the repo convention; the v2
-- schema itself is owned DB-side).
--
-- First-run setup needs somewhere to record that it finished. The obvious
-- candidate — organizations.settings — is the wrong one: fix_04 declared
-- settings to be per-org CONFIG that is resolved at issue time and FROZEN
-- into document snapshots. Setup progress is lifecycle state, not config,
-- and must never be able to leak into an invoice. Hence a column, and hence
-- no new block on the settings whitelist.
--
-- Timestamp rather than boolean: null already means "not finished", and
-- knowing *when* an org completed setup is worth keeping. A boolean throws
-- that away and cannot be recovered later.

ALTER TABLE v2.organizations
  ADD COLUMN onboarding_completed_at timestamptz;

COMMENT ON COLUMN v2.organizations.onboarding_completed_at IS
  'When the owner finished first-run setup. Null = the getting-started wizard still owns the entry point. Deliberately a column, not a settings block: settings is config frozen into document snapshots, and setup progress is neither config nor snapshot-worthy.';
