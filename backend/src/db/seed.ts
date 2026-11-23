import { createDirectPool } from "./client.js";

const STANDARD_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

function isoDateOffset(days: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function seed() {
  const pool = createDirectPool();
  const today = isoDateOffset(0);
  const yesterday = isoDateOffset(-1);
  const nextWeek = isoDateOffset(7);

  try {
    // 1. OPD Doctors
    const doctors = [
      ["DOC-001", "Dr. Rajesh Mehta", "General Medicine", "Internal Medicine", "OPD-101"],
      ["DOC-002", "Dr. Lin Chen", "Cardiology", "Interventional Cardiology", "OPD-204"],
      ["DOC-003", "Dr. Sunita Kapoor", "Orthopedics", "Joint & Spine Surgery", "OPD-108"],
      ["DOC-004", "Dr. Aarav Deshmukh", "Pediatrics", "Child Health & Immunization", "OPD-112"],
      ["DOC-005", "Dr. Clara Jensen", "Dermatology", "Clinical Dermatology", "OPD-209"],
    ];
    for (const [id, name, department, specialization, room] of doctors) {
      await pool.query(
        `INSERT INTO opd_doctors (id, name, department, specialization, room, available_days, slots)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, department, specialization, room, [0, 1, 2, 3, 4, 5, 6], STANDARD_SLOTS]
      );
    }

    // 2. Emergency Staff
    const erStaff = [
      ["ER-DOC-01", "Dr. Arjun Sen", "Emergency Physician", "Trauma & Resuscitation"],
      ["ER-DOC-02", "Dr. Meera Iyer", "Emergency Physician", "Acute Cardiac & Stroke Care"],
      ["ER-DOC-03", "Dr. Kabir Malhotra", "Trauma Surgeon", "Orthopedic & Polytrauma"],
      ["ER-RN-01", "Nurse Elena Gomez", "Triage Charge Nurse", "Emergency Triage"],
      ["ER-RN-02", "Nurse Rohan Das", "Critical Care Nurse", "Resuscitation Bay"],
    ];
    for (const [id, name, role, specialty] of erStaff) {
      await pool.query(
        `INSERT INTO emergency_staff (id, name, role, specialty)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, role, specialty]
      );
    }

    // 3. Seed Patients
    const patients = [
      [
        "PAT-2026-0001",
        "Ananya Sharma",
        "1991-05-14",
        "Female",
        "9876543210",
        "ananya.sharma@example.com",
        "14 Park Avenue, Sector 7",
        "O+",
        "Rohan Sharma",
        "9876543211",
        "Penicillin",
        false,
        "",
      ],
      [
        "PAT-2026-0002",
        "Vikram Rao",
        "1972-09-22",
        "Male",
        "9811223344",
        "vikram.rao@example.com",
        "88 Lakeview Residency",
        "B+",
        "Meera Rao",
        "9811223345",
        "None",
        false,
        "",
      ],
      [
        "PAT-2026-0003",
        "Claire Evans",
        "1989-11-03",
        "Female",
        "9822334455",
        "claire.evans@example.com",
        "212 Cedar Heights",
        "A+",
        "Mark Evans",
        "9822334456",
        "Sulfa drugs",
        false,
        "",
      ],
      [
        "PAT-UNK-0001",
        "Unknown Male #1 (RTA)",
        "Est. 35 yrs",
        "Male",
        "Unknown",
        "",
        "",
        "Unknown",
        "",
        "",
        "Unknown",
        true,
        "Blue jacket, no ID found at scene",
      ],
    ];
    for (const row of patients) {
      await pool.query(
        `INSERT INTO patients (
          id, full_name, date_of_birth, gender, phone, email, address,
          blood_group, emergency_contact_name, emergency_contact_phone,
          allergies, is_unknown, distinguishing_marks
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (id) DO NOTHING`,
        row
      );
    }

    // 4. Seed OPD Records
    await pool.query(
      `INSERT INTO opd_appointments (id, patient_id, department, doctor_id, appointment_date, time_slot, visit_type, priority, reason, status, token_id)
       VALUES
         ('APT-2026-0001','PAT-2026-0002','Cardiology','DOC-002',$1,'10:00','Appointment','Normal','Routine post-angioplasty blood pressure review','Completed','TKN-2026-0001'),
         ('APT-2026-0002','PAT-2026-0001','General Medicine','DOC-001',$2,'10:00','Appointment','Normal','Persistent fever and fatigue for 3 days','Checked In','TKN-2026-0002'),
         ('APT-2026-0003','PAT-2026-0003','Orthopedics','DOC-003',$2,'10:30','Appointment','Normal','Right knee stiffness after running','Scheduled',NULL),
         ('APT-2026-0004','PAT-2026-0002','Cardiology','DOC-002',$3,'10:30','Follow-up','Normal','Follow-up ECG and lipid profile review','Scheduled',NULL)
       ON CONFLICT (id) DO NOTHING`,
      [yesterday, today, nextWeek]
    );

    await pool.query(
      `INSERT INTO opd_tokens (id, token_number, sequence, token_date, patient_id, doctor_id, department, appointment_id, visit_type, priority, status)
       VALUES
         ('TKN-2026-0001','OPD-001',1,$1,'PAT-2026-0002','DOC-002','Cardiology','APT-2026-0001','Appointment','Normal','Completed'),
         ('TKN-2026-0002','OPD-002',2,$2,'PAT-2026-0001','DOC-001','General Medicine','APT-2026-0002','Appointment','Normal','Waiting')
       ON CONFLICT (id) DO NOTHING`,
      [yesterday, today]
    );

    await pool.query(
      `INSERT INTO opd_consultations (id, patient_id, doctor_id, department, appointment_id, token_id, visit_date, vitals, symptoms, observations, diagnosis, clinical_notes, treatment, status, follow_up_id)
       VALUES (
         'CON-2026-0001','PAT-2026-0002','DOC-002','Cardiology','APT-2026-0001','TKN-2026-0001',$1,
         '{"bloodPressure":"128/82 mmHg","temperature":"98.4 °F","pulse":"72 bpm","spo2":"98%"}'::jsonb,
         'Mild exertional dyspnea, no chest pain',
         'Heart sounds normal S1/S2, lungs clear bilaterally',
         'Stable Coronary Artery Disease (Post-PCI)',
         'Continue dual antiplatelet therapy and low-sodium diet.',
         'Aspirin 75mg OD, Atorvastatin 40mg HS, Metoprolol 25mg OD',
         'Completed','FUP-2026-0001'
       ) ON CONFLICT (id) DO NOTHING`,
      [yesterday]
    );

    await pool.query(
      `INSERT INTO opd_follow_ups (id, original_consultation_id, original_appointment_id, follow_up_appointment_id, patient_id, doctor_id, department, scheduled_date, time_slot, instructions, status)
       VALUES (
         'FUP-2026-0001','CON-2026-0001','APT-2026-0001','APT-2026-0004','PAT-2026-0002','DOC-002','Cardiology',$1,'10:30',
         'Bring fasting lipid panel and resting ECG report.','Upcoming'
       ) ON CONFLICT (id) DO NOTHING`,
      [nextWeek]
    );

    // 5. Seed Emergency Records
    await pool.query(
      `INSERT INTO emergency_registrations (id, patient_id, patient_name, is_unknown_identity, arrival_mode, emergency_type, presenting_complaints, assigned_bay, triage_level, queue_status, registered_by)
       VALUES
         ('EMG-2026-0001','PAT-UNK-0001','Unknown Male #1 (RTA)',true,'Ambulance','Trauma','High-speed road traffic accident, suspected polytrauma and hypotension','Trauma Bay 1','Level 1 - Resuscitation','Under Treatment','Emergency Staff'),
         ('EMG-2026-0002','PAT-2026-0002','Vikram Rao',false,'Walk-in','Cardiac','Acute substernal chest tightness radiating to left arm, diaphoresis','ER Bay 3','Level 2 - Emergent','Waiting','Nurse Elena Gomez')
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO emergency_triages (id, emergency_id, patient_id, triage_level, vitals, symptoms, severity_summary, assessment_notes, assessed_by)
       VALUES
         ('TRI-2026-0001','EMG-2026-0001','PAT-UNK-0001','Level 1 - Resuscitation','{"bloodPressure":"86/54 mmHg","heartRate":"126 bpm","respiratoryRate":"28 /min","spo2":"89%","temperature":"97.6 °F","gcsScore":"11/15","painScore":"9/10"}'::jsonb,'Severe hypotension, chest tenderness, open tibial fracture','Immediate life-saving resuscitation required','Two large-bore IV lines established; massive transfusion protocol on standby.','Nurse Elena Gomez'),
         ('TRI-2026-0002','EMG-2026-0002','PAT-2026-0002','Level 2 - Emergent','{"bloodPressure":"152/94 mmHg","heartRate":"102 bpm","respiratoryRate":"22 /min","spo2":"95%","temperature":"98.4 °F","gcsScore":"15/15","painScore":"8/10"}'::jsonb,'Substernal chest pain, mild shortness of breath','High risk ACS — STAT ECG and Troponin ordered','Placed on continuous cardiac telemetry and O2 2L/min.','Nurse Elena Gomez')
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO emergency_traumas (id, emergency_id, patient_id, injury_type, severity, mechanism_of_injury, affected_body_areas, airway_status, bleeding_control, assessment_notes, treatment_progress, recorded_by)
       VALUES (
         'TRM-2026-0001','EMG-2026-0001','PAT-UNK-0001','Polytrauma','Critical','Motorcycle vs. SUV collision at ~60 km/h',
         ARRAY['Chest','Abdomen','Lower Limbs'],'Patent with high-flow O2 mask','Pressure dressing applied to right lower leg',
         'FAST ultrasound positive for minimal free fluid; trauma surgery consulting.','Active Resuscitation','Dr. Kabir Malhotra'
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO emergency_treatments (id, emergency_id, patient_id, attending_doctor, emergency_staff_involved, vitals, diagnosis, observations, treatments_and_procedures, medications_administered, status, outcome)
       VALUES (
         'ETR-2026-0001','EMG-2026-0001','PAT-UNK-0001','Dr. Arjun Sen','Dr. Kabir Malhotra, Nurse Rohan Das',
         '{"bloodPressure":"94/60 mmHg","heartRate":"118 bpm","spo2":"94%","temperature":"97.8 °F"}'::jsonb,
         'Polytrauma with Hypovolemic Shock & Open Tibia Fracture',
         'Responding partially to crystalloid bolus; FAST positive',
         '2x 16G IV access, 1L Ringer Lactate bolus, FAST exam, pelvic binder',
         'Tranexamic Acid 1g IV, Fentanyl 50mcg IV, Cefazolin 2g IV',
         'Ongoing','Prepared for urgent surgical / ICU escalation'
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO emergency_alerts (id, emergency_id, patient_id, patient_name, assigned_bay, alert_type, severity, condition_summary, notified_groups, status, triggered_by, acknowledged_by, acknowledged_at)
       VALUES
         ('ALT-2026-0001','EMG-2026-0001','PAT-UNK-0001','Unknown Male #1 (RTA)','Trauma Bay 1','Code Trauma / Resuscitation','Critical','Level 1 Polytrauma with hypotension (BP 86/54, SpO2 89%). Immediate trauma team & blood bank standby.',ARRAY['Emergency Physicians','Trauma Team','Blood Bank','OT Emergency'],'Acknowledged','Nurse Elena Gomez','Dr. Arjun Sen',NOW()),
         ('ALT-2026-0002','EMG-2026-0002','PAT-2026-0002','Vikram Rao','ER Bay 3','STAT Cardiac Evaluation','High','Acute chest pain with diaphoresis in post-PCI patient. Immediate ECG interpretation required.',ARRAY['Emergency Physicians','Cardiology STAT'],'Unresolved','Nurse Elena Gomez',NULL,NULL)
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO emergency_transfers (id, emergency_id, patient_id, from_location, destination, target_bed_or_unit, reason, requested_by, responsible_staff, handover_details, status)
       VALUES (
         'TRF-2026-0001','EMG-2026-0001','PAT-UNK-0001','Trauma Bay 1','Operating Theatre (OT)','OT-08 Emergency Trauma Suite',
         'Positive FAST exam & open fracture requiring urgent surgical control',
         'Dr. Arjun Sen','Dr. Kabir Malhotra',
         '2 units O- RBC cross-matched; TXA & antibiotics given; airway stable on O2.','Requested'
       ) ON CONFLICT (id) DO NOTHING`
    );

    // 6. Seed IPD Beds & Initial Inpatient Records
    const beds: [string, string, string, string, string, string, string, string | null][] = [
      ["BED-A101", "General Medicine", "Ward A", "Room 101", "A-101", "General", "Occupied", "ADM-2026-0001"],
      ["BED-A102", "General Medicine", "Ward A", "Room 101", "A-102", "General", "Available", null],
      ["BED-A103", "General Medicine", "Ward A", "Room 102", "A-103", "Semi-Private", "Available", null],
      ["BED-B201", "Cardiology", "Ward B", "Room 201", "B-201", "Private", "Available", null],
      ["BED-B202", "Cardiology", "Ward B", "Room 202", "B-202", "Step-Down", "Available", null],
      ["BED-C301", "Orthopedics", "Ward C", "Room 301", "C-301", "Semi-Private", "Available", null],
      ["BED-C302", "Orthopedics", "Ward C", "Room 302", "C-302", "Private", "Available", null],
      ["BED-ICU01", "Critical Care", "ICU Wing", "ICU Bay 1", "ICU-01", "ICU", "Available", null],
    ];
    for (const row of beds) {
      await pool.query(
        `INSERT INTO ipd_beds (id, department, ward, room, bed_number, bed_type, status, current_admission_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        row
      );
    }

    await pool.query(
      `INSERT INTO ipd_admission_requests (id, patient_id, patient_name, department, requested_bed_type, reason, priority, requested_by, status)
       VALUES (
         'ARQ-2026-0001','PAT-2026-0003','Claire Evans','Orthopedics','Semi-Private',
         'Arthroscopic knee repair requiring 48h inpatient post-op monitoring','Normal','Dr. Sunita Kapoor','Pending'
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO ipd_admissions (id, patient_id, patient_name, admitting_doctor, department, ward, room, bed_id, bed_label, reason, diagnosis, status)
       VALUES (
         'ADM-2026-0001','PAT-2026-0001','Ananya Sharma','Dr. Rajesh Mehta','General Medicine','Ward A','Room 101','BED-A101','Ward A / Room 101 / A-101',
         'Persistent high-grade fever and dehydration requiring IV antibiotics','Community-Acquired Pneumonia','Under Treatment'
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO ipd_progress_notes (id, admission_id, patient_id, recorded_by, recorded_role, vitals, symptoms, observations, patient_condition)
       VALUES (
         'PRG-2026-0001','ADM-2026-0001','PAT-2026-0001','Dr. Rajesh Mehta','Doctor',
         '{"bloodPressure":"116/74 mmHg","heartRate":"82 bpm","temperature":"99.1 °F","spo2":"97%","respiratoryRate":"18 /min"}'::jsonb,
         'Reduced cough and fever trending down after 24h IV Ceftriaxone',
         'Decreased right basal crackles; tolerating oral fluids well',
         'Improving'
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO ipd_treatment_plans (id, admission_id, patient_id, doctor_name, diagnosis, treatment_instructions, medications, procedures, care_requirements, assigned_staff, status, version)
       VALUES (
         'TPL-2026-0001','ADM-2026-0001','PAT-2026-0001','Dr. Rajesh Mehta','Community-Acquired Pneumonia',
         'Continue IV antibiotics for 48 hours then step down to oral therapy; monitor SpO2 q4h',
         'Ceftriaxone 1g IV q12h, Azithromycin 500mg Oral OD, Paracetamol 650mg PRN',
         'Chest X-Ray repeat on Day 3',
         'Incentive spirometry, hydration >= 2L/day',
         'Ward A Nursing Team','Active',1
       ) ON CONFLICT (id) DO NOTHING`
    );

    // 7. Seed Ward & Bed Management Configuration & Isolation Beds
    const wards: [string, string, string, string, string, number, boolean][] = [
      ["WRD-001", "Ward A", "General", "General Medicine", "Wing A - Floor 1", 12, true],
      ["WRD-002", "Ward B", "Cardiac", "Cardiology", "Wing B - Floor 2", 10, true],
      ["WRD-003", "Ward C", "Orthopedic", "Orthopedics", "Wing C - Floor 3", 10, true],
      ["WRD-004", "ICU Wing", "ICU", "Critical Care", "Critical Care Block - Floor 2", 8, true],
      ["WRD-005", "Isolation Wing", "Isolation", "Infectious Disease", "Wing D - Negative Pressure Unit", 6, true],
    ];
    for (const row of wards) {
      await pool.query(
        `INSERT INTO wards (id, name, ward_type, department, location, capacity, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        row
      );
    }

    // Link existing IPD beds to ward IDs
    await pool.query(`UPDATE ipd_beds SET ward_id = 'WRD-001' WHERE ward = 'Ward A' AND ward_id IS NULL`);
    await pool.query(`UPDATE ipd_beds SET ward_id = 'WRD-002' WHERE ward = 'Ward B' AND ward_id IS NULL`);
    await pool.query(`UPDATE ipd_beds SET ward_id = 'WRD-003' WHERE ward = 'Ward C' AND ward_id IS NULL`);
    await pool.query(`UPDATE ipd_beds SET ward_id = 'WRD-004' WHERE ward = 'ICU Wing' AND ward_id IS NULL`);

    // Add dedicated Isolation Beds
    const isolationBeds: [string, string, string, string, string, string, string, string, boolean, string, string][] = [
      ["BED-ISO01", "WRD-005", "Infectious Disease", "Isolation Wing", "Iso Room 401", "ISO-401", "Isolation", "Available", true, "Airborne / Negative Pressure", "Cleaned"],
      ["BED-ISO02", "WRD-005", "Infectious Disease", "Isolation Wing", "Iso Room 402", "ISO-402", "Isolation", "Under Cleaning", true, "Contact / Droplet", "Pending Cleaning"],
    ];
    for (const row of isolationBeds) {
      await pool.query(
        `INSERT INTO ipd_beds (id, ward_id, department, ward, room, bed_number, bed_type, status, is_isolation, isolation_type, cleaning_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO NOTHING`,
        row
      );
    }

    // Seed initial active bed allocation for ADM-2026-0001
    await pool.query(
      `INSERT INTO bed_allocations (id, bed_id, admission_id, patient_id, patient_name, ward_name, room, bed_number, is_isolation, allocated_by, status)
       VALUES ('BAL-2026-0001','BED-A101','ADM-2026-0001','PAT-2026-0001','Ananya Sharma','Ward A','Room 101','A-101',FALSE,'Ward Manager','Active')
       ON CONFLICT (id) DO NOTHING`
    );

    // Seed initial pending isolation cleaning log for BED-ISO02
    await pool.query(
      `INSERT INTO bed_cleaning_logs (id, bed_id, ward_name, bed_number, is_isolation_bed, cleaning_status, sanitization_protocol, responsible_staff, notes)
       VALUES ('CLN-2026-0001','BED-ISO02','Isolation Wing','ISO-402',TRUE,'Pending Cleaning','Isolation UV-C + Sporicidal','Housekeeping Team Alpha','Post-discharge terminal isolation disinfection required before reuse')
       ON CONFLICT (id) DO NOTHING`
    );

    // 8. Seed ICU Management Beds, Thresholds & Initial Critical Care Case
    const extraIcuBeds: [string, string, string, string, string, string, string, string, string | null][] = [
      ["BED-ICU02", "WRD-004", "Critical Care", "ICU Wing", "ICU Bay 2", "ICU-02", "ICU", "Occupied", "ICU-2026-0001"],
      ["BED-ICU03", "WRD-004", "Critical Care", "ICU Wing", "ICU Bay 3", "ICU-03", "ICU", "Available", null],
      ["BED-ICU04", "WRD-004", "Critical Care", "ICU Wing", "ICU Bay 4", "ICU-04", "ICU", "Available", null],
    ];
    for (const row of extraIcuBeds) {
      await pool.query(
        `INSERT INTO ipd_beds (id, ward_id, department, ward, room, bed_number, bed_type, status, current_admission_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO NOTHING`,
        row
      );
    }

    await pool.query(
      `INSERT INTO icu_vital_thresholds (id, systolic_min, systolic_max, heart_rate_min, heart_rate_max, resp_rate_min, resp_rate_max, temp_min, temp_max, spo2_min)
       VALUES ('default', 90, 140, 55, 110, 10, 24, 96.5, 100.4, 92)
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO icu_admissions (id, patient_id, patient_name, reason, diagnosis, referring_doctor, icu_ward, bed_id, bed_label, care_team, status)
       VALUES (
         'ICU-2026-0001','PAT-2026-0002','Vikram Rao',
         'Post-PCI hemodynamic instability requiring vasopressor & ventilator support',
         'Acute Decompensated Heart Failure with Hypoxemic Respiratory Failure',
         'Dr. Lin Chen','ICU Wing','BED-ICU02','ICU Wing / ICU Bay 2 / ICU-02',
         'Dr. Arjun Sen (Intensivist), Nurse Rohan Das (ICU RN)','Active'
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO icu_monitoring_records (id, icu_admission_id, patient_id, responsible_staff, patient_condition, monitoring_status, neurological_status, fluid_balance, notes)
       VALUES (
         'MON-2026-0001','ICU-2026-0001','PAT-2026-0002','Nurse Rohan Das',
         'Critical','1:1 Nursing','Sedated (RASS -2), pupils equal & reactive',
         '+320 mL / 12h','Arterial line & continuous ECG telemetry active; titrating norepinephrine to MAP >= 65.'
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO icu_vital_signs (id, icu_admission_id, patient_id, responsible_staff, systolic_bp, diastolic_bp, heart_rate, respiratory_rate, temperature_f, spo2, is_abnormal, abnormal_flags)
       VALUES
         ('VIT-2026-0001','ICU-2026-0001','PAT-2026-0002','Nurse Rohan Das',88,56,116,26,99.2,90,TRUE,ARRAY['Low Systolic BP (< 90)','High Heart Rate (> 110)','High Resp Rate (> 24)','Low SpO2 (< 92%)']),
         ('VIT-2026-0002','ICU-2026-0001','PAT-2026-0002','Nurse Rohan Das',104,66,98,20,98.8,95,FALSE,ARRAY[]::TEXT[])
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO icu_care_notes (id, icu_admission_id, patient_id, author_name, author_role, patient_condition, clinical_observations, diagnosis_update, treatment_update)
       VALUES (
         'CCN-2026-0001','ICU-2026-0001','PAT-2026-0002','Dr. Arjun Sen','Doctor',
         'Stabilizing','MAP improved to 78 mmHg on low-dose norepinephrine; oxygenation improved on FiO2 45%.',
         'Cardiogenic pulmonary edema responding to diuresis',
         'Continue IV Furosemide infusion; plan spontaneous breathing trial tomorrow morning if stable.'
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO icu_ventilator_records (id, icu_admission_id, patient_id, responsible_staff, ventilator_status, mode, fio2_percent, peep_cmh2o, tidal_volume_ml, resp_rate_set, observations)
       VALUES (
         'VNT-2026-0001','ICU-2026-0001','PAT-2026-0002','ICU Respiratory Therapist',
         'Active','AC/VC',45,8,440,16,'Good synchrony, peak airway pressure 24 cmH2O, ABG pH 7.38.'
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO icu_medications (id, icu_admission_id, patient_id, medication_name, dosage, route, frequency, scheduled_time, actual_administered_at, administering_staff, status, notes)
       VALUES
         ('MAR-2026-0001','ICU-2026-0001','PAT-2026-0002','Norepinephrine Infusion','0.08 mcg/kg/min','IV Continuous','Continuous','08:00',NOW(),'Nurse Rohan Das','Administered','Titrated to MAP >= 65 mmHg'),
         ('MAR-2026-0002','ICU-2026-0001','PAT-2026-0002','Furosemide','40 mg','IV Push','q12h','14:00',NULL,NULL,'Pending','Check serum potassium prior to dose')
       ON CONFLICT (id) DO NOTHING`
    );

    // 9. Seed Operation Theatre Management
    const theatres: [string, string, string, string, string, string | null][] = [
      ["OT-01", "OT Suite 1 (Cardiac)", "Cardiothoracic Surgery", "Surgical Block - Floor 2", "Available", null],
      ["OT-02", "OT Suite 2 (Orthopedic)", "Orthopedics & Joint", "Surgical Block - Floor 2", "Reserved", "SUR-2026-0001"],
      ["OT-03", "OT Suite 3 (General)", "General & Laparoscopic", "Surgical Block - Floor 2", "Available", null],
      ["OT-04", "OT Suite 4 (Trauma)", "Emergency & Trauma", "Surgical Block - Floor 1", "Cleaning", null],
    ];
    for (const row of theatres) {
      await pool.query(
        `INSERT INTO ot_theatres (id, name, specialty, location, status, current_surgery_id)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO NOTHING`,
        row
      );
    }

    const surgeons: [string, string, string, string, boolean][] = [
      ["SRG-001", "Dr. Sunita Kapoor", "Orthopedic Surgery", "Surgeon", true],
      ["SRG-002", "Dr. Kabir Malhotra", "Trauma & General Surgery", "Surgeon", true],
      ["SRG-003", "Dr. Lin Chen", "Cardiothoracic Surgery", "Surgeon", true],
      ["SRG-004", "Dr. Maya Roy", "Anesthesiology", "Anesthesiologist", true],
      ["SRG-005", "Dr. Devika Nair", "Anesthesiology", "Anesthesiologist", true],
    ];
    for (const row of surgeons) {
      await pool.query(
        `INSERT INTO ot_surgeons (id, name, specialty, role_type, is_available)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO NOTHING`,
        row
      );
    }

    await pool.query(
      `INSERT INTO ot_surgeries (id, patient_id, patient_name, theatre_id, theatre_name, diagnosis, surgery_type, procedure_name, scheduled_date, start_time, end_time, priority, status)
       VALUES (
         'SUR-2026-0001','PAT-2026-0003','Claire Evans','OT-02','OT Suite 2 (Orthopedic)',
         'Right Knee Meniscal Tear','Elective','Arthroscopic Partial Meniscectomy',
         $1,'11:00','12:30','Normal','Confirmed'
       ) ON CONFLICT (id) DO NOTHING`,
      [today]
    );

    await pool.query(
      `INSERT INTO ot_surgeon_assignments (id, surgery_id, surgeon_id, surgeon_name, specialty, assigned_role, assigned_by)
       VALUES
         ('ASN-2026-0001','SUR-2026-0001','SRG-001','Dr. Sunita Kapoor','Orthopedic Surgery','Primary Surgeon','OT Manager'),
         ('ASN-2026-0002','SUR-2026-0001','SRG-004','Dr. Maya Roy','Anesthesiology','Anesthesiologist','OT Manager')
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO ot_preop_checklists (
         id, surgery_id, patient_id, identity_verified, procedure_confirmed, consent_signed,
         allergies_reviewed, allergies_notes, npo_confirmed, preop_labs_ready, anesthesia_clearance,
         site_marked, preparation_notes, status
       ) VALUES (
         'CHK-2026-0001','SUR-2026-0001','PAT-2026-0003',TRUE,TRUE,TRUE,
         TRUE,'Sulfa drugs',TRUE,TRUE,FALSE,
         TRUE,'Awaiting final anesthesia pre-op sign-off before moving to Ready.','Pending'
       ) ON CONFLICT (id) DO NOTHING`
    );

    // 10. Seed Laboratory Management (LIS)
    const labTests: [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      number | null,
      number | null,
      string,
      number,
      number,
    ][] = [
      ["TST-001", "CBC-01", "Complete Blood Count (Hemoglobin)", "Hematology", "Hemoglobin & RBC panel", "Whole Blood (EDTA)", "Hematology", "Numerical", "g/dL", 12.0, 16.5, "12.0 - 16.5 g/dL", 25.0, 45],
      ["TST-002", "HBA1C", "Glycated Hemoglobin (HbA1c)", "Biochemistry", "3-month average blood glucose", "Whole Blood (EDTA)", "Clinical Biochemistry", "Numerical", "%", 4.0, 5.6, "4.0 - 5.6 %", 35.0, 90],
      ["TST-003", "TROP-I", "High-Sensitivity Cardiac Troponin I", "Biochemistry", "Acute myocardial injury marker", "Serum", "Emergency Biochemistry", "Numerical", "ng/L", 0, 19.0, "< 19.0 ng/L", 65.0, 30],
      ["TST-004", "LFT-ALT", "Liver Function (ALT / SGPT)", "Biochemistry", "Hepatocellular enzyme panel", "Serum", "Clinical Biochemistry", "Numerical", "U/L", 7.0, 56.0, "7.0 - 56.0 U/L", 30.0, 60],
      ["TST-005", "CULT-UR", "Urine Culture & Sensitivity", "Microbiology", "Bacterial growth & antibiotic sensitivity", "Urine", "Microbiology", "Qualitative", "", null, null, "No Growth", 45.0, 1440],
    ];
    for (const row of labTests) {
      await pool.query(
        `INSERT INTO lab_tests (
          id, test_code, test_name, category, description, specimen_type, department,
          result_format, unit, ref_min, ref_max, reference_range_label, price, turnaround_minutes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (id) DO NOTHING`,
        row
      );
    }

    await pool.query(
      `INSERT INTO lab_requests (id, patient_id, patient_name, referring_doctor, priority, clinical_notes, test_ids, status)
       VALUES
         ('LAB-2026-0001','PAT-2026-0002','Vikram Rao','Dr. Lin Chen','STAT','Acute chest discomfort — rule out NSTEMI',ARRAY['TST-001','TST-003'],'Processing'),
         ('LAB-2026-0002','PAT-2026-0001','Ananya Sharma','Dr. Rajesh Mehta','Routine','Baseline diabetes & liver panel',ARRAY['TST-002','TST-004'],'Pending')
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO lab_samples (id, request_id, patient_id, specimen_type, collected_by, status, notes, tracking_history)
       VALUES (
         'SMP-2026-0001','LAB-2026-0001','PAT-2026-0002','Whole Blood (EDTA) + Serum','Phlebotomist Priya','Processing',
         'STAT draw from ER Bay 3',
         '[{"stage":"Collected","staff":"Phlebotomist Priya","timestamp":"2026-11-23T09:00:00.000Z","note":"STAT venipuncture completed"},{"stage":"Received","staff":"Lab Tech Arjun","timestamp":"2026-11-23T09:08:00.000Z","note":"Accessioned at Central Lab"},{"stage":"Processing","staff":"Lab Tech Arjun","timestamp":"2026-11-23T09:12:00.000Z","note":"Loaded onto biochemistry analyzer"}]'::jsonb
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO lab_results (id, request_id, sample_id, patient_id, test_id, test_code, test_name, result_format, result_value, unit, reference_range, is_out_of_range, remarks, processed_by, verification_status, verified_by, verified_at)
       VALUES
         ('RES-2026-0001','LAB-2026-0001','SMP-2026-0001','PAT-2026-0002','TST-001','CBC-01','Complete Blood Count (Hemoglobin)','Numerical','13.8','g/dL','12.0 - 16.5 g/dL',FALSE,'Within normal limits','Lab Tech Arjun','Verified','Dr. N. Verma (Pathologist)',NOW()),
         ('RES-2026-0002','LAB-2026-0001','SMP-2026-0001','PAT-2026-0002','TST-003','TROP-I','High-Sensitivity Cardiac Troponin I','Numerical','42.5','ng/L','< 19.0 ng/L',TRUE,'Elevated cardiac troponin — physician alerted','Lab Tech Arjun','Pending',NULL,NULL)
       ON CONFLICT (id) DO NOTHING`
    );

    // 11. Seed Radiology Management (RIS)
    const radEquipment: [string, string, string, string, string][] = [
      ["EQP-XR-01", "Digital X-Ray Suite A", "X-ray", "Radiology Wing - Room 101", "Available"],
      ["EQP-XR-02", "Portable X-Ray Unit B", "X-ray", "Emergency & Trauma Bay", "Available"],
      ["EQP-CT-01", "128-Slice CT Scanner", "CT Scan", "Imaging Center - Room 104", "Available"],
      ["EQP-MR-01", "3.0 Tesla MRI Scanner", "MRI", "Imaging Center - Suite 108", "Available"],
      ["EQP-US-01", "High-Res Doppler Ultrasound 1", "Ultrasound", "Radiology Wing - Room 102", "Available"],
      ["EQP-US-02", "OB/Abdominal Ultrasound 2", "Ultrasound", "Radiology Wing - Room 103", "Available"],
    ];
    for (const row of radEquipment) {
      await pool.query(
        `INSERT INTO radiology_equipment (id, name, modality, room_location, status)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO NOTHING`,
        row
      );
    }

    await pool.query(
      `INSERT INTO radiology_requests (
         id, examination_id, patient_id, patient_name, modality, exam_type, body_region,
         clinical_indication, instructions, mri_screening, priority, referring_doctor,
         assigned_technician, exam_date, exam_time, status
       ) VALUES
         ('RAD-2026-0001','EXM-2026-0001','PAT-2026-0002','Vikram Rao','X-ray','Chest PA & Lateral','Chest / Thorax',
          'Acute chest discomfort and mild dyspnea — evaluate cardiopulmonary silhouette','Remove metallic jewelry before exposure','{}'::jsonb,'STAT','Dr. Lin Chen',
          'Tech Rohan Das',$1,'09:30','Completed'),
         ('RAD-2026-0002','EXM-2026-0002','PAT-2026-0001','Ananya Sharma','CT Scan','CT Brain (Non-Contrast)','Head / Brain',
          'Persistent unilateral headache — rule out intracranial lesion','NPO 4 hours if contrast added; confirm eGFR','{}'::jsonb,'Urgent','Dr. Rajesh Mehta',
          'Tech Meera Nair',$1,'11:00','Scheduled'),
         ('RAD-2026-0003','EXM-2026-0003','PAT-2026-0003','Meera Patel','MRI','MRI Lumbar Spine','Lumbar Spine (L1-S1)',
          'Radiating lower back pain with L5 paresthesia','Remove all ferromagnetic items; ear protection provided',
          '{"pacemaker":false,"metalImplants":false,"claustrophobia":false,"contrastAllergy":false,"renalCleared":true,"screeningNotes":"Patient screened and cleared for 3T MRI."}'::jsonb,
          'Routine','Dr. Sunita Kapoor','Tech Kabir Sen',$1,'14:00','Pending'),
         ('RAD-2026-0004','EXM-2026-0004','PAT-2026-0001','Ananya Sharma','Ultrasound','Abdominal & Pelvic Ultrasound','Abdomen / Pelvis',
          'Right upper quadrant discomfort — assess gallbladder and biliary tree','Fasting 6 hours prior to scan; full bladder required','{}'::jsonb,'Routine','Dr. Rajesh Mehta',
          'Tech Sanya Verma',$1,'15:00','Pending')
       ON CONFLICT (id) DO NOTHING`,
      [today]
    );

    await pool.query(
      `INSERT INTO radiology_appointments (
         id, request_id, examination_id, patient_id, patient_name, modality, exam_type,
         equipment_id, equipment_name, appointment_date, time_slot, status, scheduling_history
       ) VALUES
         ('RAPT-2026-0001','RAD-2026-0001','EXM-2026-0001','PAT-2026-0002','Vikram Rao','X-ray','Chest PA & Lateral',
          'EQP-XR-01','Digital X-Ray Suite A',$1,'09:30','Completed',
          '[{"action":"Scheduled","staff":"Radiology Desk","timestamp":"2026-11-23T08:45:00.000Z","note":"STAT Chest X-ray booked on Digital X-Ray Suite A"}]'::jsonb),
         ('RAPT-2026-0002','RAD-2026-0002','EXM-2026-0002','PAT-2026-0001','Ananya Sharma','CT Scan','CT Brain (Non-Contrast)',
          'EQP-CT-01','128-Slice CT Scanner',$1,'11:00','Scheduled',
          '[{"action":"Scheduled","staff":"Radiology Desk","timestamp":"2026-11-23T09:15:00.000Z","note":"Urgent CT Brain scheduled on 128-Slice CT Scanner"}]'::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [today]
    );

    const sampleXraySvg =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" width="640" height="420"><rect width="640" height="420" fill="#0d1418"/><rect x="24" y="24" width="592" height="372" rx="18" fill="#131e24" stroke="#2c444e" stroke-width="2"/><ellipse cx="250" cy="215" rx="95" ry="125" fill="#1c2f38" stroke="#6ea5b5" stroke-width="2" opacity="0.85"/><ellipse cx="390" cy="215" rx="95" ry="125" fill="#1c2f38" stroke="#6ea5b5" stroke-width="2" opacity="0.85"/><rect x="306" y="78" width="28" height="270" rx="12" fill="#2c4550" opacity="0.9"/><text x="44" y="56" fill="#8fc1ce" font-family="monospace" font-size="14">HEALIX RIS • EXM-2026-0001 • CHEST PA</text><text x="44" y="378" fill="#6ab4a4" font-family="monospace" font-size="12">PAT-2026-0002 | VIKRAM RAO | 110 kVp | 2.4 mAs | DIGITAL X-RAY SUITE A</text></svg>`
      );

    await pool.query(
      `INSERT INTO radiology_images (
         id, request_id, examination_id, patient_id, patient_name, modality, exam_type,
         file_name, mime_type, file_size_bytes, image_data_url, uploaded_by, notes
       ) VALUES (
         'IMG-2026-0001','RAD-2026-0001','EXM-2026-0001','PAT-2026-0002','Vikram Rao','X-ray','Chest PA & Lateral',
         'EXM-2026-0001_chest_pa.svg','image/svg+xml',1024,$1,'Tech Rohan Das',
         'PA upright chest radiograph — clear bilateral lung fields'
       ) ON CONFLICT (id) DO NOTHING`,
      [sampleXraySvg]
    );

    await pool.query(
      `INSERT INTO radiology_reports (
         id, request_id, examination_id, patient_id, patient_name, modality, exam_type, body_region,
         referring_doctor, image_ids, findings, observations, impression, conclusion,
         radiologist_name, status, report_history
       ) VALUES (
         'RADR-2026-0001','RAD-2026-0001','EXM-2026-0001','PAT-2026-0002','Vikram Rao','X-ray','Chest PA & Lateral','Chest / Thorax',
         'Dr. Lin Chen',ARRAY['IMG-2026-0001'],
         'Bilateral lung fields are clear without focal consolidation, pneumothorax, or pleural effusion. Cardiothoracic ratio is within normal limits.',
         'Trachea is midline. Osseous thorax and visualized soft tissues are unremarkable.',
         'No acute cardiopulmonary abnormality identified on chest radiograph.',
         'Correlate clinically with cardiac troponin results and ECG findings.',
         'Dr. Kavita Rao (Radiologist)','Pending Verification',
         '[{"status":"Draft","staff":"Dr. Kavita Rao (Radiologist)","timestamp":"2026-11-23T09:50:00.000Z","note":"Initial draft recorded"},{"status":"Pending Verification","staff":"Dr. Kavita Rao (Radiologist)","timestamp":"2026-11-23T09:55:00.000Z","note":"Submitted for final sign-off"}]'::jsonb
       ) ON CONFLICT (id) DO NOTHING`
    );

    // 12. Seed Pharmacy Management
    await pool.query(
      `INSERT INTO pharmacy_suppliers (id, name, contact_person, phone, email, address, license_number, status, notes)
       VALUES
         ('SUP-2026-0001','MedCore Pharmaceuticals Ltd','Ramesh Kulkarni','+91-98201-44110','orders@medcorepharma.in','Plot 14, Pharma Park, Pune','DL-MH-2024-8812','Active','Primary acute care and antibiotics distributor'),
         ('SUP-2026-0002','Apex BioHealth Supplies','Neha Deshmukh','+91-98201-55220','supply@apexbiohealth.in','Sector 9, Industrial Estate, Hyderabad','DL-TS-2024-4419','Active','Cardiology, metabolic, and injectable supplier')
       ON CONFLICT (id) DO NOTHING`
    );

    const pharmacyMeds: [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      number,
      number,
    ][] = [
      ["MED-2026-0001", "AMOX-500", "Amoxicillin 500mg Capsule", "Amoxicillin Trihydrate", "MoxHeal", "Antibiotic", "500 mg", "Capsule", "MedCore Pharma", 1.25, 40],
      ["MED-2026-0002", "PARA-650", "Paracetamol 650mg Tablet", "Acetaminophen", "DoloCare", "Analgesic", "650 mg", "Tablet", "MedCore Pharma", 0.45, 50],
      ["MED-2026-0003", "METF-500", "Metformin 500mg SR Tablet", "Metformin HCl", "GlucoSafe", "Antidiabetic", "500 mg", "SR Tablet", "Apex BioHealth", 0.85, 30],
      ["MED-2026-0004", "ATOR-20", "Atorvastatin 20mg Tablet", "Atorvastatin Calcium", "LipidGuard", "Cardiology", "20 mg", "Tablet", "Apex BioHealth", 1.60, 25],
      ["MED-2026-0005", "CEFT-1G", "Ceftriaxone 1g Injection", "Ceftriaxone Sodium", "MonoCef", "Injectable Antibiotic", "1 g", "IV Vial", "MedCore Pharma", 6.50, 15],
    ];
    for (const row of pharmacyMeds) {
      await pool.query(
        `INSERT INTO pharmacy_medicines (
          id, medicine_code, medicine_name, generic_name, brand, category,
          strength, dosage_form, manufacturer, unit_price, min_stock_threshold
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO NOTHING`,
        row
      );
    }

    await pool.query(
      `INSERT INTO pharmacy_batches (
         id, batch_number, medicine_id, supplier_id, manufacturer, initial_qty, remaining_qty,
         purchase_date, manufacturing_date, expiry_date, unit_cost, status, expiry_history
       ) VALUES
         ('BCH-2026-0001','AMX-26A','MED-2026-0001','SUP-2026-0001','MedCore Pharma',120,105,'2026-06-01','2026-05-01','2026-12-15',0.80,'Active','[]'::jsonb),
         ('BCH-2026-0002','AMX-26B','MED-2026-0001','SUP-2026-0001','MedCore Pharma',150,150,'2026-09-10','2026-08-15','2027-08-30',0.82,'Active','[]'::jsonb),
         ('BCH-2026-0003','PAR-26A','MED-2026-0002','SUP-2026-0001','MedCore Pharma',200,180,'2026-07-01','2026-06-01','2027-06-30',0.22,'Active','[]'::jsonb),
         ('BCH-2026-0004','MET-26A','MED-2026-0003','SUP-2026-0002','Apex BioHealth',80,18,'2026-05-15','2026-04-20','2027-04-20',0.45,'Active','[]'::jsonb),
         ('BCH-2026-0005','ATR-25Z','MED-2026-0004','SUP-2026-0002','Apex BioHealth',40,12,'2025-05-01','2025-04-01','2026-10-01',0.95,'Expired','[{"action":"Expired","staff":"System Audit","timestamp":"2026-10-02T00:00:00.000Z","note":"Batch passed expiry date — blocked from dispensing"}]'::jsonb),
         ('BCH-2026-0006','ATR-26C','MED-2026-0004','SUP-2026-0002','Apex BioHealth',90,90,'2026-10-01','2026-09-01','2028-09-01',0.98,'Active','[]'::jsonb),
         ('BCH-2026-0007','CEF-26A','MED-2026-0005','SUP-2026-0001','MedCore Pharma',30,10,'2026-08-01','2026-07-10','2026-12-10',4.10,'Active','[]'::jsonb)
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO pharmacy_stock_movements (id, medicine_id, batch_id, movement_type, quantity_delta, balance_after, reason, performed_by)
       VALUES
         ('STK-2026-0001','MED-2026-0001','BCH-2026-0001','Received',120,120,'Initial purchase order receipt (SUP-2026-0001)','Pharmacist Ritu'),
         ('STK-2026-0002','MED-2026-0001','BCH-2026-0001','Dispensed',-15,105,'Dispensed for RX-2026-0001','Pharmacist Ritu')
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO pharmacy_prescriptions (id, patient_id, patient_name, doctor_name, items, status, validated_by, validated_at, processing_history)
       VALUES
         ('RX-2026-0001','PAT-2026-0001','Ananya Sharma','Dr. Rajesh Mehta',
          '[{"medicineId":"MED-2026-0001","medicineCode":"AMOX-500","medicineName":"Amoxicillin 500mg Capsule","dosage":"1 capsule","frequency":"TID (3x daily)","duration":"5 days","instructions":"Take after meals","prescribedQty":15,"dispensedQty":15},{"medicineId":"MED-2026-0002","medicineCode":"PARA-650","medicineName":"Paracetamol 650mg Tablet","dosage":"1 tablet","frequency":"PRN q6h","duration":"5 days","instructions":"For fever or pain","prescribedQty":10,"dispensedQty":0}]'::jsonb,
          'Partially Fulfilled','Pharmacist Ritu',NOW(),
          '[{"status":"Pending","staff":"Dr. Rajesh Mehta","timestamp":"2026-11-23T08:30:00.000Z","note":"Prescription issued from OPD"},{"status":"Processing","staff":"Pharmacist Ritu","timestamp":"2026-11-23T08:45:00.000Z","note":"Prescription validated for dosage and drug interactions"},{"status":"Partially Fulfilled","staff":"Pharmacist Ritu","timestamp":"2026-11-23T08:50:00.000Z","note":"Dispensed 15x Amoxicillin 500mg from FEFO batch AMX-26A"}]'::jsonb),
         ('RX-2026-0002','PAT-2026-0002','Vikram Rao','Dr. Lin Chen',
          '[{"medicineId":"MED-2026-0004","medicineCode":"ATOR-20","medicineName":"Atorvastatin 20mg Tablet","dosage":"1 tablet","frequency":"Once nightly","duration":"30 days","instructions":"Take at bedtime","prescribedQty":30,"dispensedQty":0},{"medicineId":"MED-2026-0003","medicineCode":"METF-500","medicineName":"Metformin 500mg SR Tablet","dosage":"1 tablet","frequency":"BD (2x daily)","duration":"15 days","instructions":"Take with meals","prescribedQty":30,"dispensedQty":0}]'::jsonb,
          'Pending',NULL,NULL,
          '[{"status":"Pending","staff":"Dr. Lin Chen","timestamp":"2026-11-23T09:20:00.000Z","note":"Cardiology discharge prescription"}]'::jsonb)
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO pharmacy_dispensings (
         id, prescription_id, patient_id, patient_name, medicine_id, medicine_name,
         batch_id, batch_number, expiry_date, quantity_dispensed, dosage_instructions, dispensed_by
       ) VALUES (
         'DSP-2026-0001','RX-2026-0001','PAT-2026-0001','Ananya Sharma','MED-2026-0001','Amoxicillin 500mg Capsule',
         'BCH-2026-0001','AMX-26A','2026-12-15',15,'1 capsule TID x 5 days after meals','Pharmacist Ritu'
       ) ON CONFLICT (id) DO NOTHING`
    );

    // 13. Seed Billing & Finance Management
    await pool.query(
      `INSERT INTO billing_insurance_providers (id, name, tpa_code, contact_phone, contact_email, coverage_notes)
       VALUES
         ('INS-2026-0001','StarHealth Shield TPA','TPA-SH-101','+91-1800-102-4477','claims@starhealthshield.in','Cashless IPD, Surgery & Diagnostics up to 80% coverage'),
         ('INS-2026-0002','MediAssist Prime Care','TPA-MA-204','+91-1800-425-9449','preauth@mediassistprime.in','Corporate & Family Floater plans with 24h pre-auth')
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO billing_invoices (
         id, bill_number, patient_id, patient_name, category, source_reference_id, items,
         subtotal, discount_percent, discount_amount, tax_percent, tax_amount, total_amount,
         deposit_applied, paid_amount, refunded_amount, outstanding_balance, status, due_date, notes, created_by
       ) VALUES
         ('INV-2026-0001','BILL-2026-0001','PAT-2026-0001','Ananya Sharma','OPD','APT-2026-0001',
          '[{"description":"OPD Consultation — Dr. Rajesh Mehta","code":"OPD-CONS","quantity":1,"unitPrice":60,"lineTotal":60},{"description":"ECG & Vitals Screening","code":"OPD-ECG","quantity":1,"unitPrice":25,"lineTotal":25}]'::jsonb,
          85.00, 10.00, 8.50, 5.00, 3.83, 80.33, 0.00, 80.33, 0.00, 0.00, 'Paid', $1, 'OPD visit settled at front desk', 'Billing Officer Priya'),
         ('INV-2026-0002','BILL-2026-0002','PAT-2026-0002','Vikram Rao','Laboratory','LAB-2026-0001',
          '[{"description":"Complete Blood Count (Hemoglobin)","code":"CBC-01","quantity":1,"unitPrice":25,"lineTotal":25},{"description":"High-Sensitivity Cardiac Troponin I","code":"TROP-I","quantity":1,"unitPrice":65,"lineTotal":65}]'::jsonb,
          90.00, 0.00, 0.00, 5.00, 4.50, 94.50, 0.00, 50.00, 0.00, 44.50, 'Partially Paid', $1, 'Advance deposit received at lab counter', 'Billing Officer Priya'),
         ('INV-2026-0003','BILL-2026-0003','PAT-2026-0003','Meera Patel','Surgery','SUR-2026-0001',
          '[{"description":"Operation Theatre Suite & Monitoring","code":"OT-SUITE","quantity":1,"unitPrice":450,"lineTotal":450},{"description":"Primary Surgeon Fee — Dr. Sunita Kapoor","code":"SRG-FEE","quantity":1,"unitPrice":1200,"lineTotal":1200},{"description":"Anesthesia Services — Dr. Maya Roy","code":"ANES-FEE","quantity":1,"unitPrice":350,"lineTotal":350},{"description":"Surgical Consumables & Implants","code":"OT-CONS","quantity":1,"unitPrice":250,"lineTotal":250}]'::jsonb,
          2250.00, 0.00, 0.00, 5.00, 112.50, 2362.50, 500.00, 500.00, 0.00, 1862.50, 'Partially Paid', $1, 'Insurance pre-auth submitted for balance', 'Finance Manager Arjun')
       ON CONFLICT (id) DO NOTHING`,
      [today]
    );

    await pool.query(
      `INSERT INTO billing_payments (id, invoice_id, patient_id, patient_name, amount, payment_type, payment_method, reference_number, received_by, notes)
       VALUES
         ('PAY-2026-0001','INV-2026-0001','PAT-2026-0001','Ananya Sharma',80.33,'Full','UPI','UPI-8841209','Billing Officer Priya','Full OPD payment via UPI'),
         ('PAY-2026-0002','INV-2026-0002','PAT-2026-0002','Vikram Rao',50.00,'Partial','Card','CARD-441092','Billing Officer Priya','Partial payment at lab desk'),
         ('PAY-2026-0003','INV-2026-0003','PAT-2026-0003','Meera Patel',500.00,'Advance','Bank Transfer','NEFT-772104','Finance Manager Arjun','Surgery admission deposit')
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO billing_insurance_claims (
         id, invoice_id, patient_id, patient_name, provider_id, provider_name, policy_number,
         coverage_verified, pre_auth_number, claimed_amount, approved_amount, settled_amount, status, submitted_by, history
       ) VALUES (
         'CLM-2026-0001','INV-2026-0003','PAT-2026-0003','Meera Patel','INS-2026-0001','StarHealth Shield TPA','SH-POL-994210',
         TRUE,'PA-2026-8812',1862.50,1500.00,0.00,'Approved','Finance Manager Arjun',
         '[{"status":"Submitted","staff":"Finance Manager Arjun","timestamp":"2026-11-23T09:00:00.000Z","note":"Pre-auth PA-2026-8812 verified and claim submitted"},{"status":"Approved","staff":"StarHealth Shield TPA","timestamp":"2026-11-23T10:15:00.000Z","note":"Approved $1,500.00 toward surgery balance"}]'::jsonb
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO billing_audit_logs (id, entity_type, entity_id, action, actor_role, actor_name, details)
       VALUES
         ('AUD-2026-0001','Invoice','INV-2026-0001','Created','Billing Staff','Billing Officer Priya','Generated OPD invoice BILL-2026-0001 for $80.33'),
         ('AUD-2026-0002','Payment','PAY-2026-0001','Collected','Billing Staff','Billing Officer Priya','Collected $80.33 via UPI for INV-2026-0001'),
         ('AUD-2026-0003','Claim','CLM-2026-0001','Approved','Finance Manager','Finance Manager Arjun','Insurance claim CLM-2026-0001 approved for $1500.00')
       ON CONFLICT (id) DO NOTHING`
    );

    // 14. Seed Blood Bank Management
    await pool.query(
      `INSERT INTO blood_donors (
         id, full_name, date_of_birth, gender, phone, email, blood_group,
         weight_kg, hemoglobin_gdl, medical_history, eligibility_status,
         last_donation_date, total_donations, status
       ) VALUES
         ('DNR-2026-0001','Siddharth Nair','1992-04-14','Male','+91-98110-22101','sid.nair@example.com','O-',72.5,14.8,'No chronic illness; regular voluntary donor','Eligible','2026-11-18',4,'Active'),
         ('DNR-2026-0002','Kavya Menon','1995-09-22','Female','+91-98110-33202','kavya.m@example.com','A+',61.0,13.4,'Cleared screening; no recent travel or surgery','Eligible','2026-11-20',2,'Active'),
         ('DNR-2026-0003','Rohan Kulkarni','1989-12-03','Male','+91-98110-44303','rohan.k@example.com','B+',78.0,15.1,'Healthy voluntary donor','Eligible','2026-11-15',5,'Active'),
         ('DNR-2026-0004','Priyanka Bose','1997-06-11','Female','+91-98110-55404','priyanka.b@example.com','AB+',59.5,13.1,'Plasma donor cleared','Eligible','2026-11-10',3,'Active')
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO blood_units (
         id, donation_id, donor_id, donor_name, source_unit_id, blood_group, component,
         volume_ml, collection_center, storage_location, storage_temp,
         collection_date, expiry_date, screening_status, screening_notes, status
       ) VALUES
         ('UNT-2026-0001','DON-2026-0001','DNR-2026-0001','Siddharth Nair',NULL,'O-','RBC',350,'Main Hospital Blood Center','Cold Room Fridge A1','2°C - 6°C','2026-11-18','2026-12-30','Cleared','HIV/HBV/HCV/Syphilis/Malaria Non-Reactive','Available'),
         ('UNT-2026-0002','DON-2026-0002','DNR-2026-0002','Kavya Menon',NULL,'A+','Whole Blood',450,'Main Hospital Blood Center','Cold Room Fridge A2','2°C - 6°C','2026-11-20','2026-12-25','Cleared','All infectious screening markers Non-Reactive','Available'),
         ('UNT-2026-0003','DON-2026-0003','DNR-2026-0003','Rohan Kulkarni',NULL,'B+','Platelets',250,'Main Hospital Blood Center','Platelet Agitator P1','20°C - 24°C (Agitator)','2026-11-21','2026-11-26','Cleared','Cleared for urgent transfusion','Available'),
         ('UNT-2026-0004','DON-2026-0004','DNR-2026-0004','Priyanka Bose',NULL,'AB+','Plasma',280,'Main Hospital Blood Center','Deep Freezer F1','-18°C or below','2026-11-10','2027-11-10','Cleared','Universal plasma unit cleared','Available'),
         ('UNT-2026-0005','DON-2026-0001','DNR-2026-0001','Siddharth Nair','UNT-2026-0001','O-','Cryoprecipitate',50,'Main Hospital Blood Center','Deep Freezer F2','-18°C or below','2026-11-18','2027-11-18','Cleared','Separated from DON-2026-0001','Available'),
         ('UNT-2026-0006','DON-2026-0003','DNR-2026-0003','Rohan Kulkarni',NULL,'B+','Platelets',250,'Main Hospital Blood Center','Platelet Agitator P2','20°C - 24°C (Agitator)','2026-11-15','2026-11-20','Cleared','Expired platelet unit — blocked from issue','Expired')
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO blood_requests (
         id, patient_id, patient_name, department, requested_blood_group, component,
         units_requested, units_fulfilled, urgency, requesting_doctor, clinical_indication,
         status, approved_by
       ) VALUES
         ('BRQ-2026-0001','PAT-2026-0003','Meera Patel','Surgery','A+','RBC',1,0,'Urgent','Dr. Sunita Kapoor','Pre-operative surgical reserve for orthopedic procedure','Approved','Blood Bank Officer'),
         ('BRQ-2026-0002','PAT-2026-0002','Vikram Rao','Emergency','O-','RBC',1,0,'Emergency','Dr. Lin Chen','Acute GI bleed — emergency crossmatch requested','Pending',NULL)
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO blood_compatibility_tests (
         id, request_id, patient_id, patient_name, patient_blood_group, unit_id, donor_blood_group,
         component, grouping_confirmed, crossmatch_result, antibody_screen, tested_by,
         verification_status, verified_by, verified_at, notes
       ) VALUES (
         'CMP-2026-0001','BRQ-2026-0001','PAT-2026-0003','Meera Patel','A+','UNT-2026-0001','O-',
         'RBC',TRUE,'Compatible','Negative','Lab Tech Arjun',
         'Verified','Dr. N. Verma (Pathologist)',NOW(),'Universal O- RBC crossmatched compatible with A+ recipient'
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO blood_audit_logs (id, entity_type, entity_id, action, actor_role, actor_name, details)
       VALUES
         ('BAUD-2026-0001','Unit','UNT-2026-0001','Cleared','Laboratory Staff','Lab Tech Arjun','Infectious screening cleared; O- RBC unit moved to Available'),
         ('BAUD-2026-0002','Compatibility','CMP-2026-0001','Verified','Laboratory Staff','Dr. N. Verma (Pathologist)','Verified crossmatch Compatible for BRQ-2026-0001 with UNT-2026-0001')
       ON CONFLICT (id) DO NOTHING`
    );

    // 15. Seed Ambulance Management
    await pool.query(
      `INSERT INTO ambulance_vehicles (
         id, registration_number, vehicle_type, model, capacity, equipment_details,
         insurance_expiry, fitness_cert_expiry, registration_valid_until,
         maintenance_status, operational_status, total_trips, total_distance_km
       ) VALUES
         ('AMB-2026-0001','MH-12-EM-1081','ALS','Force Traveller ALS ICU',2,'Ventilator, Defibrillator, Oxygen Cylinder, Cardiac Monitor, Suction Unit','2027-06-30','2027-05-15','2029-12-31','Operational','Available',14,248.50),
         ('AMB-2026-0002','MH-12-EM-1082','BLS','Tata Winger Ambulance',2,'Oxygen Supply, Stretcher, First Aid Trauma Kit, Spine Board','2026-12-10','2027-04-20','2028-11-30','Operational','Available',9,164.00),
         ('AMB-2026-0003','MH-12-EM-1083','ICU Mobile','Mercedes Sprinter Critical Care',2,'ICU Ventilator, Infusion Pumps, Multipara Monitor, AED','2027-09-01','2026-12-05','2030-01-15','Under Maintenance','Under Maintenance',21,412.20)
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO ambulance_drivers (
         id, full_name, phone, email, license_number, license_valid_until,
         experience_years, assigned_vehicle_id, availability_status, employment_status, total_trips
       ) VALUES
         ('DRV-2026-0001','Suresh Pawar','+91-98220-11001','suresh.p@healix.org','DL-MH12-2018-9910','2028-08-31',8,'AMB-2026-0001','Available','Active',14),
         ('DRV-2026-0002','Imran Shaikh','+91-98220-11002','imran.s@healix.org','DL-MH12-2020-4421','2027-10-15',6,'AMB-2026-0002','Available','Active',9),
         ('DRV-2026-0003','Deepak Jadhav','+91-98220-11003','deepak.j@healix.org','DL-MH12-2016-3318','2026-12-08',10,'AMB-2026-0003','Off-Duty','Active',21)
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO ambulance_requests (
         id, patient_id, patient_name, contact_number, source_channel, pickup_location,
         destination_hospital, emergency_type, priority, status
       ) VALUES
         ('ARQ-2026-0001','PAT-2026-0002','Vikram Rao','+91-98765-43211','Emergency Dept','Sector 14 Main Highway, Near Metro Gate 2','Healix Main Hospital','Cardiac Chest Pain','Critical','Completed'),
         ('ARQ-2026-0002','PAT-2026-0001','Ananya Sharma','+91-98765-43210','External Call 108','Green Park Residency, Block B','Healix Main Hospital','Acute Respiratory Distress','High','Requested')
       ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO ambulance_dispatches (
         id, request_id, ambulance_id, registration_number, driver_id, driver_name,
         pickup_location, destination_hospital, estimated_arrival_mins, status,
         assigned_at, dispatched_at, arrived_pickup_at, patient_onboard_at, arrived_hospital_at, completed_at, status_timeline
       ) VALUES (
         'DSP-AMB-2026-0001','ARQ-2026-0001','AMB-2026-0001','MH-12-EM-1081','DRV-2026-0001','Suresh Pawar',
         'Sector 14 Main Highway, Near Metro Gate 2','Healix Main Hospital',12,'Completed',
         NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '88 minutes', NOW() - INTERVAL '76 minutes',
         NOW() - INTERVAL '70 minutes', NOW() - INTERVAL '55 minutes', NOW() - INTERVAL '50 minutes',
         '[{"status":"Assigned","staff":"Ambulance Coordinator","timestamp":"2026-11-23T08:00:00.000Z","note":"Assigned ALS AMB-2026-0001"},{"status":"Dispatched","staff":"Suresh Pawar","timestamp":"2026-11-23T08:02:00.000Z","note":"En route to pickup"},{"status":"Completed","staff":"Suresh Pawar","timestamp":"2026-11-23T08:40:00.000Z","note":"Patient handed over to ER Trauma Bay"}]'::jsonb
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO ambulance_trips (
         id, dispatch_id, request_id, ambulance_id, registration_number, driver_id, driver_name,
         patient_name, pickup_location, dropoff_location, departure_time, arrival_time,
         distance_km, duration_mins, fuel_used_liters, trip_status, remarks
       ) VALUES (
         'TRP-2026-0001','DSP-AMB-2026-0001','ARQ-2026-0001','AMB-2026-0001','MH-12-EM-1081','DRV-2026-0001','Suresh Pawar',
         'Vikram Rao','Sector 14 Main Highway, Near Metro Gate 2','Healix Main Hospital',
         NOW() - INTERVAL '88 minutes', NOW() - INTERVAL '55 minutes', 14.6, 33, 2.4, 'Completed',
         'Patient stabilized on oxygen en route; handed over to ER triage.'
       ) ON CONFLICT (id) DO NOTHING`
    );

    await pool.query(
      `INSERT INTO ambulance_audit_logs (id, entity_type, entity_id, action, actor_role, actor_name, details)
       VALUES
         ('AAUD-2026-0001','Dispatch','DSP-AMB-2026-0001','Completed','Ambulance Coordinator','Dispatch Desk','Completed emergency cardiac transfer TRP-2026-0001 (14.6 km, 33 mins)')
       ON CONFLICT (id) DO NOTHING`
    );

    // 16. Initialize Counters
    const counters: [string, number][] = [
      ["patient", 3],
      ["unknown_patient", 1],
      ["opd_appointment", 4],
      ["opd_token", 2],
      ["opd_consultation", 1],
      ["opd_followup", 1],
      ["emergency_registration", 2],
      ["emergency_triage", 2],
      ["emergency_trauma", 1],
      ["emergency_treatment", 1],
      ["emergency_alert", 2],
      ["emergency_transfer", 1],
      ["ipd_request", 1],
      ["ipd_admission", 1],
      ["ipd_transfer", 0],
      ["ipd_progress_note", 1],
      ["ipd_treatment_plan", 1],
      ["ipd_discharge", 0],
      ["ipd_discharge_summary", 0],
      ["ward", 5],
      ["bed", 13],
      ["bed_allocation", 1],
      ["bed_cleaning", 1],
      ["icu_admission", 1],
      ["icu_monitoring", 1],
      ["icu_vitals", 2],
      ["icu_care_note", 1],
      ["icu_ventilator", 1],
      ["icu_medication", 2],
      ["icu_disposition", 0],
      ["ot_surgery", 1],
      ["ot_assignment", 2],
      ["ot_checklist", 1],
      ["ot_surgical_record", 0],
      ["ot_anesthesia_record", 0],
      ["ot_postop", 0],
      ["lab_test", 5],
      ["lab_request", 2],
      ["lab_sample", 1],
      ["lab_result", 2],
      ["lab_report", 0],
      ["radiology_request", 4],
      ["radiology_exam", 4],
      ["radiology_appointment", 2],
      ["radiology_image", 1],
      ["radiology_report", 1],
      ["pharmacy_supplier", 2],
      ["pharmacy_medicine", 5],
      ["pharmacy_batch", 7],
      ["pharmacy_stock_movement", 2],
      ["pharmacy_prescription", 2],
      ["pharmacy_dispensing", 1],
      ["billing_provider", 2],
      ["billing_invoice", 3],
      ["billing_payment", 3],
      ["billing_claim", 1],
      ["billing_refund", 0],
      ["billing_audit", 3],
      ["blood_donor", 4],
      ["blood_donation", 4],
      ["blood_unit", 6],
      ["blood_request", 2],
      ["blood_compatibility", 1],
      ["blood_transfusion", 0],
      ["blood_audit", 2],
      ["ambulance_vehicle", 3],
      ["ambulance_driver", 3],
      ["ambulance_request", 2],
      ["ambulance_dispatch", 1],
      ["ambulance_trip", 1],
      ["ambulance_audit", 1],
    ];
    for (const [key, val] of counters) {
      await pool.query(
        `INSERT INTO entity_counters (counter_key, current_value)
         VALUES ($1, $2)
         ON CONFLICT (counter_key) DO NOTHING`,
        [key, val]
      );
    }

    console.log("Seed completed successfully against Lakebase Postgres (Neon).");
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
