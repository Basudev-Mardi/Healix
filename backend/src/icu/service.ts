import { getPool, nextCounter } from "../db/client.js";
import { HttpError } from "../opd/service.js";

function pad(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

function mapPatient(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    fullName: r.full_name as string,
    dateOfBirth: r.date_of_birth as string,
    gender: r.gender as string,
    phone: r.phone as string,
    bloodGroup: r.blood_group as string,
    allergies: r.allergies as string,
  };
}

function mapBed(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    department: r.department as string,
    ward: r.ward as string,
    room: r.room as string,
    bedNumber: r.bed_number as string,
    bedType: r.bed_type as string,
    status: r.status as string,
    currentAdmissionId: (r.current_admission_id as string | null) ?? undefined,
  };
}

function mapAdmission(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    admissionDate: new Date(r.admission_date as string).toISOString(),
    reason: r.reason as string,
    diagnosis: r.diagnosis as string,
    referringDoctor: r.referring_doctor as string,
    icuWard: r.icu_ward as string,
    bedId: r.bed_id as string,
    bedLabel: r.bed_label as string,
    careTeam: r.care_team as string,
    status: r.status as string,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapMonitoring(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    icuAdmissionId: r.icu_admission_id as string,
    patientId: r.patient_id as string,
    recordedAt: new Date(r.recorded_at as string).toISOString(),
    responsibleStaff: r.responsible_staff as string,
    patientCondition: r.patient_condition as string,
    monitoringStatus: r.monitoring_status as string,
    neurologicalStatus: r.neurological_status as string,
    fluidBalance: r.fluid_balance as string,
    notes: r.notes as string,
  };
}

function mapThresholds(r: Record<string, unknown>) {
  return {
    systolicMin: Number(r.systolic_min),
    systolicMax: Number(r.systolic_max),
    heartRateMin: Number(r.heart_rate_min),
    heartRateMax: Number(r.heart_rate_max),
    respRateMin: Number(r.resp_rate_min),
    respRateMax: Number(r.resp_rate_max),
    tempMin: Number(r.temp_min),
    tempMax: Number(r.temp_max),
    spo2Min: Number(r.spo2_min),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapVital(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    icuAdmissionId: r.icu_admission_id as string,
    patientId: r.patient_id as string,
    measuredAt: new Date(r.measured_at as string).toISOString(),
    responsibleStaff: r.responsible_staff as string,
    systolicBp: Number(r.systolic_bp),
    diastolicBp: Number(r.diastolic_bp),
    heartRate: Number(r.heart_rate),
    respiratoryRate: Number(r.respiratory_rate),
    temperatureF: Number(r.temperature_f),
    spo2: Number(r.spo2),
    isAbnormal: Boolean(r.is_abnormal),
    abnormalFlags: (r.abnormal_flags as string[]) ?? [],
  };
}

function mapCareNote(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    icuAdmissionId: r.icu_admission_id as string,
    patientId: r.patient_id as string,
    recordedAt: new Date(r.recorded_at as string).toISOString(),
    authorName: r.author_name as string,
    authorRole: r.author_role as string,
    patientCondition: r.patient_condition as string,
    clinicalObservations: r.clinical_observations as string,
    diagnosisUpdate: r.diagnosis_update as string,
    treatmentUpdate: r.treatment_update as string,
  };
}

function mapVentilator(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    icuAdmissionId: r.icu_admission_id as string,
    patientId: r.patient_id as string,
    recordedAt: new Date(r.recorded_at as string).toISOString(),
    responsibleStaff: r.responsible_staff as string,
    ventilatorStatus: r.ventilator_status as string,
    mode: r.mode as string,
    fio2Percent: Number(r.fio2_percent),
    peepCmh2o: Number(r.peep_cmh2o),
    tidalVolumeMl: Number(r.tidal_volume_ml),
    respRateSet: Number(r.resp_rate_set),
    observations: r.observations as string,
  };
}

