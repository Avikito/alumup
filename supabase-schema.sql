-- ═══════════════════════════════════════════════════════════
--  ALUM-IL College — Supabase Schema
--  Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- ─── 1. LEADS ────────────────────────────────────────────────
-- Captures interest / partial form fills before payment

CREATE TABLE IF NOT EXISTS leads (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name      TEXT,
  phone          TEXT,
  email          TEXT,
  candidate_type TEXT        CHECK (candidate_type IN ('new', 'veteran', 'employer')),
  location       TEXT        CHECK (location IN ('beer_sheva', 'tel_aviv')),
  schedule       TEXT        CHECK (schedule IN ('morning', 'evening')),
  time_window    TEXT        CHECK (time_window IN ('may_jun', 'jun_jul', 'aug_sep')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. STUDENTS ─────────────────────────────────────────────
-- Confirmed registrations (payment succeeded)

CREATE TABLE IF NOT EXISTS students (
  id                           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Personal
  full_name                    TEXT        NOT NULL,
  phone                        TEXT        NOT NULL,
  email                        TEXT        NOT NULL,

  -- Profile
  candidate_type               TEXT        NOT NULL CHECK (candidate_type IN ('new', 'veteran', 'employer')),
  employee_count               INTEGER     DEFAULT 1,

  -- Logistics
  location                     TEXT        NOT NULL CHECK (location IN ('beer_sheva', 'tel_aviv')),
  schedule                     TEXT        NOT NULL CHECK (schedule IN ('morning', 'evening')),
  time_window                  TEXT        CHECK (time_window IN ('may_jun', 'jun_jul', 'aug_sep')),

  -- Documents
  health_declaration_signed    BOOLEAN     DEFAULT false,
  regulations_signed           BOOLEAN     DEFAULT false,
  health_signature_data        TEXT,        -- base64 PNG of canvas signature
  regulations_signature_data   TEXT,        -- base64 PNG of canvas signature

  -- Payment
  payment_status               TEXT        DEFAULT 'pending'
                                           CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_amount               NUMERIC     DEFAULT 750,
  payment_ref                  TEXT,        -- payment gateway reference

  -- Status & ROI
  status                       TEXT        DEFAULT 'registered'
                                           CHECK (status IN ('registered', 'waitlist', 'confirmed', 'cancelled')),
  expected_roi                 NUMERIC,     -- Expected ROI for employer type (optional)

  created_at                   TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. REGISTRATIONS ────────────────────────────────────────
-- Maps students to course cycles
-- Supports waitlist: status = 'waitlist' when cycle is not yet confirmed

CREATE TABLE IF NOT EXISTS registrations (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id     UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Cycle identifier (e.g. "cycle-may_jun-beer_sheva")
  cycle_id       TEXT,

  -- Location & schedule (denormalized for quick admin queries)
  location       TEXT        CHECK (location IN ('beer_sheva', 'tel_aviv')),
  schedule       TEXT        CHECK (schedule IN ('morning', 'evening')),

  -- Lifecycle
  status         TEXT        DEFAULT 'registered'
                             CHECK (status IN ('registered', 'waitlist', 'confirmed', 'cancelled')),

  registered_at  TIMESTAMPTZ DEFAULT now(),
  confirmed_at   TIMESTAMPTZ          -- Set by admin when cycle opens (break-even reached)
);

-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_students_location_window
  ON students (location, time_window, status);

CREATE INDEX IF NOT EXISTS idx_students_payment
  ON students (payment_status);

CREATE INDEX IF NOT EXISTS idx_registrations_cycle
  ON registrations (cycle_id, status);

CREATE INDEX IF NOT EXISTS idx_registrations_student
  ON registrations (student_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
-- Enable RLS on all tables

ALTER TABLE leads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Leads: anyone can insert (pre-auth), only admins can read
CREATE POLICY "leads_insert_public"   ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_select_admin"    ON leads FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM admin_users)
);

-- Students: users can read their own row; insert allowed for authenticated users
CREATE POLICY "students_select_own"   ON students FOR SELECT USING (
  auth.uid() = user_id OR
  auth.uid() IN (SELECT user_id FROM admin_users)
);
CREATE POLICY "students_insert_auth"  ON students FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);
CREATE POLICY "students_update_admin" ON students FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM admin_users)
);

-- Registrations: users can read their own, admins can do everything
CREATE POLICY "reg_select_own"        ON registrations FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
  auth.uid() IN (SELECT user_id FROM admin_users)
);
CREATE POLICY "reg_insert_auth"       ON registrations FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);
CREATE POLICY "reg_update_admin"      ON registrations FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM admin_users)
);

-- ─── HELPER VIEW: BREAK-EVEN DASHBOARD ───────────────────────
-- Helps the college admin see: how many paid registrations per cycle vs break-even target

CREATE OR REPLACE VIEW cycle_summary AS
SELECT
  r.cycle_id,
  r.location,
  r.schedule,
  s.time_window,
  COUNT(*)                                        AS total_registered,
  COUNT(*) FILTER (WHERE r.status = 'confirmed')  AS total_confirmed,
  COUNT(*) FILTER (WHERE r.status = 'waitlist')   AS total_waitlist,
  SUM(s.payment_amount)                           AS total_revenue,
  -- Break-even example: 12 students × 750 = 9,000 NIS
  CASE WHEN COUNT(*) >= 12 THEN true ELSE false END AS break_even_reached
FROM registrations r
JOIN students s ON s.id = r.student_id
WHERE s.payment_status = 'paid'
GROUP BY r.cycle_id, r.location, r.schedule, s.time_window
ORDER BY s.time_window, r.location;
