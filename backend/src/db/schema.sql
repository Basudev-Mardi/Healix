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

-- =========================
-- MODULE 03: IPD MANAGEMENT
-- =========================

CREATE TABLE IF NOT EXISTS ipd_beds (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  ward TEXT NOT NULL,
  room TEXT NOT NULL,
  bed_number TEXT NOT NULL,
  bed_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available',
  current_admission_id TEXT
);

CREATE TABLE IF NOT EXISTS ipd_admission_requests (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  department TEXT NOT NULL,
  requested_bed_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Normal',
  requested_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  reviewed_by TEXT,
  review_notes TEXT,
  converted_admission_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ipd_admissions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  admission_request_id TEXT,
  admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admitting_doctor TEXT NOT NULL,
  department TEXT NOT NULL,
  ward TEXT NOT NULL,
  room TEXT NOT NULL,
  bed_id TEXT NOT NULL REFERENCES ipd_beds(id),
  bed_label TEXT NOT NULL,
  reason TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Admitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ipd_transfers (
  id TEXT PRIMARY KEY,
  admission_id TEXT NOT NULL REFERENCES ipd_admissions(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  from_department TEXT NOT NULL,
  from_ward TEXT NOT NULL,
  from_room TEXT NOT NULL,
  from_bed_id TEXT NOT NULL,
  to_department TEXT NOT NULL,
  to_ward TEXT NOT NULL,
  to_room TEXT NOT NULL,
  to_bed_id TEXT NOT NULL REFERENCES ipd_beds(id),
  reason TEXT NOT NULL,
  requesting_doctor TEXT NOT NULL,
  responsible_staff TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  transferred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ipd_progress_notes (
  id TEXT PRIMARY KEY,
  admission_id TEXT NOT NULL REFERENCES ipd_admissions(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  note_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by TEXT NOT NULL,
  recorded_role TEXT NOT NULL,
  vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
  symptoms TEXT NOT NULL,
  observations TEXT NOT NULL,
  patient_condition TEXT NOT NULL DEFAULT 'Stable',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ipd_treatment_plans (
  id TEXT PRIMARY KEY,
  admission_id TEXT NOT NULL REFERENCES ipd_admissions(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  treatment_instructions TEXT NOT NULL,
  medications TEXT NOT NULL,
  procedures TEXT NOT NULL DEFAULT 'None',
  care_requirements TEXT NOT NULL DEFAULT '',
  assigned_staff TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ipd_discharges (
  id TEXT PRIMARY KEY,
  admission_id TEXT NOT NULL UNIQUE REFERENCES ipd_admissions(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  discharge_date TEXT NOT NULL,
  reason TEXT NOT NULL,
  clinical_clearance BOOLEAN NOT NULL DEFAULT FALSE,
  billing_clearance BOOLEAN NOT NULL DEFAULT FALSE,
  pharmacy_clearance BOOLEAN NOT NULL DEFAULT FALSE,
  doctor_approval BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  discharge_summary_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ipd_discharge_summaries (
  id TEXT PRIMARY KEY,
  admission_id TEXT NOT NULL UNIQUE REFERENCES ipd_admissions(id) ON DELETE CASCADE,
  discharge_id TEXT,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  admission_date TEXT NOT NULL,
  discharge_date TEXT NOT NULL,
  final_diagnosis TEXT NOT NULL,
  treatment_received TEXT NOT NULL,
  procedures_performed TEXT NOT NULL DEFAULT 'None',
  clinical_progress TEXT NOT NULL,
  discharge_medications TEXT NOT NULL,
  follow_up_instructions TEXT NOT NULL,
  recommendations TEXT NOT NULL DEFAULT '',
  responsible_doctor TEXT NOT NULL,
  authorized_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =======================================
-- MODULE 04: WARD & BED MANAGEMENT
-- =======================================

CREATE TABLE IF NOT EXISTS wards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  ward_type TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ipd_beds ADD COLUMN IF NOT EXISTS ward_id TEXT;
ALTER TABLE ipd_beds ADD COLUMN IF NOT EXISTS is_isolation BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ipd_beds ADD COLUMN IF NOT EXISTS isolation_type TEXT NOT NULL DEFAULT '';
ALTER TABLE ipd_beds ADD COLUMN IF NOT EXISTS isolation_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE ipd_beds ADD COLUMN IF NOT EXISTS cleaning_status TEXT NOT NULL DEFAULT 'Cleaned';

CREATE TABLE IF NOT EXISTS bed_allocations (
  id TEXT PRIMARY KEY,
  bed_id TEXT NOT NULL REFERENCES ipd_beds(id) ON DELETE CASCADE,
  admission_id TEXT NOT NULL REFERENCES ipd_admissions(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  ward_name TEXT NOT NULL,
  room TEXT NOT NULL,
  bed_number TEXT NOT NULL,
  is_isolation BOOLEAN NOT NULL DEFAULT FALSE,
  isolation_reason TEXT NOT NULL DEFAULT '',
  allocated_by TEXT NOT NULL,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS bed_cleaning_logs (
  id TEXT PRIMARY KEY,
  bed_id TEXT NOT NULL REFERENCES ipd_beds(id) ON DELETE CASCADE,
  ward_name TEXT NOT NULL,
  bed_number TEXT NOT NULL,
  is_isolation_bed BOOLEAN NOT NULL DEFAULT FALSE,
  cleaning_status TEXT NOT NULL DEFAULT 'Pending Cleaning',
  sanitization_protocol TEXT NOT NULL DEFAULT 'Standard Terminal Clean',
  responsible_staff TEXT NOT NULL DEFAULT 'Housekeeping Team',
  notes TEXT NOT NULL DEFAULT '',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- MODULE 05: ICU MANAGEMENT
-- =========================

CREATE TABLE IF NOT EXISTS icu_admissions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  referring_doctor TEXT NOT NULL,
  icu_ward TEXT NOT NULL DEFAULT 'ICU Wing',
  bed_id TEXT NOT NULL REFERENCES ipd_beds(id),
  bed_label TEXT NOT NULL,
  care_team TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS icu_monitoring_records (
  id TEXT PRIMARY KEY,
  icu_admission_id TEXT NOT NULL REFERENCES icu_admissions(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responsible_staff TEXT NOT NULL,
  patient_condition TEXT NOT NULL DEFAULT 'Critical',
  monitoring_status TEXT NOT NULL DEFAULT 'Continuous Telemetry',
  neurological_status TEXT NOT NULL DEFAULT 'Alert & Oriented',
  fluid_balance TEXT NOT NULL DEFAULT 'Balanced',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS icu_vital_thresholds (
  id TEXT PRIMARY KEY,
  systolic_min INTEGER NOT NULL DEFAULT 90,
  systolic_max INTEGER NOT NULL DEFAULT 140,
  heart_rate_min INTEGER NOT NULL DEFAULT 55,
  heart_rate_max INTEGER NOT NULL DEFAULT 110,
  resp_rate_min INTEGER NOT NULL DEFAULT 10,
  resp_rate_max INTEGER NOT NULL DEFAULT 24,
  temp_min NUMERIC(5,2) NOT NULL DEFAULT 96.5,
  temp_max NUMERIC(5,2) NOT NULL DEFAULT 100.4,
  spo2_min INTEGER NOT NULL DEFAULT 92,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS icu_vital_signs (
  id TEXT PRIMARY KEY,
  icu_admission_id TEXT NOT NULL REFERENCES icu_admissions(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responsible_staff TEXT NOT NULL,
  systolic_bp INTEGER NOT NULL,
  diastolic_bp INTEGER NOT NULL,
  heart_rate INTEGER NOT NULL,
  respiratory_rate INTEGER NOT NULL,
  temperature_f NUMERIC(5,2) NOT NULL,
  spo2 INTEGER NOT NULL,
  is_abnormal BOOLEAN NOT NULL DEFAULT FALSE,
  abnormal_flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS icu_care_notes (
  id TEXT PRIMARY KEY,
  icu_admission_id TEXT NOT NULL REFERENCES icu_admissions(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  patient_condition TEXT NOT NULL,
  clinical_observations TEXT NOT NULL,
  diagnosis_update TEXT NOT NULL DEFAULT '',
  treatment_update TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS icu_ventilator_records (
  id TEXT PRIMARY KEY,
  icu_admission_id TEXT NOT NULL REFERENCES icu_admissions(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responsible_staff TEXT NOT NULL,
  ventilator_status TEXT NOT NULL DEFAULT 'Active',
  mode TEXT NOT NULL DEFAULT 'AC/VC',
  fio2_percent INTEGER NOT NULL DEFAULT 40,
  peep_cmh2o INTEGER NOT NULL DEFAULT 5,
  tidal_volume_ml INTEGER NOT NULL DEFAULT 450,
  resp_rate_set INTEGER NOT NULL DEFAULT 14,
  observations TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS icu_medications (
  id TEXT PRIMARY KEY,
  icu_admission_id TEXT NOT NULL REFERENCES icu_admissions(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  route TEXT NOT NULL,
  frequency TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  actual_administered_at TIMESTAMPTZ,
  administering_staff TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS icu_dispositions (
  id TEXT PRIMARY KEY,
  icu_admission_id TEXT NOT NULL REFERENCES icu_admissions(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  disposition_type TEXT NOT NULL,
  destination TEXT NOT NULL,
  target_bed_id TEXT,
  reason TEXT NOT NULL,
  responsible_doctor TEXT NOT NULL,
  handover_details TEXT NOT NULL DEFAULT '',
  discharge_condition TEXT NOT NULL DEFAULT '',
  discharge_instructions TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Requested',
  approved_by TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =======================================
-- MODULE 06: OPERATION THEATRE MANAGEMENT
-- =======================================

CREATE TABLE IF NOT EXISTS ot_theatres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  specialty TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available',
  current_surgery_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ot_surgeons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  role_type TEXT NOT NULL DEFAULT 'Surgeon',
  is_available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ot_surgeries (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  admission_id TEXT,
  theatre_id TEXT NOT NULL REFERENCES ot_theatres(id),
  theatre_name TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  surgery_type TEXT NOT NULL DEFAULT 'Elective',
  procedure_name TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Normal',
  status TEXT NOT NULL DEFAULT 'Scheduled',
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ot_surgeon_assignments (
  id TEXT PRIMARY KEY,
  surgery_id TEXT NOT NULL REFERENCES ot_surgeries(id) ON DELETE CASCADE,
  surgeon_id TEXT NOT NULL REFERENCES ot_surgeons(id),
  surgeon_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  assigned_role TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ot_preop_checklists (
  id TEXT PRIMARY KEY,
  surgery_id TEXT NOT NULL UNIQUE REFERENCES ot_surgeries(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  procedure_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  consent_signed BOOLEAN NOT NULL DEFAULT FALSE,
  allergies_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  allergies_notes TEXT NOT NULL DEFAULT 'None',
  npo_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  preop_labs_ready BOOLEAN NOT NULL DEFAULT FALSE,
  anesthesia_clearance BOOLEAN NOT NULL DEFAULT FALSE,
  site_marked BOOLEAN NOT NULL DEFAULT FALSE,
  preparation_notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending',
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ot_surgical_records (
  id TEXT PRIMARY KEY,
  surgery_id TEXT NOT NULL UNIQUE REFERENCES ot_surgeries(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  procedure_performed TEXT NOT NULL,
  surgery_date TEXT NOT NULL,
  actual_start_time TEXT NOT NULL,
  actual_end_time TEXT NOT NULL,
  primary_surgeon TEXT NOT NULL,
  assisting_surgeons TEXT NOT NULL DEFAULT '',
  participating_staff TEXT NOT NULL DEFAULT '',
  surgical_findings TEXT NOT NULL,
  operative_notes TEXT NOT NULL,
  complications TEXT NOT NULL DEFAULT 'None',
  outcome TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ot_anesthesia_records (
  id TEXT PRIMARY KEY,
  surgery_id TEXT NOT NULL UNIQUE REFERENCES ot_surgeries(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  anesthesiologist TEXT NOT NULL,
  anesthesia_type TEXT NOT NULL,
  pre_anesthesia_assessment TEXT NOT NULL,
  medications_and_dosages TEXT NOT NULL,
  intraop_monitoring TEXT NOT NULL DEFAULT '',
  anesthesia_start_time TEXT NOT NULL,
  anesthesia_end_time TEXT NOT NULL,
  recovery_details TEXT NOT NULL DEFAULT '',
  observations TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ot_postop_monitoring (
  id TEXT PRIMARY KEY,
  surgery_id TEXT NOT NULL REFERENCES ot_surgeries(id) ON DELETE CASCADE,
  surgical_record_id TEXT REFERENCES ot_surgical_records(id) ON DELETE SET NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responsible_staff TEXT NOT NULL,
  patient_condition TEXT NOT NULL DEFAULT 'Recovering',
  vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
  pain_score TEXT NOT NULL DEFAULT '3/10',
  recovery_status TEXT NOT NULL DEFAULT 'PACU Observation',
  medications_and_care TEXT NOT NULL DEFAULT '',
  complications TEXT NOT NULL DEFAULT 'None',
  observations TEXT NOT NULL DEFAULT '',
  transfer_destination TEXT NOT NULL DEFAULT 'PACU / Recovery',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =======================================
-- MODULE 07: LABORATORY MANAGEMENT (LIS)
-- =======================================

CREATE TABLE IF NOT EXISTS lab_tests (
  id TEXT PRIMARY KEY,
  test_code TEXT NOT NULL UNIQUE,
  test_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  specimen_type TEXT NOT NULL,
  department TEXT NOT NULL,
  result_format TEXT NOT NULL DEFAULT 'Numerical',
  unit TEXT NOT NULL DEFAULT '',
  ref_min NUMERIC(10,2),
  ref_max NUMERIC(10,2),
  reference_range_label TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  turnaround_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_requests (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  referring_doctor TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Routine',
  clinical_notes TEXT NOT NULL DEFAULT '',
  test_ids TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_samples (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE REFERENCES lab_requests(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  specimen_type TEXT NOT NULL,
  collected_by TEXT NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Collected',
  rejection_reason TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  tracking_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_results (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES lab_requests(id) ON DELETE CASCADE,
  sample_id TEXT NOT NULL REFERENCES lab_samples(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL REFERENCES lab_tests(id),
  test_code TEXT NOT NULL,
  test_name TEXT NOT NULL,
  result_format TEXT NOT NULL DEFAULT 'Numerical',
  result_value TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  reference_range TEXT NOT NULL DEFAULT '',
  is_out_of_range BOOLEAN NOT NULL DEFAULT FALSE,
  remarks TEXT NOT NULL DEFAULT '',
  processed_by TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status TEXT NOT NULL DEFAULT 'Pending',
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  correction_notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, test_id)
);

CREATE TABLE IF NOT EXISTS lab_reports (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE REFERENCES lab_requests(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  referring_doctor TEXT NOT NULL,
  verified_by TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  report_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- =======================================
-- MODULE 08: RADIOLOGY MANAGEMENT (RIS)
-- =======================================

CREATE TABLE IF NOT EXISTS radiology_equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  modality TEXT NOT NULL,
  room_location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS radiology_requests (
  id TEXT PRIMARY KEY,
  examination_id TEXT NOT NULL UNIQUE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  modality TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  body_region TEXT NOT NULL,
  clinical_indication TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  mri_screening JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority TEXT NOT NULL DEFAULT 'Routine',
  referring_doctor TEXT NOT NULL,
  assigned_technician TEXT NOT NULL DEFAULT '',
  exam_date TEXT NOT NULL DEFAULT '',
  exam_time TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS radiology_appointments (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES radiology_requests(id) ON DELETE CASCADE,
  examination_id TEXT NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  modality TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  equipment_id TEXT NOT NULL REFERENCES radiology_equipment(id),
  equipment_name TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  cancel_reason TEXT NOT NULL DEFAULT '',
  scheduling_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS radiology_images (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES radiology_requests(id) ON DELETE CASCADE,
  examination_id TEXT NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  modality TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/svg+xml',
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  image_data_url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS radiology_reports (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE REFERENCES radiology_requests(id) ON DELETE CASCADE,
  examination_id TEXT NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  modality TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  body_region TEXT NOT NULL,
  referring_doctor TEXT NOT NULL,
  image_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  findings TEXT NOT NULL,
  observations TEXT NOT NULL DEFAULT '',
  impression TEXT NOT NULL,
  conclusion TEXT NOT NULL DEFAULT '',
  radiologist_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  report_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =======================================
-- MODULE 09: PHARMACY MANAGEMENT
-- =======================================

CREATE TABLE IF NOT EXISTS pharmacy_suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  license_number TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_medicines (
  id TEXT PRIMARY KEY,
  medicine_code TEXT NOT NULL UNIQUE,
  medicine_name TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  strength TEXT NOT NULL,
  dosage_form TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_stock_threshold INTEGER NOT NULL DEFAULT 20,
  reserved_qty INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_batches (
  id TEXT PRIMARY KEY,
  batch_number TEXT NOT NULL,
  medicine_id TEXT NOT NULL REFERENCES pharmacy_medicines(id) ON DELETE CASCADE,
  supplier_id TEXT REFERENCES pharmacy_suppliers(id) ON DELETE SET NULL,
  manufacturer TEXT NOT NULL,
  initial_qty INTEGER NOT NULL,
  remaining_qty INTEGER NOT NULL,
  purchase_date TEXT NOT NULL,
  manufacturing_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active',
  expiry_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (medicine_id, batch_number)
);

CREATE TABLE IF NOT EXISTS pharmacy_stock_movements (
  id TEXT PRIMARY KEY,
  medicine_id TEXT NOT NULL REFERENCES pharmacy_medicines(id) ON DELETE CASCADE,
  batch_id TEXT REFERENCES pharmacy_batches(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL,
  quantity_delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  performed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_prescriptions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Pending',
  validated_by TEXT,
  validated_at TIMESTAMPTZ,
  processing_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  prescribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_dispensings (
  id TEXT PRIMARY KEY,
  prescription_id TEXT NOT NULL REFERENCES pharmacy_prescriptions(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  medicine_id TEXT NOT NULL REFERENCES pharmacy_medicines(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  batch_id TEXT NOT NULL REFERENCES pharmacy_batches(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  quantity_dispensed INTEGER NOT NULL,
  dosage_instructions TEXT NOT NULL DEFAULT '',
  dispensed_by TEXT NOT NULL,
  dispensed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =======================================
-- MODULE 10: BILLING & FINANCE MANAGEMENT
-- =======================================

CREATE TABLE IF NOT EXISTS billing_insurance_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tpa_code TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  coverage_notes TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_invoices (
  id TEXT PRIMARY KEY,
  bill_number TEXT NOT NULL UNIQUE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  category TEXT NOT NULL,
  source_reference_id TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit_applied NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  refunded_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Unpaid',
  due_date TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'Full',
  payment_method TEXT NOT NULL,
  reference_number TEXT NOT NULL DEFAULT '',
  received_by TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_insurance_claims (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  provider_id TEXT NOT NULL REFERENCES billing_insurance_providers(id),
  provider_name TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  coverage_verified BOOLEAN NOT NULL DEFAULT FALSE,
  pre_auth_number TEXT NOT NULL DEFAULT '',
  claimed_amount NUMERIC(12,2) NOT NULL,
  approved_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  settled_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Submitted',
  rejection_reason TEXT NOT NULL DEFAULT '',
  submitted_by TEXT NOT NULL,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_refunds (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
  payment_id TEXT REFERENCES billing_payments(id) ON DELETE SET NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  refund_type TEXT NOT NULL DEFAULT 'Partial',
  amount NUMERIC(12,2) NOT NULL,
  refund_method TEXT NOT NULL,
  reason TEXT NOT NULL,
  authorized_by TEXT NOT NULL,
  processed_by TEXT NOT NULL,
  refunded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =======================================
-- MODULE 11: BLOOD BANK MANAGEMENT
-- =======================================

CREATE TABLE IF NOT EXISTS blood_donors (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  blood_group TEXT NOT NULL,
  weight_kg NUMERIC(5,1) NOT NULL DEFAULT 60,
  hemoglobin_gdl NUMERIC(4,1) NOT NULL DEFAULT 13.5,
  medical_history TEXT NOT NULL DEFAULT 'No contraindications',
  eligibility_status TEXT NOT NULL DEFAULT 'Eligible',
  deferral_reason TEXT NOT NULL DEFAULT '',
  last_donation_date TEXT NOT NULL DEFAULT '',
  total_donations INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blood_units (
  id TEXT PRIMARY KEY,
  donation_id TEXT NOT NULL,
  donor_id TEXT NOT NULL REFERENCES blood_donors(id) ON DELETE CASCADE,
  donor_name TEXT NOT NULL,
  source_unit_id TEXT,
  blood_group TEXT NOT NULL,
  component TEXT NOT NULL DEFAULT 'Whole Blood',
  volume_ml INTEGER NOT NULL DEFAULT 450,
  collection_center TEXT NOT NULL DEFAULT 'Main Hospital Blood Center',
  storage_location TEXT NOT NULL DEFAULT 'Cold Room Fridge A1',
  storage_temp TEXT NOT NULL DEFAULT '2°C - 6°C',
  collection_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  screening_status TEXT NOT NULL DEFAULT 'Pending',
  screening_notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Testing',
  reserved_for_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blood_requests (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  department TEXT NOT NULL,
  requested_blood_group TEXT NOT NULL,
  component TEXT NOT NULL,
  units_requested INTEGER NOT NULL DEFAULT 1,
  units_fulfilled INTEGER NOT NULL DEFAULT 0,
  urgency TEXT NOT NULL DEFAULT 'Routine',
  requesting_doctor TEXT NOT NULL,
  clinical_indication TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  rejection_reason TEXT NOT NULL DEFAULT '',
  approved_by TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blood_compatibility_tests (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_blood_group TEXT NOT NULL,
  unit_id TEXT NOT NULL REFERENCES blood_units(id) ON DELETE CASCADE,
  donor_blood_group TEXT NOT NULL,
  component TEXT NOT NULL,
  grouping_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  crossmatch_result TEXT NOT NULL,
  antibody_screen TEXT NOT NULL DEFAULT 'Negative',
  tested_by TEXT NOT NULL,
  tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status TEXT NOT NULL DEFAULT 'Pending',
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS blood_transfusions (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  unit_id TEXT NOT NULL UNIQUE REFERENCES blood_units(id) ON DELETE CASCADE,
  compatibility_test_id TEXT NOT NULL REFERENCES blood_compatibility_tests(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  component TEXT NOT NULL,
  volume_ml INTEGER NOT NULL DEFAULT 350,
  administering_staff TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  monitoring_observations TEXT NOT NULL DEFAULT '',
  adverse_reaction TEXT NOT NULL DEFAULT 'None',
  adverse_reaction_notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Completed'
);

CREATE TABLE IF NOT EXISTS blood_audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =======================================
-- MODULE 12: AMBULANCE MANAGEMENT
-- =======================================

CREATE TABLE IF NOT EXISTS ambulance_vehicles (
  id TEXT PRIMARY KEY,
  registration_number TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL,
  model TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  equipment_details TEXT NOT NULL DEFAULT '',
  insurance_expiry TEXT NOT NULL,
  fitness_cert_expiry TEXT NOT NULL,
  registration_valid_until TEXT NOT NULL,
  maintenance_status TEXT NOT NULL DEFAULT 'Operational',
  operational_status TEXT NOT NULL DEFAULT 'Available',
  assigned_driver_id TEXT,
  total_trips INTEGER NOT NULL DEFAULT 0,
  total_distance_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ambulance_drivers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  license_number TEXT NOT NULL UNIQUE,
  license_valid_until TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 2,
  assigned_vehicle_id TEXT,
  availability_status TEXT NOT NULL DEFAULT 'Available',
  employment_status TEXT NOT NULL DEFAULT 'Active',
  total_trips INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ambulance_requests (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  source_channel TEXT NOT NULL DEFAULT 'Emergency Dept',
  pickup_location TEXT NOT NULL,
  destination_hospital TEXT NOT NULL DEFAULT 'Healix Main Hospital',
  emergency_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'High',
  status TEXT NOT NULL DEFAULT 'Requested',
  cancel_reason TEXT NOT NULL DEFAULT '',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ambulance_dispatches (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE REFERENCES ambulance_requests(id) ON DELETE CASCADE,
  ambulance_id TEXT NOT NULL REFERENCES ambulance_vehicles(id),
  registration_number TEXT NOT NULL,
  driver_id TEXT NOT NULL REFERENCES ambulance_drivers(id),
  driver_name TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  destination_hospital TEXT NOT NULL,
  estimated_arrival_mins INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'Assigned',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dispatched_at TIMESTAMPTZ,
  arrived_pickup_at TIMESTAMPTZ,
  patient_onboard_at TIMESTAMPTZ,
  arrived_hospital_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ambulance_trips (
  id TEXT PRIMARY KEY,
  dispatch_id TEXT NOT NULL UNIQUE REFERENCES ambulance_dispatches(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  ambulance_id TEXT NOT NULL REFERENCES ambulance_vehicles(id),
  registration_number TEXT NOT NULL,
  driver_id TEXT NOT NULL REFERENCES ambulance_drivers(id),
  driver_name TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  distance_km NUMERIC(8,2) NOT NULL DEFAULT 0,
  duration_mins INTEGER NOT NULL DEFAULT 0,
  fuel_used_liters NUMERIC(6,2) NOT NULL DEFAULT 0,
  trip_status TEXT NOT NULL DEFAULT 'Completed',
  remarks TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ambulance_audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =======================================
-- MODULE 13: HR & STAFF MANAGEMENT
-- =======================================

CREATE TABLE IF NOT EXISTS hr_employees (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  qualifications TEXT NOT NULL DEFAULT '',
  experience_years INTEGER NOT NULL DEFAULT 0,
  job_title TEXT NOT NULL,
  department TEXT NOT NULL,
  position_level TEXT NOT NULL DEFAULT 'Staff',
  reporting_manager TEXT NOT NULL DEFAULT '',
  work_location TEXT NOT NULL DEFAULT 'Main Campus',
  employment_type TEXT NOT NULL DEFAULT 'Full-Time',
  joining_date TEXT NOT NULL,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  basic_salary NUMERIC(12,2) NOT NULL DEFAULT 3000,
  allowances NUMERIC(12,2) NOT NULL DEFAULT 500,
  tax_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 10,
  overtime_hourly_rate NUMERIC(8,2) NOT NULL DEFAULT 25,
  leave_balances JSONB NOT NULL DEFAULT '{"annual":18,"sick":10,"casual":6}'::jsonb,
  employment_status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_department_assignments (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  from_department TEXT NOT NULL DEFAULT '',
  to_department TEXT NOT NULL,
  new_job_title TEXT NOT NULL,
  reporting_manager TEXT NOT NULL DEFAULT '',
  work_location TEXT NOT NULL DEFAULT 'Main Campus',
  change_type TEXT NOT NULL DEFAULT 'Transfer',
  effective_date TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  approved_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_attendance (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  attendance_date TEXT NOT NULL,
  check_in_time TEXT NOT NULL DEFAULT '',
  check_out_time TEXT NOT NULL DEFAULT '',
  working_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_late BOOLEAN NOT NULL DEFAULT FALSE,
  is_early_departure BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Present',
  correction_note TEXT NOT NULL DEFAULT '',
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS hr_shifts (
  id TEXT PRIMARY KEY,
  shift_name TEXT NOT NULL,
  employee_id TEXT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  shift_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_rotating BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_leaves (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  leave_type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days_count INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  document_ref TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending',
  reviewed_by TEXT,
  review_note TEXT NOT NULL DEFAULT '',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr_payroll (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  payroll_month TEXT NOT NULL,
  basic_pay NUMERIC(12,2) NOT NULL,
  allowances NUMERIC(12,2) NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  overtime_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
  gross_pay NUMERIC(12,2) NOT NULL,
  unpaid_leave_deduction NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_deduction NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  approved_by TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, payroll_month)
);

CREATE TABLE IF NOT EXISTS hr_performance_reviews (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  review_period TEXT NOT NULL,
  rating NUMERIC(3,1) NOT NULL DEFAULT 4.0,
  targets TEXT NOT NULL DEFAULT '',
  achievements TEXT NOT NULL DEFAULT '',
  feedback TEXT NOT NULL DEFAULT '',
  disciplinary_notes TEXT NOT NULL DEFAULT '',
  appraisal_decision TEXT NOT NULL DEFAULT 'Met Expectations',
  reviewer_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
