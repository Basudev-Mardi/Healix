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

    // 10. Initialize Counters
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
