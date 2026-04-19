-- ═══════════════════════════════════════════════════════════
--  ALUM-IL  |  Admin Monitor — Schema
--  Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- ─── 1. admin_users — add last_seen column if missing ────────
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- ─── 2. admin_session_logs ───────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_session_logs (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT,
  page         TEXT,
  logged_in_at TIMESTAMPTZ DEFAULT now(),
  lat          FLOAT,
  lng          FLOAT,
  city         TEXT,
  country      TEXT,
  address      TEXT
);

-- ─── 3. RLS ──────────────────────────────────────────────────
ALTER TABLE admin_session_logs ENABLE ROW LEVEL SECURITY;

-- Any admin can insert their own session log
CREATE POLICY "session_logs_insert"
  ON admin_session_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Any admin can read all logs
CREATE POLICY "session_logs_read"
  ON admin_session_logs FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- ─── 4. admin_users — allow self-update of last_seen ─────────
-- (Add only if RLS is enabled on admin_users)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'admin_users' AND rowsecurity = true
  ) THEN
    -- drop old policy if exists to avoid conflict
    DROP POLICY IF EXISTS "admin_users_self_update" ON admin_users;
    EXECUTE $pol$
      CREATE POLICY "admin_users_self_update"
        ON admin_users FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    $pol$;
  END IF;
END $$;

-- ─── 5. INDEX ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_session_logs_user    ON admin_session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_time    ON admin_session_logs(logged_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_users_last_seen ON admin_users(last_seen);

-- ─── DONE ─────────────────────────────────────────────────────
-- After running, reload schema cache:
-- NOTIFY pgrst, 'reload schema';