function mapMedication(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    icuAdmissionId: r.icu_admission_id as string,
    patientId: r.patient_id as string,
    medicationName: r.medication_name as string,
    dosage: r.dosage as string,
    route: r.route as string,
    frequency: r.frequency as string,
    scheduledTime: r.scheduled_time as string,
    actualAdministeredAt: r.actual_administered_at
      ? new Date(r.actual_administered_at as string).toISOString()
      : undefined,
    administeringStaff: (r.administering_staff as string | null) ?? undefined,
    status: r.status as string,
    notes: r.notes as string,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapDisposition(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    icuAdmissionId: r.icu_admission_id as string,
    patientId: r.patient_id as string,
    dispositionType: r.disposition_type as string,
    destination: r.destination as string,
    targetBedId: (r.target_bed_id as string | null) ?? undefined,
    reason: r.reason as string,
    responsibleDoctor: r.responsible_doctor as string,
    handoverDetails: r.handover_details as string,
    dischargeCondition: r.discharge_condition as string,
    dischargeInstructions: r.discharge_instructions as string,
    status: r.status as string,
    approvedBy: (r.approved_by as string | null) ?? undefined,
    requestedAt: new Date(r.requested_at as string).toISOString(),
    completedAt: r.completed_at
      ? new Date(r.completed_at as string).toISOString()
      : undefined,
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

async function getThresholdsInternal() {
  const pool = getPool();
  const res = await pool.query(
    "SELECT * FROM icu_vital_thresholds WHERE id = 'default'"
  );
  if (res.rowCount === 0) {
    const inserted = await pool.query(
      `INSERT INTO icu_vital_thresholds (id) VALUES ('default') RETURNING *`
    );
    return mapThresholds(inserted.rows[0]);
  }
  return mapThresholds(res.rows[0]);
}

export async function getIcuState() {
  const pool = getPool();
  const [
    doctorsRes,
    patientsRes,
    bedsRes,
    admissionsRes,
    monitoringRes,
    vitalsRes,
    notesRes,
    ventsRes,
    medsRes,
    dispsRes,
    thresholds,
  ] = await Promise.all([
    pool.query("SELECT id, name, department FROM opd_doctors ORDER BY id ASC"),
    pool.query("SELECT * FROM patients ORDER BY created_at DESC"),
    pool.query("SELECT * FROM ipd_beds ORDER BY ward ASC, bed_number ASC"),
    pool.query("SELECT * FROM icu_admissions ORDER BY created_at DESC"),
    pool.query("SELECT * FROM icu_monitoring_records ORDER BY recorded_at DESC"),
    pool.query("SELECT * FROM icu_vital_signs ORDER BY measured_at DESC"),
    pool.query("SELECT * FROM icu_care_notes ORDER BY recorded_at DESC"),
    pool.query("SELECT * FROM icu_ventilator_records ORDER BY recorded_at DESC"),
    pool.query("SELECT * FROM icu_medications ORDER BY created_at DESC"),
    pool.query("SELECT * FROM icu_dispositions ORDER BY requested_at DESC"),
    getThresholdsInternal(),
  ]);

  const allBeds = bedsRes.rows.map(mapBed);
  const icuBeds = allBeds.filter(
    (b) => b.bedType === "ICU" || b.ward.toLowerCase().includes("icu")
  );

  return {
    doctors: doctorsRes.rows,
    patients: patientsRes.rows.map(mapPatient),
    icuBeds,
    allBeds,
    admissions: admissionsRes.rows.map(mapAdmission),
    monitoringRecords: monitoringRes.rows.map(mapMonitoring),
    vitalSigns: vitalsRes.rows.map(mapVital),
    vitalThresholds: thresholds,
    careNotes: notesRes.rows.map(mapCareNote),
    ventilatorRecords: ventsRes.rows.map(mapVentilator),
    medications: medsRes.rows.map(mapMedication),
    dispositions: dispsRes.rows.map(mapDisposition),
  };
}

// 1. ICU Admission
export async function createIcuAdmission(input: {
  mode: "existing" | "new";
  existingPatientId?: string;
  newPatient?: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    bloodGroup?: string;
    allergies?: string;
  };
  admissionDate?: string;
  reason: string;
  diagnosis: string;
  referringDoctor: string;
  bedId: string;
  careTeam: string;
}) {
  if (
    !input.reason?.trim() ||
    !input.diagnosis?.trim() ||
    !input.referringDoctor?.trim() ||
    !input.bedId?.trim() ||
    !input.careTeam?.trim()
  ) {
    throw new HttpError(
      "Admission reason, diagnosis, referring doctor, ICU bed, and responsible care team are required."
    );
  }

  const pool = getPool();
  const year = new Date().getFullYear();

  const bedRes = await pool.query("SELECT * FROM ipd_beds WHERE id = $1", [
    input.bedId,
  ]);
  if (bedRes.rowCount === 0) {
    throw new HttpError(`ICU bed ${input.bedId} not found.`, 404);
  }
  const bed = mapBed(bedRes.rows[0]);
  if (bed.bedType !== "ICU" && !bed.ward.toLowerCase().includes("icu")) {
    throw new HttpError(`Bed ${bed.bedNumber} is not a designated ICU bed.`);
  }
  if (bed.status !== "Available") {
    throw new HttpError(
      `ICU bed ${bed.bedNumber} is currently ${bed.status} and cannot be allocated.`,
      409
    );
  }

  let patient;
  if (input.mode === "existing") {
    const patRes = await pool.query("SELECT * FROM patients WHERE id = $1", [
      input.existingPatientId,
    ]);
    if (patRes.rowCount === 0) {
      throw new HttpError(`Patient ${input.existingPatientId ?? ""} not found.`, 404);
    }
    patient = mapPatient(patRes.rows[0]);
  } else {
    const np = input.newPatient;
    if (!np?.fullName?.trim() || !np.dateOfBirth?.trim() || !np.phone?.trim()) {
      throw new HttpError(
        "Full name, date of birth, and phone are required for new ICU patient."
      );
    }
    const seq = await nextCounter("patient");
    const patId = `PAT-${year}-${pad(seq)}`;
    const patRes = await pool.query(
      `INSERT INTO patients (id, full_name, date_of_birth, gender, phone, blood_group, allergies)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        patId,
        np.fullName.trim(),
        np.dateOfBirth.trim(),
        np.gender || "Other",
        np.phone.trim(),
        np.bloodGroup?.trim() || "Unknown",
        np.allergies?.trim() || "None",
      ]
    );
    patient = mapPatient(patRes.rows[0]);
  }

  const dupActive = await pool.query(
    `SELECT id FROM icu_admissions WHERE patient_id = $1 AND status NOT IN ('Transferred','Discharged')`,
    [patient.id]
  );
  if ((dupActive.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Patient ${patient.fullName} already has an active ICU admission (${dupActive.rows[0].id}).`,
      409
    );
  }

  const seq = await nextCounter("icu_admission");
  const id = `ICU-${year}-${pad(seq)}`;
  const bedLabel = `${bed.ward} / ${bed.room} / ${bed.bedNumber}`;

  const admRes = await pool.query(
    `INSERT INTO icu_admissions (
      id, patient_id, patient_name, admission_date, reason, diagnosis,
      referring_doctor, icu_ward, bed_id, bed_label, care_team, status
    ) VALUES ($1,$2,$3,COALESCE($4::timestamptz, NOW()),$5,$6,$7,$8,$9,$10,$11,'Active')
    RETURNING *`,
    [
      id,
      patient.id,
      patient.fullName,
      input.admissionDate || null,
      input.reason.trim(),
      input.diagnosis.trim(),
      input.referringDoctor.trim(),
      bed.ward,
      bed.id,
      bedLabel,
      input.careTeam.trim(),
    ]
  );

  await pool.query(
    `UPDATE ipd_beds SET status = 'Occupied', current_admission_id = $2 WHERE id = $1`,
    [bed.id, id]
  );

  return { admission: mapAdmission(admRes.rows[0]), patient };
}

// 2. Patient Monitoring
export async function createMonitoringRecord(input: {
  icuAdmissionId: string;
  responsibleStaff: string;
  patientCondition: string;
  monitoringStatus: string;
  neurologicalStatus?: string;
  fluidBalance?: string;
  notes?: string;
}) {
  if (!input.icuAdmissionId || !input.responsibleStaff?.trim()) {
    throw new HttpError("ICU admission and responsible staff are required.");
  }

  const pool = getPool();
  const admRes = await pool.query(
    "SELECT id, patient_id, status FROM icu_admissions WHERE id = $1",
    [input.icuAdmissionId]
  );
  if (admRes.rowCount === 0) {
    throw new HttpError(`ICU admission ${input.icuAdmissionId} not found.`, 404);
  }
  const adm = admRes.rows[0];
  if (adm.status === "Discharged" || adm.status === "Transferred") {
    throw new HttpError("Cannot record monitoring for a closed ICU admission.");
  }

  const seq = await nextCounter("icu_monitoring");
  const id = `MON-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO icu_monitoring_records (
      id, icu_admission_id, patient_id, responsible_staff,
      patient_condition, monitoring_status, neurological_status, fluid_balance, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      id,
      adm.id,
      adm.patient_id,
      input.responsibleStaff.trim(),
      input.patientCondition || "Critical",
      input.monitoringStatus || "Continuous Telemetry",
      input.neurologicalStatus?.trim() || "Monitored",
      input.fluidBalance?.trim() || "Balanced",
      input.notes?.trim() ?? "",
    ]
  );
  return mapMonitoring(res.rows[0]);
}

// 3. Vital Signs & Configurable Clinical Thresholds
export async function updateVitalThresholds(input: {
  systolicMin: number;
  systolicMax: number;
  heartRateMin: number;
  heartRateMax: number;
  respRateMin: number;
  respRateMax: number;
  tempMin: number;
  tempMax: number;
  spo2Min: number;
}) {
  const pool = getPool();
  const res = await pool.query(
    `INSERT INTO icu_vital_thresholds (
      id, systolic_min, systolic_max, heart_rate_min, heart_rate_max,
      resp_rate_min, resp_rate_max, temp_min, temp_max, spo2_min, updated_at
    ) VALUES ('default',$1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
    ON CONFLICT (id) DO UPDATE SET
      systolic_min = EXCLUDED.systolic_min,
      systolic_max = EXCLUDED.systolic_max,
      heart_rate_min = EXCLUDED.heart_rate_min,
      heart_rate_max = EXCLUDED.heart_rate_max,
      resp_rate_min = EXCLUDED.resp_rate_min,
      resp_rate_max = EXCLUDED.resp_rate_max,
      temp_min = EXCLUDED.temp_min,
      temp_max = EXCLUDED.temp_max,
      spo2_min = EXCLUDED.spo2_min,
      updated_at = NOW()
    RETURNING *`,
    [
      Number(input.systolicMin),
      Number(input.systolicMax),
      Number(input.heartRateMin),
      Number(input.heartRateMax),
      Number(input.respRateMin),
      Number(input.respRateMax),
      Number(input.tempMin),
      Number(input.tempMax),
      Number(input.spo2Min),
    ]
  );
  return mapThresholds(res.rows[0]);
}

export async function recordVitalSigns(input: {
  icuAdmissionId: string;
  responsibleStaff: string;
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  respiratoryRate: number;
  temperatureF: number;
  spo2: number;
}) {
  if (!input.icuAdmissionId || !input.responsibleStaff?.trim()) {
    throw new HttpError("ICU admission and responsible staff are required.");
  }

  const pool = getPool();
  const admRes = await pool.query(
    "SELECT id, patient_id FROM icu_admissions WHERE id = $1",
    [input.icuAdmissionId]
  );
  if (admRes.rowCount === 0) {
    throw new HttpError(`ICU admission ${input.icuAdmissionId} not found.`, 404);
  }
  const adm = admRes.rows[0];
  const th = await getThresholdsInternal();

  const sys = Number(input.systolicBp);
  const dia = Number(input.diastolicBp);
  const hr = Number(input.heartRate);
  const rr = Number(input.respiratoryRate);
  const temp = Number(input.temperatureF);
  const spo2 = Number(input.spo2);

  const flags: string[] = [];
  if (sys < th.systolicMin) flags.push(`Low Systolic BP (< ${th.systolicMin})`);
  if (sys > th.systolicMax) flags.push(`High Systolic BP (> ${th.systolicMax})`);
  if (hr < th.heartRateMin) flags.push(`Bradycardia (< ${th.heartRateMin})`);
  if (hr > th.heartRateMax) flags.push(`Tachycardia (> ${th.heartRateMax})`);
  if (rr < th.respRateMin) flags.push(`Low Resp Rate (< ${th.respRateMin})`);
  if (rr > th.respRateMax) flags.push(`High Resp Rate (> ${th.respRateMax})`);
  if (temp < th.tempMin) flags.push(`Hypothermia (< ${th.tempMin}°F)`);
  if (temp > th.tempMax) flags.push(`Fever (> ${th.tempMax}°F)`);
  if (spo2 < th.spo2Min) flags.push(`Low SpO2 (< ${th.spo2Min}%)`);

  const seq = await nextCounter("icu_vitals");
  const id = `VIT-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO icu_vital_signs (
      id, icu_admission_id, patient_id, responsible_staff,
      systolic_bp, diastolic_bp, heart_rate, respiratory_rate,
      temperature_f, spo2, is_abnormal, abnormal_flags
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      id,
      adm.id,
      adm.patient_id,
      input.responsibleStaff.trim(),
      sys,
      dia,
      hr,
      rr,
      temp,
      spo2,
      flags.length > 0,
      flags,
    ]
  );

  return mapVital(res.rows[0]);
}

// 4. Critical Care Notes (Immutable append-only log)
export async function createCareNote(input: {
  icuAdmissionId: string;
  authorName: string;
  authorRole: string;
  patientCondition: string;
  clinicalObservations: string;
  diagnosisUpdate?: string;
  treatmentUpdate?: string;
}) {
  if (
    !input.icuAdmissionId ||
    !input.authorName?.trim() ||
    !input.clinicalObservations?.trim()
  ) {
    throw new HttpError(
      "ICU admission, author name, and clinical observations are required."
    );
  }

  const pool = getPool();
  const admRes = await pool.query(
    "SELECT id, patient_id FROM icu_admissions WHERE id = $1",
    [input.icuAdmissionId]
  );
  if (admRes.rowCount === 0) {
    throw new HttpError(`ICU admission ${input.icuAdmissionId} not found.`, 404);
  }
  const adm = admRes.rows[0];
  const seq = await nextCounter("icu_care_note");
  const id = `CCN-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO icu_care_notes (
      id, icu_admission_id, patient_id, author_name, author_role,
      patient_condition, clinical_observations, diagnosis_update, treatment_update
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      id,
      adm.id,
      adm.patient_id,
      input.authorName.trim(),
      input.authorRole || "Doctor",
      input.patientCondition || "Critical",
      input.clinicalObservations.trim(),
      input.diagnosisUpdate?.trim() ?? "",
      input.treatmentUpdate?.trim() ?? "",
    ]
  );
  return mapCareNote(res.rows[0]);
}

// 5. Ventilator Records
export async function createVentilatorRecord(input: {
  icuAdmissionId: string;
  responsibleStaff: string;
  ventilatorStatus: string;
  mode: string;
  fio2Percent: number;
  peepCmh2o: number;
  tidalVolumeMl: number;
  respRateSet: number;
  observations?: string;
}) {
  if (
    !input.icuAdmissionId ||
    !input.responsibleStaff?.trim() ||
    !input.ventilatorStatus ||
    !input.mode
  ) {
    throw new HttpError(
      "ICU admission, responsible staff, ventilator status, and mode are required."
    );
  }

  const pool = getPool();
  const admRes = await pool.query(
    "SELECT id, patient_id FROM icu_admissions WHERE id = $1",
    [input.icuAdmissionId]
  );
  if (admRes.rowCount === 0) {
    throw new HttpError(`ICU admission ${input.icuAdmissionId} not found.`, 404);
  }
  const adm = admRes.rows[0];
  const seq = await nextCounter("icu_ventilator");
  const id = `VNT-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO icu_ventilator_records (
      id, icu_admission_id, patient_id, responsible_staff, ventilator_status,
      mode, fio2_percent, peep_cmh2o, tidal_volume_ml, resp_rate_set, observations
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      id,
      adm.id,
      adm.patient_id,
      input.responsibleStaff.trim(),
      input.ventilatorStatus,
      input.mode,
      Number(input.fio2Percent),
      Number(input.peepCmh2o),
      Number(input.tidalVolumeMl),
      Number(input.respRateSet),
      input.observations?.trim() ?? "",
    ]
  );
  return mapVentilator(res.rows[0]);
}

