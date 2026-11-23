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

function mapRequest(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    department: r.department as string,
    requestedBedType: r.requested_bed_type as string,
    reason: r.reason as string,
    priority: r.priority as string,
    requestedBy: r.requested_by as string,
    status: r.status as string,
    reviewedBy: (r.reviewed_by as string | null) ?? undefined,
    reviewNotes: (r.review_notes as string | null) ?? undefined,
    convertedAdmissionId:
      (r.converted_admission_id as string | null) ?? undefined,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapAdmission(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    admissionRequestId:
      (r.admission_request_id as string | null) ?? undefined,
    admissionDate: new Date(r.admission_date as string).toISOString(),
    admittingDoctor: r.admitting_doctor as string,
    department: r.department as string,
    ward: r.ward as string,
    room: r.room as string,
    bedId: r.bed_id as string,
    bedLabel: r.bed_label as string,
    reason: r.reason as string,
    diagnosis: r.diagnosis as string,
    status: r.status as string,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapTransfer(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    admissionId: r.admission_id as string,
    patientId: r.patient_id as string,
    fromDepartment: r.from_department as string,
    fromWard: r.from_ward as string,
    fromRoom: r.from_room as string,
    fromBedId: r.from_bed_id as string,
    toDepartment: r.to_department as string,
    toWard: r.to_ward as string,
    toRoom: r.to_room as string,
    toBedId: r.to_bed_id as string,
    reason: r.reason as string,
    requestingDoctor: r.requesting_doctor as string,
    responsibleStaff: r.responsible_staff as string,
    status: r.status as string,
    transferredAt: new Date(r.transferred_at as string).toISOString(),
  };
}

function mapProgressNote(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    admissionId: r.admission_id as string,
    patientId: r.patient_id as string,
    noteDate: new Date(r.note_date as string).toISOString(),
    recordedBy: r.recorded_by as string,
    recordedRole: r.recorded_role as string,
    vitals: r.vitals as Record<string, string>,
    symptoms: r.symptoms as string,
    observations: r.observations as string,
    patientCondition: r.patient_condition as string,
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

function mapTreatmentPlan(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    admissionId: r.admission_id as string,
    patientId: r.patient_id as string,
    doctorName: r.doctor_name as string,
    diagnosis: r.diagnosis as string,
    treatmentInstructions: r.treatment_instructions as string,
    medications: r.medications as string,
    procedures: r.procedures as string,
    careRequirements: r.care_requirements as string,
    assignedStaff: r.assigned_staff as string,
    status: r.status as string,
    version: Number(r.version),
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapDischarge(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    admissionId: r.admission_id as string,
    patientId: r.patient_id as string,
    dischargeDate: r.discharge_date as string,
    reason: r.reason as string,
    clinicalClearance: Boolean(r.clinical_clearance),
    billingClearance: Boolean(r.billing_clearance),
    pharmacyClearance: Boolean(r.pharmacy_clearance),
    doctorApproval: Boolean(r.doctor_approval),
    approvedBy: (r.approved_by as string | null) ?? undefined,
    status: r.status as string,
    dischargeSummaryId:
      (r.discharge_summary_id as string | null) ?? undefined,
    createdAt: new Date(r.created_at as string).toISOString(),
    completedAt: r.completed_at
      ? new Date(r.completed_at as string).toISOString()
      : undefined,
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapSummary(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    admissionId: r.admission_id as string,
    dischargeId: (r.discharge_id as string | null) ?? undefined,
    patientId: r.patient_id as string,
    admissionDate: r.admission_date as string,
    dischargeDate: r.discharge_date as string,
    finalDiagnosis: r.final_diagnosis as string,
    treatmentReceived: r.treatment_received as string,
    proceduresPerformed: r.procedures_performed as string,
    clinicalProgress: r.clinical_progress as string,
    dischargeMedications: r.discharge_medications as string,
    followUpInstructions: r.follow_up_instructions as string,
    recommendations: r.recommendations as string,
    responsibleDoctor: r.responsible_doctor as string,
    authorizedBy: r.authorized_by as string,
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

export async function getIpdState() {
  const pool = getPool();
  const [
    doctorsRes,
    patientsRes,
    bedsRes,
    requestsRes,
    admissionsRes,
    transfersRes,
    notesRes,
    plansRes,
    dischargesRes,
    summariesRes,
  ] = await Promise.all([
    pool.query("SELECT id, name, department, specialization FROM opd_doctors ORDER BY id ASC"),
    pool.query("SELECT * FROM patients ORDER BY created_at DESC"),
    pool.query("SELECT * FROM ipd_beds ORDER BY ward ASC, room ASC, bed_number ASC"),
    pool.query("SELECT * FROM ipd_admission_requests ORDER BY created_at DESC"),
    pool.query("SELECT * FROM ipd_admissions ORDER BY created_at DESC"),
    pool.query("SELECT * FROM ipd_transfers ORDER BY transferred_at DESC"),
    pool.query("SELECT * FROM ipd_progress_notes ORDER BY note_date DESC"),
    pool.query("SELECT * FROM ipd_treatment_plans ORDER BY updated_at DESC"),
    pool.query("SELECT * FROM ipd_discharges ORDER BY created_at DESC"),
    pool.query("SELECT * FROM ipd_discharge_summaries ORDER BY created_at DESC"),
  ]);

  return {
    doctors: doctorsRes.rows,
    patients: patientsRes.rows.map(mapPatient),
    beds: bedsRes.rows.map(mapBed),
    requests: requestsRes.rows.map(mapRequest),
    admissions: admissionsRes.rows.map(mapAdmission),
    transfers: transfersRes.rows.map(mapTransfer),
    progressNotes: notesRes.rows.map(mapProgressNote),
    treatmentPlans: plansRes.rows.map(mapTreatmentPlan),
    discharges: dischargesRes.rows.map(mapDischarge),
    dischargeSummaries: summariesRes.rows.map(mapSummary),
  };
}

// 1. Patient Admission (Existing or New Patient + Strict Bed Availability Validation)
export async function createAdmission(input: {
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
  admissionRequestId?: string;
  admissionDate?: string;
  admittingDoctor: string;
  bedId: string;
  reason: string;
  diagnosis: string;
}) {
  if (
    !input.admittingDoctor?.trim() ||
    !input.bedId?.trim() ||
    !input.reason?.trim() ||
    !input.diagnosis?.trim()
  ) {
    throw new HttpError(
      "Admitting doctor, bed assignment, admission reason, and diagnosis are required."
    );
  }

  const pool = getPool();
  const year = new Date().getFullYear();

  // Check bed availability
  const bedRes = await pool.query("SELECT * FROM ipd_beds WHERE id = $1", [
    input.bedId,
  ]);
  if (bedRes.rowCount === 0) {
    throw new HttpError(`Bed ${input.bedId} not found.`, 404);
  }
  const bed = mapBed(bedRes.rows[0]);
  if (bed.status !== "Available") {
    throw new HttpError(
      `Bed ${bed.bedNumber} (${bed.ward} / ${bed.room}) is currently ${bed.status} and cannot be assigned.`,
      409
    );
  }

  let patient;
  if (input.mode === "existing") {
    const patRes = await pool.query("SELECT * FROM patients WHERE id = $1", [
      input.existingPatientId,
    ]);
    if (patRes.rowCount === 0) {
      throw new HttpError(
        `Patient ${input.existingPatientId ?? ""} not found.`,
        404
      );
    }
    patient = mapPatient(patRes.rows[0]);
  } else {
    const np = input.newPatient;
    if (!np?.fullName?.trim() || !np.dateOfBirth?.trim() || !np.phone?.trim()) {
      throw new HttpError(
        "Full name, date of birth, and phone are required for new inpatient registration."
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

  // Prevent double active admission for same patient
  const activeAdmRes = await pool.query(
    `SELECT id FROM ipd_admissions WHERE patient_id = $1 AND status <> 'Discharged'`,
    [patient.id]
  );
  if ((activeAdmRes.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Patient ${patient.fullName} (${patient.id}) already has an active admission (${activeAdmRes.rows[0].id}).`,
      409
    );
  }

  const admSeq = await nextCounter("ipd_admission");
  const admId = `ADM-${year}-${pad(admSeq)}`;
  const bedLabel = `${bed.ward} / ${bed.room} / ${bed.bedNumber}`;

  const admRes = await pool.query(
    `INSERT INTO ipd_admissions (
      id, patient_id, patient_name, admission_request_id, admission_date,
      admitting_doctor, department, ward, room, bed_id, bed_label,
      reason, diagnosis, status
    ) VALUES ($1,$2,$3,$4,COALESCE($5::timestamptz, NOW()),$6,$7,$8,$9,$10,$11,$12,$13,'Admitted')
    RETURNING *`,
    [
      admId,
      patient.id,
      patient.fullName,
      input.admissionRequestId ?? null,
      input.admissionDate || null,
      input.admittingDoctor.trim(),
      bed.department,
      bed.ward,
      bed.room,
      bed.id,
      bedLabel,
      input.reason.trim(),
      input.diagnosis.trim(),
    ]
  );

  // Occupy the bed
  await pool.query(
    `UPDATE ipd_beds SET status = 'Occupied', current_admission_id = $2 WHERE id = $1`,
    [bed.id, admId]
  );

  // If converted from an admission request, mark it Converted
  if (input.admissionRequestId) {
    await pool.query(
      `UPDATE ipd_admission_requests
       SET status = 'Converted', converted_admission_id = $2, updated_at = NOW()
       WHERE id = $1`,
      [input.admissionRequestId, admId]
    );
  }

  return { admission: mapAdmission(admRes.rows[0]), patient };
}

// 2. Admission Requests
export async function createAdmissionRequest(input: {
  patientId: string;
  department: string;
  requestedBedType: string;
  reason: string;
  priority?: string;
  requestedBy: string;
}) {
  if (
    !input.patientId ||
    !input.department ||
    !input.requestedBedType ||
    !input.reason?.trim()
  ) {
    throw new HttpError(
      "Patient, department, requested bed type, and admission reason are required."
    );
  }

  const pool = getPool();
  const patRes = await pool.query(
    "SELECT id, full_name FROM patients WHERE id = $1",
    [input.patientId]
  );
  if (patRes.rowCount === 0) {
    throw new HttpError(`Patient ${input.patientId} not found.`, 404);
  }

  const seq = await nextCounter("ipd_request");
  const id = `ARQ-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO ipd_admission_requests (
      id, patient_id, patient_name, department, requested_bed_type,
      reason, priority, requested_by, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Pending') RETURNING *`,
    [
      id,
      patRes.rows[0].id,
      patRes.rows[0].full_name,
      input.department,
      input.requestedBedType,
      input.reason.trim(),
      input.priority || "Normal",
      input.requestedBy || "Staff",
    ]
  );
  return mapRequest(res.rows[0]);
}

export async function reviewAdmissionRequest(input: {
  requestId: string;
  status: "Approved" | "Rejected" | "Cancelled";
  reviewedBy: string;
  reviewNotes?: string;
}) {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE ipd_admission_requests
     SET status = $2, reviewed_by = $3, review_notes = $4, updated_at = NOW()
     WHERE id = $1 AND status = 'Pending' RETURNING *`,
    [
      input.requestId,
      input.status,
      input.reviewedBy || "Ward Manager",
      input.reviewNotes?.trim() || "",
    ]
  );
  if (res.rowCount === 0) {
    throw new HttpError(
      `Pending admission request ${input.requestId} not found.`,
      404
    );
  }
  return mapRequest(res.rows[0]);
}

// 4. Patient Transfers (Validates destination bed, releases old bed, updates admission)
export async function createIpdTransfer(input: {
  admissionId: string;
  toBedId: string;
  reason: string;
  requestingDoctor: string;
  responsibleStaff: string;
}) {
  if (
    !input.admissionId ||
    !input.toBedId ||
    !input.reason?.trim() ||
    !input.requestingDoctor?.trim() ||
    !input.responsibleStaff?.trim()
  ) {
    throw new HttpError(
      "Admission, destination bed, transfer reason, requesting doctor, and responsible staff are required."
    );
  }

  const pool = getPool();
  const [admRes, destBedRes] = await Promise.all([
    pool.query("SELECT * FROM ipd_admissions WHERE id = $1", [
      input.admissionId,
    ]),
    pool.query("SELECT * FROM ipd_beds WHERE id = $1", [input.toBedId]),
  ]);

  if (admRes.rowCount === 0) {
    throw new HttpError(`Admission ${input.admissionId} not found.`, 404);
  }
  const adm = mapAdmission(admRes.rows[0]);
  if (adm.status === "Discharged") {
    throw new HttpError("Cannot transfer a discharged patient.");
  }

  if (destBedRes.rowCount === 0) {
    throw new HttpError(`Destination bed ${input.toBedId} not found.`, 404);
  }
  const destBed = mapBed(destBedRes.rows[0]);
  if (destBed.status !== "Available") {
    throw new HttpError(
      `Destination bed ${destBed.bedNumber} is currently ${destBed.status}.`,
      409
    );
  }

  const seq = await nextCounter("ipd_transfer");
  const id = `ITR-${new Date().getFullYear()}-${pad(seq)}`;

  const trfRes = await pool.query(
    `INSERT INTO ipd_transfers (
      id, admission_id, patient_id,
      from_department, from_ward, from_room, from_bed_id,
      to_department, to_ward, to_room, to_bed_id,
      reason, requesting_doctor, responsible_staff, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'Completed')
    RETURNING *`,
    [
      id,
      adm.id,
      adm.patientId,
      adm.department,
      adm.ward,
      adm.room,
      adm.bedId,
      destBed.department,
      destBed.ward,
      destBed.room,
      destBed.id,
      input.reason.trim(),
      input.requestingDoctor.trim(),
      input.responsibleStaff.trim(),
    ]
  );

  // Release previous bed & occupy destination bed
  await pool.query(
    `UPDATE ipd_beds SET status = 'Available', current_admission_id = NULL WHERE id = $1`,
    [adm.bedId]
  );
  await pool.query(
    `UPDATE ipd_beds SET status = 'Occupied', current_admission_id = $2 WHERE id = $1`,
    [destBed.id, adm.id]
  );

  const newBedLabel = `${destBed.ward} / ${destBed.room} / ${destBed.bedNumber}`;
  await pool.query(
    `UPDATE ipd_admissions
     SET department = $2, ward = $3, room = $4, bed_id = $5, bed_label = $6, updated_at = NOW()
     WHERE id = $1`,
    [
      adm.id,
      destBed.department,
      destBed.ward,
      destBed.room,
      destBed.id,
      newBedLabel,
    ]
  );

  return mapTransfer(trfRes.rows[0]);
}

// 5. Daily Progress Notes (Append-only chronological clinical log)
export async function createProgressNote(input: {
  admissionId: string;
  noteDate?: string;
  recordedBy: string;
  recordedRole: string;
  vitals: Record<string, string>;
  symptoms: string;
  observations: string;
  patientCondition: string;
}) {
  if (
    !input.admissionId ||
    !input.symptoms?.trim() ||
    !input.observations?.trim()
  ) {
    throw new HttpError(
      "Admission, symptoms, and clinical observations are required."
    );
  }

  const pool = getPool();
  const admRes = await pool.query(
    "SELECT id, patient_id, status FROM ipd_admissions WHERE id = $1",
    [input.admissionId]
  );
  if (admRes.rowCount === 0) {
    throw new HttpError(`Admission ${input.admissionId} not found.`, 404);
  }
  const adm = admRes.rows[0];
  if (adm.status === "Discharged") {
    throw new HttpError("Cannot add progress notes to a discharged admission.");
  }

  const seq = await nextCounter("ipd_progress_note");
  const id = `PRG-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO ipd_progress_notes (
      id, admission_id, patient_id, note_date, recorded_by, recorded_role,
      vitals, symptoms, observations, patient_condition
    ) VALUES ($1,$2,$3,COALESCE($4::timestamptz, NOW()),$5,$6,$7::jsonb,$8,$9,$10)
    RETURNING *`,
    [
      id,
      adm.id,
      adm.patient_id,
      input.noteDate || null,
      input.recordedBy || "Clinical Staff",
      input.recordedRole || "Doctor",
      JSON.stringify(input.vitals ?? {}),
      input.symptoms.trim(),
      input.observations.trim(),
      input.patientCondition || "Stable",
    ]
  );

  if (adm.status === "Admitted") {
    await pool.query(
      `UPDATE ipd_admissions SET status = 'Under Treatment', updated_at = NOW() WHERE id = $1`,
      [adm.id]
    );
  }

  return mapProgressNote(res.rows[0]);
}

// 6. Treatment Plans (Create new or record revised version preserving history)
export async function createTreatmentPlan(input: {
  admissionId: string;
  doctorName: string;
  diagnosis: string;
  treatmentInstructions: string;
  medications: string;
  procedures?: string;
  careRequirements?: string;
  assignedStaff?: string;
  status?: string;
}) {
  if (
    !input.admissionId ||
    !input.doctorName?.trim() ||
    !input.diagnosis?.trim() ||
    !input.treatmentInstructions?.trim() ||
    !input.medications?.trim()
  ) {
    throw new HttpError(
      "Admission, doctor, diagnosis, treatment instructions, and medications are required."
    );
  }

  const pool = getPool();
  const admRes = await pool.query(
    "SELECT id, patient_id, status FROM ipd_admissions WHERE id = $1",
    [input.admissionId]
  );
  if (admRes.rowCount === 0) {
    throw new HttpError(`Admission ${input.admissionId} not found.`, 404);
  }
  const adm = admRes.rows[0];

  // Mark previous active plans for this admission as Revised to preserve full history
  const prevRes = await pool.query(
    `SELECT COALESCE(MAX(version), 0) AS max_ver FROM ipd_treatment_plans WHERE admission_id = $1`,
    [adm.id]
  );
  const nextVersion = Number(prevRes.rows[0].max_ver) + 1;

  if (nextVersion > 1) {
    await pool.query(
      `UPDATE ipd_treatment_plans SET status = 'Revised', updated_at = NOW()
       WHERE admission_id = $1 AND status = 'Active'`,
      [adm.id]
    );
  }

  const seq = await nextCounter("ipd_treatment_plan");
  const id = `TPL-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO ipd_treatment_plans (
      id, admission_id, patient_id, doctor_name, diagnosis,
      treatment_instructions, medications, procedures, care_requirements,
      assigned_staff, status, version
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      id,
      adm.id,
      adm.patient_id,
      input.doctorName.trim(),
      input.diagnosis.trim(),
      input.treatmentInstructions.trim(),
      input.medications.trim(),
      input.procedures?.trim() || "None",
      input.careRequirements?.trim() || "",
      input.assignedStaff?.trim() || "Inpatient Nursing Team",
      input.status || "Active",
      nextVersion,
    ]
  );

  if (adm.status === "Admitted") {
    await pool.query(
      `UPDATE ipd_admissions SET status = 'Under Treatment', updated_at = NOW() WHERE id = $1`,
      [adm.id]
    );
  }

  return mapTreatmentPlan(res.rows[0]);
}

export async function updateTreatmentPlanStatus(
  planId: string,
  status: string
) {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE ipd_treatment_plans SET status = $2, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [planId, status]
  );
  if (res.rowCount === 0) {
    throw new HttpError(`Treatment plan ${planId} not found.`, 404);
  }
  return mapTreatmentPlan(res.rows[0]);
}

// 3. Discharge Management (Strict Approval Checks + Automatic Bed Release)
export async function createDischargeRequest(input: {
  admissionId: string;
  dischargeDate: string;
  reason: string;
}) {
  if (!input.admissionId || !input.dischargeDate || !input.reason?.trim()) {
    throw new HttpError(
      "Admission, discharge date, and discharge reason are required."
    );
  }

  const pool = getPool();
  const admRes = await pool.query(
    "SELECT id, patient_id, status FROM ipd_admissions WHERE id = $1",
    [input.admissionId]
  );
  if (admRes.rowCount === 0) {
    throw new HttpError(`Admission ${input.admissionId} not found.`, 404);
  }
  const adm = admRes.rows[0];
  if (adm.status === "Discharged") {
    throw new HttpError("This admission has already been discharged.");
  }

  const existing = await pool.query(
    "SELECT id FROM ipd_discharges WHERE admission_id = $1",
    [adm.id]
  );
  if ((existing.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Discharge record ${existing.rows[0].id} already exists for admission ${adm.id}.`,
      409
    );
  }

  const seq = await nextCounter("ipd_discharge");
  const id = `DSC-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO ipd_discharges (id, admission_id, patient_id, discharge_date, reason, status)
     VALUES ($1,$2,$3,$4,$5,'Pending') RETURNING *`,
    [id, adm.id, adm.patient_id, input.dischargeDate, input.reason.trim()]
  );

  await pool.query(
    `UPDATE ipd_admissions SET status = 'Discharge Requested', updated_at = NOW() WHERE id = $1`,
    [adm.id]
  );

  return mapDischarge(res.rows[0]);
}

export async function updateDischarge(input: {
  dischargeId: string;
  action: "update-approvals" | "complete";
  clinicalClearance?: boolean;
  billingClearance?: boolean;
  pharmacyClearance?: boolean;
  doctorApproval?: boolean;
  approvedBy?: string;
}) {
  const pool = getPool();
  const dscRes = await pool.query("SELECT * FROM ipd_discharges WHERE id = $1", [
    input.dischargeId,
  ]);
  if (dscRes.rowCount === 0) {
    throw new HttpError(`Discharge record ${input.dischargeId} not found.`, 404);
  }
  const current = mapDischarge(dscRes.rows[0]);
  if (current.status === "Completed") {
    throw new HttpError("Discharge is already completed.");
  }

  if (input.action === "update-approvals") {
    const updated = await pool.query(
      `UPDATE ipd_discharges
       SET clinical_clearance = COALESCE($2, clinical_clearance),
           billing_clearance = COALESCE($3, billing_clearance),
           pharmacy_clearance = COALESCE($4, pharmacy_clearance),
           doctor_approval = COALESCE($5, doctor_approval),
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        input.dischargeId,
        input.clinicalClearance ?? null,
        input.billingClearance ?? null,
        input.pharmacyClearance ?? null,
        input.doctorApproval ?? null,
      ]
    );
    return mapDischarge(updated.rows[0]);
  }

  // Complete discharge: enforce all 4 required clearances/approvals
  const missing: string[] = [];
  if (!current.clinicalClearance) missing.push("Clinical Clearance");
  if (!current.billingClearance) missing.push("Billing Clearance");
  if (!current.pharmacyClearance) missing.push("Pharmacy Clearance");
  if (!current.doctorApproval) missing.push("Doctor Final Approval");

  if (missing.length > 0) {
    throw new HttpError(
      `Cannot complete discharge — missing required approvals: ${missing.join(", ")}.`,
      400
    );
  }

  const completedRes = await pool.query(
    `UPDATE ipd_discharges
     SET status = 'Completed', approved_by = $2, completed_at = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [input.dischargeId, input.approvedBy || "Ward Manager"]
  );

  const admRes = await pool.query(
    `UPDATE ipd_admissions SET status = 'Discharged', updated_at = NOW()
     WHERE id = $1 RETURNING bed_id`,
    [current.admissionId]
  );

  if (admRes.rows[0]?.bed_id) {
    await pool.query(
      `UPDATE ipd_beds SET status = 'Available', current_admission_id = NULL WHERE id = $1`,
      [admRes.rows[0].bed_id]
    );
  }

  return mapDischarge(completedRes.rows[0]);
}

// 7. Discharge Summaries
export async function saveDischargeSummary(input: {
  admissionId: string;
  finalDiagnosis: string;
  treatmentReceived: string;
  proceduresPerformed?: string;
  clinicalProgress: string;
  dischargeMedications: string;
  followUpInstructions: string;
  recommendations?: string;
  responsibleDoctor: string;
  authorizedBy: string;
}) {
  if (
    !input.admissionId ||
    !input.finalDiagnosis?.trim() ||
    !input.treatmentReceived?.trim() ||
    !input.clinicalProgress?.trim() ||
    !input.dischargeMedications?.trim() ||
    !input.followUpInstructions?.trim() ||
    !input.responsibleDoctor?.trim()
  ) {
    throw new HttpError(
      "Admission, final diagnosis, treatment received, clinical progress, discharge medications, follow-up instructions, and responsible doctor are required."
    );
  }

  const pool = getPool();
  const admRes = await pool.query("SELECT * FROM ipd_admissions WHERE id = $1", [
    input.admissionId,
  ]);
  if (admRes.rowCount === 0) {
    throw new HttpError(`Admission ${input.admissionId} not found.`, 404);
  }
  const adm = mapAdmission(admRes.rows[0]);

  const dscRes = await pool.query(
    "SELECT id, discharge_date FROM ipd_discharges WHERE admission_id = $1",
    [adm.id]
  );
  const dischargeId = (dscRes.rows[0]?.id as string | undefined) ?? null;
  const dischargeDate =
    (dscRes.rows[0]?.discharge_date as string | undefined) ??
    new Date().toISOString().slice(0, 10);

  const existing = await pool.query(
    "SELECT id FROM ipd_discharge_summaries WHERE admission_id = $1",
    [adm.id]
  );

  let sumRes;
  if ((existing.rowCount ?? 0) > 0) {
    sumRes = await pool.query(
      `UPDATE ipd_discharge_summaries
       SET discharge_id = $2, discharge_date = $3, final_diagnosis = $4,
           treatment_received = $5, procedures_performed = $6, clinical_progress = $7,
           discharge_medications = $8, follow_up_instructions = $9, recommendations = $10,
           responsible_doctor = $11, authorized_by = $12
       WHERE admission_id = $1 RETURNING *`,
      [
        adm.id,
        dischargeId,
        dischargeDate,
        input.finalDiagnosis.trim(),
        input.treatmentReceived.trim(),
        input.proceduresPerformed?.trim() || "None",
        input.clinicalProgress.trim(),
        input.dischargeMedications.trim(),
        input.followUpInstructions.trim(),
        input.recommendations?.trim() || "",
        input.responsibleDoctor.trim(),
        input.authorizedBy?.trim() || input.responsibleDoctor.trim(),
      ]
    );
  } else {
    const seq = await nextCounter("ipd_discharge_summary");
    const id = `DSM-${new Date().getFullYear()}-${pad(seq)}`;
    sumRes = await pool.query(
      `INSERT INTO ipd_discharge_summaries (
        id, admission_id, discharge_id, patient_id, admission_date, discharge_date,
        final_diagnosis, treatment_received, procedures_performed, clinical_progress,
        discharge_medications, follow_up_instructions, recommendations,
        responsible_doctor, authorized_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        id,
        adm.id,
        dischargeId,
        adm.patientId,
        adm.admissionDate.slice(0, 10),
        dischargeDate,
        input.finalDiagnosis.trim(),
        input.treatmentReceived.trim(),
        input.proceduresPerformed?.trim() || "None",
        input.clinicalProgress.trim(),
        input.dischargeMedications.trim(),
        input.followUpInstructions.trim(),
        input.recommendations?.trim() || "",
        input.responsibleDoctor.trim(),
        input.authorizedBy?.trim() || input.responsibleDoctor.trim(),
      ]
    );
  }

  const summary = mapSummary(sumRes.rows[0]);
  if (dischargeId) {
    await pool.query(
      `UPDATE ipd_discharges SET discharge_summary_id = $2, updated_at = NOW() WHERE id = $1`,
      [dischargeId, summary.id]
    );
  }

  return summary;
}
