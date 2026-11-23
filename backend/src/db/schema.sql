-- Healix Hospital Management System — Lakebase Postgres (Neon) Schema

CREATE TABLE IF NOT EXISTS entity_counters (
  counter_key TEXT PRIMARY KEY,
  current_value INTEGER NOT NULL DEFAULT 0
);

-- Shared Patient Registry (used by OPD & Emergency Management)
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT 'Unknown',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  blood_group TEXT NOT NULL DEFAULT 'Unknown',
  emergency_contact_name TEXT NOT NULL DEFAULT '',
  emergency_contact_phone TEXT NOT NULL DEFAULT '',
  allergies TEXT NOT NULL DEFAULT 'None',
  is_unknown BOOLEAN NOT NULL DEFAULT FALSE,
  distinguishing_marks TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- MODULE 01: OPD MANAGEMENT
-- ========================

CREATE TABLE IF NOT EXISTS opd_doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  specialization TEXT NOT NULL,
  room TEXT NOT NULL,
  available_days INTEGER[] NOT NULL,
  slots TEXT[] NOT NULL
);

CREATE TABLE IF NOT EXISTS opd_appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  doctor_id TEXT NOT NULL REFERENCES opd_doctors(id),
  appointment_date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  visit_type TEXT NOT NULL DEFAULT 'Appointment',
  priority TEXT NOT NULL DEFAULT 'Normal',
  reason TEXT NOT NULL DEFAULT 'OPD Consultation',
  status TEXT NOT NULL DEFAULT 'Scheduled',
  token_id TEXT,
  original_consultation_id TEXT,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opd_appointments_doc_date
  ON opd_appointments (doctor_id, appointment_date);

CREATE TABLE IF NOT EXISTS opd_tokens (
  id TEXT PRIMARY KEY,
  token_number TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  token_date TEXT NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES opd_doctors(id),
  department TEXT NOT NULL,
  appointment_id TEXT NOT NULL REFERENCES opd_appointments(id) ON DELETE CASCADE,
  visit_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Normal',
  status TEXT NOT NULL DEFAULT 'Waiting',
  called_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opd_tokens_status
  ON opd_tokens (status, sequence);

CREATE TABLE IF NOT EXISTS opd_consultations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES opd_doctors(id),
  department TEXT NOT NULL,
  appointment_id TEXT NOT NULL REFERENCES opd_appointments(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL UNIQUE REFERENCES opd_tokens(id) ON DELETE CASCADE,
  visit_date TEXT NOT NULL,
  vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
  symptoms TEXT NOT NULL,
  observations TEXT NOT NULL DEFAULT '',
  diagnosis TEXT NOT NULL,
  clinical_notes TEXT NOT NULL DEFAULT '',
  treatment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'In Progress',
  follow_up_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opd_follow_ups (
  id TEXT PRIMARY KEY,
  original_consultation_id TEXT NOT NULL REFERENCES opd_consultations(id) ON DELETE CASCADE,
  original_appointment_id TEXT NOT NULL REFERENCES opd_appointments(id) ON DELETE CASCADE,
  follow_up_appointment_id TEXT NOT NULL REFERENCES opd_appointments(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES opd_doctors(id),
  department TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================
-- MODULE 02: EMERGENCY MANAGEMENT
-- ==============================

CREATE TABLE IF NOT EXISTS emergency_staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  specialty TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS emergency_registrations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  is_unknown_identity BOOLEAN NOT NULL DEFAULT FALSE,
  arrival_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  arrival_mode TEXT NOT NULL,
  emergency_type TEXT NOT NULL,
  presenting_complaints TEXT NOT NULL,
  assigned_bay TEXT NOT NULL,
  triage_level TEXT NOT NULL DEFAULT 'Unassessed',
  queue_status TEXT NOT NULL DEFAULT 'Waiting',
  registered_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_triages (
  id TEXT PRIMARY KEY,
  emergency_id TEXT NOT NULL UNIQUE REFERENCES emergency_registrations(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  triage_level TEXT NOT NULL,
  vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
  symptoms TEXT NOT NULL,
  severity_summary TEXT NOT NULL DEFAULT '',
  assessment_notes TEXT NOT NULL DEFAULT '',
  assessed_by TEXT NOT NULL,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_traumas (
  id TEXT PRIMARY KEY,
  emergency_id TEXT NOT NULL REFERENCES emergency_registrations(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  injury_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  mechanism_of_injury TEXT NOT NULL,
  affected_body_areas TEXT[] NOT NULL,
  airway_status TEXT NOT NULL DEFAULT 'Patent',
  bleeding_control TEXT NOT NULL DEFAULT 'None required',
  assessment_notes TEXT NOT NULL DEFAULT '',
  treatment_progress TEXT NOT NULL DEFAULT 'Active Resuscitation',
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_treatments (
  id TEXT PRIMARY KEY,
  emergency_id TEXT NOT NULL REFERENCES emergency_registrations(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  attending_doctor TEXT NOT NULL,
  emergency_staff_involved TEXT NOT NULL DEFAULT '',
  vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
  diagnosis TEXT NOT NULL,
  observations TEXT NOT NULL DEFAULT '',
  treatments_and_procedures TEXT NOT NULL,
  medications_administered TEXT NOT NULL DEFAULT 'None',
  status TEXT NOT NULL DEFAULT 'Ongoing',
  outcome TEXT NOT NULL DEFAULT '',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_alerts (
  id TEXT PRIMARY KEY,
  emergency_id TEXT NOT NULL REFERENCES emergency_registrations(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  assigned_bay TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  condition_summary TEXT NOT NULL,
  notified_groups TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'Unresolved',
  triggered_by TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

CREATE TABLE IF NOT EXISTS emergency_transfers (
  id TEXT PRIMARY KEY,
  emergency_id TEXT NOT NULL REFERENCES emergency_registrations(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  from_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  target_bed_or_unit TEXT NOT NULL,
  reason TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  responsible_staff TEXT NOT NULL,
  handover_details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Requested',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  transferred_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