// 6. Medication Administration (Prescribe + Administer/Missed/Withheld with Duplicate Prevention)
export async function prescribeMedication(input: {
  icuAdmissionId: string;
  medicationName: string;
  dosage: string;
  route: string;
  frequency: string;
  scheduledTime: string;
  notes?: string;
}) {
  if (
    !input.icuAdmissionId ||
    !input.medicationName?.trim() ||
    !input.dosage?.trim() ||
    !input.route?.trim() ||
    !input.frequency?.trim() ||
    !input.scheduledTime?.trim()
  ) {
    throw new HttpError(
      "ICU admission, medication name, dosage, route, frequency, and scheduled time are required."
    );
  }

  const pool = getPool();
  const admRes = await pool.query(
    "SELECT id, patient_id FROM icu_admissions WHERE id = $1",
    [input.icuAdmissionId]
  );
  if (admRes.rowCount === 0) {
    throw new HttpError(`ICU admission ${input.icuAdmissionId} not found.`, 404);
  }
  const adm = admRes.rows[0];

  // Prevent duplicate scheduled dose
  const dup = await pool.query(
    `SELECT id FROM icu_medications
     WHERE icu_admission_id = $1 AND LOWER(medication_name) = LOWER($2) AND scheduled_time = $3`,
    [adm.id, input.medicationName.trim(), input.scheduledTime.trim()]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Duplicate medication schedule: ${input.medicationName.trim()} at ${input.scheduledTime.trim()} already exists (${dup.rows[0].id}).`,
      409
    );
  }

  const seq = await nextCounter("icu_medication");
  const id = `MAR-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO icu_medications (
      id, icu_admission_id, patient_id, medication_name, dosage,
      route, frequency, scheduled_time, status, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Pending',$9) RETURNING *`,
    [
      id,
      adm.id,
      adm.patient_id,
      input.medicationName.trim(),
      input.dosage.trim(),
      input.route.trim(),
      input.frequency.trim(),
      input.scheduledTime.trim(),
      input.notes?.trim() ?? "",
    ]
  );
  return mapMedication(res.rows[0]);
}

export async function updateMedicationAdministration(input: {
  medicationId: string;
  status: "Administered" | "Missed" | "Withheld";
  administeringStaff: string;
  notes?: string;
}) {
  const pool = getPool();
  const medRes = await pool.query("SELECT * FROM icu_medications WHERE id = $1", [
    input.medicationId,
  ]);
  if (medRes.rowCount === 0) {
    throw new HttpError(`Medication record ${input.medicationId} not found.`, 404);
  }
  const current = mapMedication(medRes.rows[0]);
  if (current.status === "Administered") {
    throw new HttpError(
      `Dose ${current.id} (${current.medicationName}) has already been administered at ${current.actualAdministeredAt}. Duplicate administration blocked.`,
      409
    );
  }

  const updated = await pool.query(
    `UPDATE icu_medications
     SET status = $2,
         administering_staff = $3,
         actual_administered_at = CASE WHEN $2 = 'Administered' THEN NOW() ELSE actual_administered_at END,
         notes = COALESCE(NULLIF($4, ''), notes),
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      input.medicationId,
      input.status,
      input.administeringStaff?.trim() || "ICU Nurse",
      input.notes?.trim() ?? "",
    ]
  );
  return mapMedication(updated.rows[0]);
}

// 7. ICU Transfer and Discharge
export async function createIcuDisposition(input: {
  icuAdmissionId: string;
  dispositionType: "Transfer" | "Discharge";
  destination: string;
  targetBedId?: string;
  reason: string;
  responsibleDoctor: string;
  handoverDetails?: string;
  dischargeCondition?: string;
  dischargeInstructions?: string;
}) {
  if (
    !input.icuAdmissionId ||
    !input.dispositionType ||
    !input.destination?.trim() ||
    !input.reason?.trim() ||
    !input.responsibleDoctor?.trim()
  ) {
    throw new HttpError(
      "ICU admission, disposition type, destination, reason, and responsible doctor are required."
    );
  }

  const pool = getPool();
  const admRes = await pool.query(
    "SELECT id, patient_id, status FROM icu_admissions WHERE id = $1",
    [input.icuAdmissionId]
  );
  if (admRes.rowCount === 0) {
    throw new HttpError(`ICU admission ${input.icuAdmissionId} not found.`, 404);
  }
  const adm = admRes.rows[0];
  if (adm.status === "Transferred" || adm.status === "Discharged") {
    throw new HttpError("This ICU admission is already closed.");
  }

  if (input.targetBedId) {
    const bedRes = await pool.query(
      "SELECT status, bed_number FROM ipd_beds WHERE id = $1",
      [input.targetBedId]
    );
    if (bedRes.rowCount === 0) {
      throw new HttpError(`Target bed ${input.targetBedId} not found.`, 404);
    }
    if (bedRes.rows[0].status !== "Available") {
      throw new HttpError(
        `Target bed ${bedRes.rows[0].bed_number} is currently ${bedRes.rows[0].status}.`,
        409
      );
    }
  }

  const seq = await nextCounter("icu_disposition");
  const id = `DSP-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO icu_dispositions (
      id, icu_admission_id, patient_id, disposition_type, destination,
      target_bed_id, reason, responsible_doctor, handover_details,
      discharge_condition, discharge_instructions, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Requested') RETURNING *`,
    [
      id,
      adm.id,
      adm.patient_id,
      input.dispositionType,
      input.destination.trim(),
      input.targetBedId || null,
      input.reason.trim(),
      input.responsibleDoctor.trim(),
      input.handoverDetails?.trim() ?? "",
      input.dischargeCondition?.trim() ?? "",
      input.dischargeInstructions?.trim() ?? "",
    ]
  );

  await pool.query(
    `UPDATE icu_admissions SET status = $2, updated_at = NOW() WHERE id = $1`,
    [
      adm.id,
      input.dispositionType === "Transfer"
        ? "Transfer Requested"
        : "Discharge Requested",
    ]
  );

  return mapDisposition(res.rows[0]);
}

export async function updateIcuDisposition(input: {
  dispositionId: string;
  status: "Approved" | "Completed" | "Cancelled";
  approvedBy: string;
}) {
  const pool = getPool();
  const dispRes = await pool.query(
    "SELECT * FROM icu_dispositions WHERE id = $1",
    [input.dispositionId]
  );
  if (dispRes.rowCount === 0) {
    throw new HttpError(`Disposition ${input.dispositionId} not found.`, 404);
  }
  const current = mapDisposition(dispRes.rows[0]);
  if (current.status === "Completed") {
    throw new HttpError("Disposition is already completed.");
  }

  const updated = await pool.query(
    `UPDATE icu_dispositions
     SET status = $2,
         approved_by = COALESCE(NULLIF($3, ''), approved_by),
         completed_at = CASE WHEN $2 = 'Completed' THEN NOW() ELSE completed_at END,
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [current.id, input.status, input.approvedBy || "ICU Doctor"]
  );

  if (input.status === "Completed") {
    const admRes = await pool.query(
      `UPDATE icu_admissions SET status = $2, updated_at = NOW()
       WHERE id = $1 RETURNING bed_id`,
      [
        current.icuAdmissionId,
        current.dispositionType === "Transfer" ? "Transferred" : "Discharged",
      ]
    );

    // Release ICU bed back to Available
    if (admRes.rows[0]?.bed_id) {
      await pool.query(
        `UPDATE ipd_beds SET status = 'Available', current_admission_id = NULL WHERE id = $1`,
        [admRes.rows[0].bed_id]
      );
    }

    // If transferred to a specific target bed, occupy it
    if (current.dispositionType === "Transfer" && current.targetBedId) {
      await pool.query(
        `UPDATE ipd_beds SET status = 'Occupied', current_admission_id = $2 WHERE id = $1`,
        [current.targetBedId, current.icuAdmissionId]
      );
    }
  } else if (input.status === "Cancelled") {
    await pool.query(
      `UPDATE icu_admissions SET status = 'Active', updated_at = NOW() WHERE id = $1`,
      [current.icuAdmissionId]
    );
  }

  return mapDisposition(updated.rows[0]);
}
