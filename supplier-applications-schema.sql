-- ═══════════════════════════════════════════════════════════
--  ALUM-IL  |  Supplier Applications Schema
--  Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- ─── SEQUENCE for application numbers ────────────────────
CREATE SEQUENCE IF NOT EXISTS supplier_application_seq START 1001;

-- ─── 1. SUPPLIER_APPLICATIONS ─────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_applications (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  application_number  TEXT        UNIQUE NOT NULL
                        DEFAULT ('APP-' || nextval('supplier_application_seq')::TEXT),
  user_id             UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Workflow status
  status              TEXT        NOT NULL DEFAULT 'draft'
                        CHECK (status IN (
                          'draft',           -- טיוטה
                          'pending_review',  -- ממתין לסקירה
                          'in_committee',    -- בוועדה
                          'approved',        -- אושר
                          'rejected'         -- נדחה
                        )),

  -- Step 1: Legal / Company details
  -- { entity_type, business_name, id_number, representative_name, phone, email }
  company_details     JSONB       NOT NULL DEFAULT '{}',

  -- Step 2: Selected product categories (array of category keys)
  selected_categories TEXT[]      NOT NULL DEFAULT '{}',

  -- Step 3: Logistics & service
  -- { service_areas: [], delivery_method, min_order_amount, lead_time_days }
  service_details     JSONB       NOT NULL DEFAULT '{}',

  -- Step 4: Value proposition per category
  -- { [category_key]: { description, pricelist_url } }
  product_data        JSONB       NOT NULL DEFAULT '{}',

  -- Uploaded document URLs (Supabase Storage paths)
  -- { business_cert_url, signature_protocol_url, id_photo_url }
  documents           JSONB       NOT NULL DEFAULT '{}',

  -- Admin
  admin_notes         JSONB       NOT NULL DEFAULT '[]',
  reviewed_by         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER supplier_applications_updated_at
  BEFORE UPDATE ON supplier_applications
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─── 2. APPLICATION_LOGS ──────────────────────────────────
-- Full audit trail: every status change or data update is logged.
CREATE TABLE IF NOT EXISTS application_logs (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id  UUID        NOT NULL
                    REFERENCES supplier_applications(id) ON DELETE CASCADE,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action          TEXT        NOT NULL,   -- e.g. 'created', 'status_changed', 'document_uploaded'
  changes         JSONB       NOT NULL DEFAULT '{}', -- { from, to, field, ... }
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sa_user_id    ON supplier_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_sa_status     ON supplier_applications (status);
CREATE INDEX IF NOT EXISTS idx_sa_created    ON supplier_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sa_categories ON supplier_applications USING GIN (selected_categories);
CREATE INDEX IF NOT EXISTS idx_al_app_id     ON application_logs (application_id);
CREATE INDEX IF NOT EXISTS idx_al_created    ON application_logs (created_at DESC);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
ALTER TABLE supplier_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_logs      ENABLE ROW LEVEL SECURITY;

-- supplier_applications policies
-- Users can insert their own application
CREATE POLICY "sa_insert_own"
  ON supplier_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own; admins can read all
CREATE POLICY "sa_select_own_or_admin"
  ON supplier_applications FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Users can update their own draft; admins can update any
CREATE POLICY "sa_update_own_draft_or_admin"
  ON supplier_applications FOR UPDATE
  USING (
    (auth.uid() = user_id AND status = 'draft') OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Only admins can delete
CREATE POLICY "sa_delete_admin"
  ON supplier_applications FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- application_logs policies
-- Authenticated users can insert logs for their own applications
CREATE POLICY "al_insert_authenticated"
  ON application_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Own applications' logs + admin sees all
CREATE POLICY "al_select_own_or_admin"
  ON application_logs FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM supplier_applications WHERE user_id = auth.uid()
    ) OR
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- ─── STORAGE BUCKET ───────────────────────────────────────
-- Run this only once; skip if the bucket already exists.
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-docs', 'supplier-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder
CREATE POLICY "supplier_docs_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'supplier-docs' AND
    auth.uid()::TEXT = (string_to_array(name, '/'))[1]
  );

-- Users can read their own files; admins can read all
CREATE POLICY "supplier_docs_select_own_or_admin"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'supplier-docs' AND (
      auth.uid()::TEXT = (string_to_array(name, '/'))[1] OR
      auth.uid() IN (SELECT user_id FROM admin_users)
    )
  );

-- Users can replace their own files
CREATE POLICY "supplier_docs_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'supplier-docs' AND
    auth.uid()::TEXT = (string_to_array(name, '/'))[1]
  );
