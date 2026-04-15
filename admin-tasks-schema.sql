-- ═══════════════════════════════════════════════════════════
--  ALUM-IL  |  Task Management System — Schema
--  Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- ─── SLA thresholds per priority (hours) ─────────────────
-- critical: 24h | high: 48h | medium: 72h | low: 168h

-- ─── 1. ADMIN_TASKS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_tasks (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name   TEXT,
  assigned_to       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name  TEXT,
  department        TEXT        CHECK (department IN ('college','procurement','general')) DEFAULT 'general',
  title             TEXT        NOT NULL,
  description       TEXT,
  priority          TEXT        NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('critical','high','medium','low')),
  is_strategic      BOOLEAN     NOT NULL DEFAULT false,
  status            TEXT        NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','pending_approval','closed')),
  reopened_count    INT         NOT NULL DEFAULT 0,
  due_date          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  status_changed_at TIMESTAMPTZ DEFAULT now(),
  closed_at         TIMESTAMPTZ,
  quality_penalty   BOOLEAN     NOT NULL DEFAULT false   -- true = re-opened at least once
);

-- ─── 2. TASK_MESSAGES (internal chat) ────────────────────
CREATE TABLE IF NOT EXISTS task_messages (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id     UUID        NOT NULL REFERENCES admin_tasks(id) ON DELETE CASCADE,
  sender_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── 2b. ADDITIONAL COLUMNS (run if table already exists) ──
ALTER TABLE admin_tasks ADD COLUMN IF NOT EXISTS linked_entity_id    UUID;
ALTER TABLE admin_tasks ADD COLUMN IF NOT EXISTS linked_entity_label TEXT;
ALTER TABLE admin_tasks ADD COLUMN IF NOT EXISTS attachments         JSONB DEFAULT '[]';

-- ─── 2c. STORAGE BUCKET ──────────────────────────────────
-- Run in Supabase Storage: create bucket named "task-attachments" (public)
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "task_attach_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "task_attach_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'task-attachments');

-- ─── 3. AUTO-UPDATE updated_at trigger ───────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS tasks_updated_at ON admin_tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON admin_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 4. RLS ───────────────────────────────────────────────
ALTER TABLE admin_tasks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_messages ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read tasks
CREATE POLICY "tasks_read_auth"
  ON admin_tasks FOR SELECT
  TO authenticated USING (true);

-- Any authenticated user can insert a task (owner = themselves)
CREATE POLICY "tasks_insert_auth"
  ON admin_tasks FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());

-- Assignee or owner can update
CREATE POLICY "tasks_update_auth"
  ON admin_tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid());

-- Only owner can delete
CREATE POLICY "tasks_delete_owner"
  ON admin_tasks FOR DELETE
  TO authenticated USING (created_by = auth.uid());

-- Messages: read all authenticated
CREATE POLICY "msgs_read_auth"
  ON task_messages FOR SELECT
  TO authenticated USING (true);

-- Messages: insert own
CREATE POLICY "msgs_insert_auth"
  ON task_messages FOR INSERT
  TO authenticated WITH CHECK (sender_id = auth.uid());

-- ─── 5. INDEX ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_status     ON admin_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned   ON admin_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON admin_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_msgs_task        ON task_messages(task_id);

-- ─── DONE ─────────────────────────────────────────────────
-- After running, reload schema cache:
-- NOTIFY pgrst, 'reload schema';
