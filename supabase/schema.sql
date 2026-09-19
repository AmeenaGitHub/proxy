-- RaktSetu Database Schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- ENUM TYPES
-- ============================================

DO $$ BEGIN
  CREATE TYPE blood_group_enum AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sex_enum AS ENUM ('M','F','other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE urgency_enum AS ENUM ('critical','urgent','routine');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status_enum AS ENUM ('open','partially_fulfilled','fulfilled','expired','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status_enum AS ENUM ('pending','accepted','declined','expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel_enum AS ENUM ('in_app');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reveal_to_enum AS ENUM ('both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================
-- TABLES
-- ============================================

-- Donors
CREATE TABLE IF NOT EXISTS donors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL UNIQUE,
  blood_group   blood_group_enum NOT NULL,
  sex           sex_enum NOT NULL,
  date_of_birth DATE NOT NULL,
  pincode       TEXT NOT NULL,
  ward_name     TEXT,
  district      TEXT NOT NULL DEFAULT 'Ernakulam',
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  last_donation_date DATE,
  total_donations   INTEGER NOT NULL DEFAULT 0,
  is_paused     BOOLEAN NOT NULL DEFAULT false,
  paused_until  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Blood Requests
CREATE TABLE IF NOT EXISTS blood_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name    TEXT NOT NULL,
  requester_phone   TEXT NOT NULL,
  patient_blood_group blood_group_enum NOT NULL,
  units_needed      INTEGER NOT NULL CHECK (units_needed > 0),
  units_confirmed   INTEGER NOT NULL DEFAULT 0,
  hospital_name     TEXT NOT NULL,
  hospital_lat      DOUBLE PRECISION NOT NULL,
  hospital_lng      DOUBLE PRECISION NOT NULL,
  pincode           TEXT,
  district          TEXT NOT NULL DEFAULT 'Ernakulam',
  urgency           urgency_enum NOT NULL DEFAULT 'routine',
  needed_by         TIMESTAMPTZ NOT NULL,
  status            request_status_enum NOT NULL DEFAULT 'open',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id        UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  channel         notification_channel_enum NOT NULL DEFAULT 'in_app',
  status          notification_status_enum NOT NULL DEFAULT 'pending',
  responded_at    TIMESTAMPTZ,
  decline_reason  TEXT
);

-- Contact Reveals (audit trail)
CREATE TABLE IF NOT EXISTS contact_reveals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id     UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  revealed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revealed_to  reveal_to_enum NOT NULL DEFAULT 'both'
);

-- Match Audit
CREATE TABLE IF NOT EXISTS match_audit (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id                 UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  computed_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_donors_in_district   INTEGER NOT NULL DEFAULT 0,
  excluded_wrong_group       INTEGER NOT NULL DEFAULT 0,
  excluded_ineligible        INTEGER NOT NULL DEFAULT 0,
  excluded_paused            INTEGER NOT NULL DEFAULT 0,
  excluded_too_far           INTEGER NOT NULL DEFAULT 0,
  excluded_recently_notified INTEGER NOT NULL DEFAULT 0,
  notified_count             INTEGER NOT NULL DEFAULT 0,
  payload                    JSONB
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_donors_district ON donors(district);
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_phone ON donors(phone);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_district ON blood_requests(district);
CREATE INDEX IF NOT EXISTS idx_notifications_donor ON notifications(donor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_request ON notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_contact_reveals_request ON contact_reveals(request_id);
CREATE INDEX IF NOT EXISTS idx_contact_reveals_donor ON contact_reveals(donor_id);
CREATE INDEX IF NOT EXISTS idx_match_audit_request ON match_audit(request_id);


-- ============================================
-- ROW LEVEL SECURITY (basic — tighten per your auth model)
-- ============================================

ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_reveals ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_audit ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by server actions)
CREATE POLICY "Service role full access on donors" ON donors
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on blood_requests" ON blood_requests
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on contact_reveals" ON contact_reveals
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on match_audit" ON match_audit
  FOR ALL USING (true) WITH CHECK (true);
