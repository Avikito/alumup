-- ═══════════════════════════════════════════════════════════
--  ALUM-IL College — Supabase Schema (v2)
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- ─── DROP OLD TABLES (if they exist from a previous version) ─

DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS students     CASCADE;
DROP TABLE IF EXISTS leads        CASCADE;

-- ─── 1. LEADS ────────────────────────────────────────────────

CREATE TABLE leads (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name      TEXT,
  phone          TEXT,
  email          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. STUDENTS ─────────────────────────────────────────────
-- One row per confirmed registration (after payment)

CREATE TABLE students (
  id                          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Personal
  full_name                   TEXT        NOT NULL,
  phone                       TEXT        NOT NULL,
  email                       TEXT        NOT NULL,

  -- Course selection
  experience_level            TEXT,
  course_track                TEXT,       -- pergola_al | pergola_electric | glass_systems | bioclimatic | weld_al | weld_steel
  location                    TEXT,       -- beer_sheva | tel_aviv
  schedule                    TEXT,       -- morning | evening
  opening_window              TEXT,       -- may_jun | jun_jul | aug_sep

  -- Screening answers
  screening_physical          TEXT,       -- yes | no
  screening_permit            TEXT,       -- yes | no
  screening_tools             TEXT,       -- yes | no
  screening_age               TEXT,       -- yes | no

  -- Documents / signatures
  health_declaration_signed   BOOLEAN     DEFAULT false,
  regulations_signed          BOOLEAN     DEFAULT false,
  health_signature_data       TEXT,       -- base64 PNG
  regulations_signature_data  TEXT,       -- base64 PNG

  -- Payment
  payment_status              TEXT        DEFAULT 'pending',
  payment_amount              NUMERIC     DEFAULT 0,
  payment_ref                 TEXT,

  -- Admin
  status                      TEXT        DEFAULT 'awaiting_coordination',
  admin_notes                 JSONB       DEFAULT '[]',

  created_at                  TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. REGISTRATIONS ────────────────────────────────────────

CREATE TABLE registrations (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id        UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_track      TEXT,
  location          TEXT,
  schedule          TEXT,
  registration_fee  NUMERIC     DEFAULT 399,
  full_price        NUMERIC     DEFAULT 8500,
  status            TEXT        DEFAULT 'awaiting_coordination',
  registered_at     TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. BATCHES ──────────────────────────────────────────────
-- One row per study cohort (מחזור)

CREATE TABLE batches (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT        NOT NULL,                        -- e.g. "מחזור א׳ – פרגולות"
  track        TEXT,                                        -- course_track value
  location     TEXT,                                        -- beer_sheva | tel_aviv
  schedule     TEXT,                                        -- morning | evening
  open_date    DATE,                                        -- cohort start date
  capacity     INTEGER     DEFAULT 15,
  sessions     INTEGER     DEFAULT 5,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. BATCH_STUDENTS ───────────────────────────────────────
-- Join table: which students are in which batch + per-student data

CREATE TABLE batch_students (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id     UUID        NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  student_id   UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  paid         BOOLEAN     DEFAULT false,
  attendance   JSONB       DEFAULT '[]',                    -- array of session booleans
  assigned_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (batch_id, student_id)
);

-- ─── INDEXES ──────────────────────────────────────────────────

CREATE INDEX idx_students_status         ON students (status);
CREATE INDEX idx_students_course         ON students (course_track);
CREATE INDEX idx_students_created        ON students (created_at DESC);
CREATE INDEX idx_registrations_student   ON registrations (student_id);
CREATE INDEX idx_batches_track           ON batches (track);
CREATE INDEX idx_batch_students_batch    ON batch_students (batch_id);
CREATE INDEX idx_batch_students_student  ON batch_students (student_id);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────

ALTER TABLE leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE students        ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_students  ENABLE ROW LEVEL SECURITY;

-- Leads: public insert
CREATE POLICY "leads_insert_public"
  ON leads FOR INSERT WITH CHECK (true);

CREATE POLICY "leads_select_admin"
  ON leads FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Students: insert allowed for anyone (including unauthenticated via anon key)
CREATE POLICY "students_insert_any"
  ON students FOR INSERT WITH CHECK (true);

CREATE POLICY "students_select_own_or_admin"
  ON students FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "students_update_admin"
  ON students FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Registrations
CREATE POLICY "reg_insert_any"
  ON registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "reg_select_own_or_admin"
  ON registrations FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "reg_update_admin"
  ON registrations FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Batches: admin only
CREATE POLICY "batches_select_admin"
  ON batches FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "batches_insert_admin"
  ON batches FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "batches_update_admin"
  ON batches FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "batches_delete_admin"
  ON batches FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Batch students: admin only
CREATE POLICY "batch_students_select_admin"
  ON batch_students FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "batch_students_insert_admin"
  ON batch_students FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "batch_students_update_admin"
  ON batch_students FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "batch_students_delete_admin"
  ON batch_students FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- ─── ALTER EXISTING TABLES ────────────────────────────────────
-- Run these if the students table was already created without these columns:
-- ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_year   INTEGER;
-- ALTER TABLE students ADD COLUMN IF NOT EXISTS id_photo_data TEXT;
