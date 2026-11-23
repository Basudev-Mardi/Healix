import { getPool, nextCounter } from "../db/client.js";
import { HttpError } from "../opd/service.js";

function pad(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && startB < endA;
}

function mapTheatre(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    name: r.name as string,
    specialty: r.specialty as string,
    location: r.location as string,
    status: r.status as string,
    currentSurgeryId: (r.current_surgery_id as string | null) ?? undefined,
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapSurgeon(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    name: r.name as string,
    specialty: r.specialty as string,
    roleType: r.role_type as string,
    isAvailable: Boolean(r.is_available),
  };
}

function mapSurgery(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    admissionId: (r.admission_id as string | null) ?? undefined,
    theatreId: r.theatre_id as string,
    theatreName: r.theatre_name as string,
    diagnosis: r.diagnosis as string,
    surgeryType: r.surgery_type as string,
    procedureName: r.procedure_name as string,
    scheduledDate: r.scheduled_date as string,
    startTime: r.start_time as string,
    endTime: r.end_time as string,
    priority: r.priority as string,
    status: r.status as string,
    cancelReason: (r.cancel_reason as string | null) ?? undefined,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapAssignment(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    surgeryId: r.surgery_id as string,
    surgeonId: r.surgeon_id as string,
    surgeonName: r.surgeon_name as string,
    specialty: r.specialty as string,
    assignedRole: r.assigned_role as string,
    assignedBy: r.assigned_by as string,
    assignedAt: new Date(r.assigned_at as string).toISOString(),
  };
}

function mapChecklist(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    surgeryId: r.surgery_id as string,
    patientId: r.patient_id as string,
    identityVerified: Boolean(r.identity_verified),
    procedureConfirmed: Boolean(r.procedure_confirmed),
    consentSigned: Boolean(r.consent_signed),
    allergiesReviewed: Boolean(r.allergies_reviewed),
    allergiesNotes: r.allergies_notes as string,
    npoConfirmed: Boolean(r.npo_confirmed),
    preopLabsReady: Boolean(r.preop_labs_ready),
    anesthesiaClearance: Boolean(r.anesthesia_clearance),
    siteMarked: Boolean(r.site_marked),
    preparationNotes: r.preparation_notes as string,
    status: r.status as string,
    verifiedBy: (r.verified_by as string | null) ?? undefined,
    verifiedAt: r.verified_at
      ? new Date(r.verified_at as string).toISOString()
      : undefined,
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapSurgicalRecord(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    surgeryId: r.surgery_id as string,
    patientId: r.patient_id as string,
    procedurePerformed: r.procedure_performed as string,
    surgeryDate: r.surgery_date as string,
    actualStartTime: r.actual_start_time as string,
    actualEndTime: r.actual_end_time as string,
    primarySurgeon: r.primary_surgeon as string,
    assistingSurgeons: r.assisting_surgeons as string,
    participatingStaff: r.participating_staff as string,
    surgicalFindings: r.surgical_findings as string,
    operativeNotes: r.operative_notes as string,
    complications: r.complications as string,
    outcome: r.outcome as string,
    recordedBy: r.recorded_by as string,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapAnesthesiaRecord(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    surgeryId: r.surgery_id as string,
    patientId: r.patient_id as string,
    anesthesiologist: r.anesthesiologist as string,
    anesthesiaType: r.anesthesia_type as string,
    preAnesthesiaAssessment: r.pre_anesthesia_assessment as string,
    medicationsAndDosages: r.medications_and_dosages as string,
    intraopMonitoring: r.intraop_monitoring as string,
    anesthesiaStartTime: r.anesthesia_start_time as string,
    anesthesiaEndTime: r.anesthesia_end_time as string,
    recoveryDetails: r.recovery_details as string,
    observations: r.observations as string,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapPostOp(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    surgeryId: r.surgery_id as string,
    surgicalRecordId: (r.surgical_record_id as string | null) ?? undefined,
    patientId: r.patient_id as string,
    recordedAt: new Date(r.recorded_at as string).toISOString(),
    responsibleStaff: r.responsible_staff as string,
    patientCondition: r.patient_condition as string,
    vitals: r.vitals as Record<string, string>,
    painScore: r.pain_score as string,
    recoveryStatus: r.recovery_status as string,
    medicationsAndCare: r.medications_and_care as string,
    complications: r.complications as string,
    observations: r.observations as string,
    transferDestination: r.transfer_destination as string,
  };
}

export async function getOtState() {
  const pool = getPool();
  const [
    patientsRes,
    theatresRes,
    surgeonsRes,
    surgeriesRes,
    assignmentsRes,
    checklistsRes,
    surgicalRes,
    anesthesiaRes,
    postopRes,
  ] = await Promise.all([
    pool.query(
      "SELECT id, full_name, gender, phone, blood_group, allergies FROM patients ORDER BY created_at DESC"
    ),
    pool.query("SELECT * FROM ot_theatres ORDER BY id ASC"),
    pool.query("SELECT * FROM ot_surgeons ORDER BY id ASC"),
    pool.query("SELECT * FROM ot_surgeries ORDER BY scheduled_date DESC, start_time ASC"),
    pool.query("SELECT * FROM ot_surgeon_assignments ORDER BY assigned_at DESC"),
    pool.query("SELECT * FROM ot_preop_checklists ORDER BY updated_at DESC"),
    pool.query("SELECT * FROM ot_surgical_records ORDER BY created_at DESC"),
    pool.query("SELECT * FROM ot_anesthesia_records ORDER BY created_at DESC"),
    pool.query("SELECT * FROM ot_postop_monitoring ORDER BY recorded_at DESC"),
  ]);

  return {
    patients: patientsRes.rows.map((r) => ({
      id: r.id as string,
      fullName: r.full_name as string,
      gender: r.gender as string,
      phone: r.phone as string,
      bloodGroup: r.blood_group as string,
      allergies: r.allergies as string,
    })),
    theatres: theatresRes.rows.map(mapTheatre),
    surgeons: surgeonsRes.rows.map(mapSurgeon),
    surgeries: surgeriesRes.rows.map(mapSurgery),
    assignments: assignmentsRes.rows.map(mapAssignment),
    checklists: checklistsRes.rows.map(mapChecklist),
    surgicalRecords: surgicalRes.rows.map(mapSurgicalRecord),
    anesthesiaRecords: anesthesiaRes.rows.map(mapAnesthesiaRecord),
    postOpRecords: postopRes.rows.map(mapPostOp),
  };
}

async function checkTheatreBookingConflict(
  theatreId: string,
  scheduledDate: string,
  startTime: string,
  endTime: string,
  excludeSurgeryId?: string
) {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, start_time, end_time FROM ot_surgeries
     WHERE theatre_id = $1 AND scheduled_date = $2
       AND status NOT IN ('Cancelled', 'Completed')
       AND ($3::text IS NULL OR id <> $3)`,
    [theatreId, scheduledDate, excludeSurgeryId ?? null]
  );

  for (const row of res.rows) {
    if (
      timesOverlap(
        startTime,
        endTime,
        row.start_time as string,
        row.end_time as string
      )
    ) {
      throw new HttpError(
        `OT conflict: ${theatreId} is already booked on ${scheduledDate} (${row.start_time}–${row.end_time}, ${row.id}).`,
        409
      );
    }
  }
}

// 1. Surgery Scheduling
export async function createSurgery(input: {
  patientId: string;
  admissionId?: string;
  theatreId: string;
  diagnosis: string;
  surgeryType: string;
  procedureName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  priority?: string;
}) {
  if (
    !input.patientId ||
    !input.theatreId ||
    !input.diagnosis?.trim() ||
    !input.procedureName?.trim() ||
    !input.scheduledDate ||
    !input.startTime ||
    !input.endTime
  ) {
    throw new HttpError(
      "Patient, operation theatre, diagnosis, procedure, date, start time, and end time are required."
    );
  }
  if (input.endTime <= input.startTime) {
    throw new HttpError("End time must be later than start time.");
  }

  const pool = getPool();
  const [patRes, thRes] = await Promise.all([
    pool.query("SELECT id, full_name, allergies FROM patients WHERE id = $1", [
      input.patientId,
    ]),
    pool.query("SELECT * FROM ot_theatres WHERE id = $1", [input.theatreId]),
  ]);

  if (patRes.rowCount === 0) {
    throw new HttpError(`Patient ${input.patientId} not found.`, 404);
  }
  if (thRes.rowCount === 0) {
    throw new HttpError(`Operation Theatre ${input.theatreId} not found.`, 404);
  }
  const theatre = mapTheatre(thRes.rows[0]);
  if (theatre.status === "Maintenance") {
    throw new HttpError(
      `${theatre.name} is currently under Maintenance and cannot be booked.`,
      409
    );
  }

  await checkTheatreBookingConflict(
    theatre.id,
    input.scheduledDate,
    input.startTime,
    input.endTime
  );

  const seq = await nextCounter("ot_surgery");
  const year = new Date().getFullYear();
  const id = `SUR-${year}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO ot_surgeries (
      id, patient_id, patient_name, admission_id, theatre_id, theatre_name,
      diagnosis, surgery_type, procedure_name, scheduled_date, start_time,
      end_time, priority, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'Scheduled')
    RETURNING *`,
    [
      id,
      patRes.rows[0].id,
      patRes.rows[0].full_name,
      input.admissionId?.trim() || null,
      theatre.id,
      theatre.name,
      input.diagnosis.trim(),
      input.surgeryType || "Elective",
      input.procedureName.trim(),
      input.scheduledDate,
      input.startTime,
      input.endTime,
      input.priority || "Normal",
    ]
  );

  // Reserve theatre if currently Available
  if (theatre.status === "Available") {
    await pool.query(
      `UPDATE ot_theatres SET status = 'Reserved', current_surgery_id = $2, updated_at = NOW() WHERE id = $1`,
      [theatre.id, id]
    );
  }

  // Auto-initialize pending Pre-operative Checklist linked to this surgery
  const chkSeq = await nextCounter("ot_checklist");
  await pool.query(
    `INSERT INTO ot_preop_checklists (id, surgery_id, patient_id, allergies_notes, status)
     VALUES ($1,$2,$3,$4,'Pending')`,
    [
      `CHK-${year}-${pad(chkSeq)}`,
      id,
      patRes.rows[0].id,
      (patRes.rows[0].allergies as string) || "None",
    ]
  );

  return mapSurgery(res.rows[0]);
}

export async function updateSurgery(input: {
  surgeryId: string;
  action: "reschedule" | "status" | "cancel";
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  theatreId?: string;
  status?: string;
  cancelReason?: string;
}) {
  const pool = getPool();
  const curRes = await pool.query("SELECT * FROM ot_surgeries WHERE id = $1", [
    input.surgeryId,
  ]);
  if (curRes.rowCount === 0) {
    throw new HttpError(`Surgery ${input.surgeryId} not found.`, 404);
  }
  const cur = mapSurgery(curRes.rows[0]);

  if (input.action === "cancel") {
    const updated = await pool.query(
      `UPDATE ot_surgeries SET status = 'Cancelled', cancel_reason = $2, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [cur.id, input.cancelReason?.trim() || "Cancelled by OT staff"]
    );
    await pool.query(
      `UPDATE ot_theatres
       SET status = CASE WHEN current_surgery_id = $2 THEN 'Available' ELSE status END,
           current_surgery_id = CASE WHEN current_surgery_id = $2 THEN NULL ELSE current_surgery_id END,
           updated_at = NOW()
       WHERE id = $1`,
      [cur.theatreId, cur.id]
    );
    return mapSurgery(updated.rows[0]);
  }

  if (input.action === "reschedule") {
    const nextDate = input.scheduledDate || cur.scheduledDate;
    const nextStart = input.startTime || cur.startTime;
    const nextEnd = input.endTime || cur.endTime;
    const nextTheatreId = input.theatreId || cur.theatreId;
    if (nextEnd <= nextStart) {
      throw new HttpError("End time must be later than start time.");
    }

    const thRes = await pool.query("SELECT * FROM ot_theatres WHERE id = $1", [
      nextTheatreId,
    ]);
    if (thRes.rowCount === 0) {
      throw new HttpError(`Operation Theatre ${nextTheatreId} not found.`, 404);
    }
    const theatre = mapTheatre(thRes.rows[0]);
    await checkTheatreBookingConflict(
      theatre.id,
      nextDate,
      nextStart,
      nextEnd,
      cur.id
    );

    const updated = await pool.query(
      `UPDATE ot_surgeries
       SET theatre_id = $2, theatre_name = $3, scheduled_date = $4,
           start_time = $5, end_time = $6, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [cur.id, theatre.id, theatre.name, nextDate, nextStart, nextEnd]
    );
    return mapSurgery(updated.rows[0]);
  }

  // Status transition
  const nextStatus = input.status;
  if (!nextStatus) {
    throw new HttpError("Target surgery status is required.");
  }

  // Enforce mandatory Pre-op Checklist verification before marking Ready or In Progress
  if (nextStatus === "Ready" || nextStatus === "In Progress") {
    const chkRes = await pool.query(
      "SELECT status FROM ot_preop_checklists WHERE surgery_id = $1",
      [cur.id]
    );
    if (chkRes.rowCount === 0 || chkRes.rows[0].status !== "Verified") {
      throw new HttpError(
        `Cannot mark surgery ${cur.id} as ${nextStatus}: mandatory Pre-operative Checklist items are still incomplete.`,
        409
      );
    }
  }

  const updated = await pool.query(
    `UPDATE ot_surgeries SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [cur.id, nextStatus]
  );

  // Sync OT Theatre availability automatically
  if (nextStatus === "In Progress") {
    await pool.query(
      `UPDATE ot_theatres SET status = 'Occupied', current_surgery_id = $2, updated_at = NOW() WHERE id = $1`,
      [cur.theatreId, cur.id]
    );
  } else if (nextStatus === "Completed") {
    await pool.query(
      `UPDATE ot_theatres SET status = 'Cleaning', current_surgery_id = NULL, updated_at = NOW() WHERE id = $1`,
      [cur.theatreId]
    );
  }

  return mapSurgery(updated.rows[0]);
}

// 2. OT Availability Status Update
export async function updateTheatreStatus(theatreId: string, status: string) {
  const pool = getPool();
  const thRes = await pool.query("SELECT * FROM ot_theatres WHERE id = $1", [
    theatreId,
  ]);
  if (thRes.rowCount === 0) {
    throw new HttpError(`Operation Theatre ${theatreId} not found.`, 404);
  }
  const cur = mapTheatre(thRes.rows[0]);
  if (cur.status === "Occupied" && status !== "Cleaning") {
    throw new HttpError(
      `${cur.name} is currently Occupied by an active surgery. Complete the surgery first.`,
      409
    );
  }

  const updated = await pool.query(
    `UPDATE ot_theatres
     SET status = $2,
         current_surgery_id = CASE WHEN $2 IN ('Available','Cleaning','Maintenance') THEN NULL ELSE current_surgery_id END,
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [theatreId, status]
  );
  return mapTheatre(updated.rows[0]);
}

// 3. Surgeon Assignment (Checks Surgeon Scheduling Conflicts)
export async function assignSurgeon(input: {
  surgeryId: string;
  surgeonId: string;
  assignedRole: string;
  assignedBy: string;
}) {
  if (!input.surgeryId || !input.surgeonId || !input.assignedRole) {
    throw new HttpError("Surgery, surgeon, and assigned role are required.");
  }

  const pool = getPool();
  const [surRes, srgRes] = await Promise.all([
    pool.query("SELECT * FROM ot_surgeries WHERE id = $1", [input.surgeryId]),
    pool.query("SELECT * FROM ot_surgeons WHERE id = $1", [input.surgeonId]),
  ]);

  if (surRes.rowCount === 0) {
    throw new HttpError(`Surgery ${input.surgeryId} not found.`, 404);
  }
  if (srgRes.rowCount === 0) {
    throw new HttpError(`Surgeon ${input.surgeonId} not found.`, 404);
  }
  const surgery = mapSurgery(surRes.rows[0]);
  const surgeon = mapSurgeon(srgRes.rows[0]);

  // Check duplicate assignment on same surgery
  const dup = await pool.query(
    `SELECT id FROM ot_surgeon_assignments WHERE surgery_id = $1 AND surgeon_id = $2`,
    [surgery.id, surgeon.id]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(
      `${surgeon.name} is already assigned to surgery ${surgery.id}.`,
      409
    );
  }

  // Check scheduling conflict for this surgeon across overlapping surgeries
  const conflictRes = await pool.query(
    `SELECT s.id, s.start_time, s.end_time
     FROM ot_surgeon_assignments a
     JOIN ot_surgeries s ON s.id = a.surgery_id
     WHERE a.surgeon_id = $1
       AND s.scheduled_date = $2
       AND s.status NOT IN ('Cancelled', 'Completed')
       AND s.id <> $3`,
    [surgeon.id, surgery.scheduledDate, surgery.id]
  );
  for (const row of conflictRes.rows) {
    if (
      timesOverlap(
        surgery.startTime,
        surgery.endTime,
        row.start_time as string,
        row.end_time as string
      )
    ) {
      throw new HttpError(
        `Surgeon conflict: ${surgeon.name} is already assigned to ${row.id} on ${surgery.scheduledDate} (${row.start_time}–${row.end_time}).`,
        409
      );
    }
  }

  const seq = await nextCounter("ot_assignment");
  const id = `ASN-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO ot_surgeon_assignments (
      id, surgery_id, surgeon_id, surgeon_name, specialty, assigned_role, assigned_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      id,
      surgery.id,
      surgeon.id,
      surgeon.name,
      surgeon.specialty,
      input.assignedRole,
      input.assignedBy || "OT Manager",
    ]
  );
  return mapAssignment(res.rows[0]);
}

export async function removeSurgeonAssignment(assignmentId: string) {
  const pool = getPool();
  const res = await pool.query(
    "DELETE FROM ot_surgeon_assignments WHERE id = $1 RETURNING id",
    [assignmentId]
  );
  if (res.rowCount === 0) {
    throw new HttpError(`Assignment ${assignmentId} not found.`, 404);
  }
  return { deletedId: assignmentId };
}

// 4. Pre-operative Checklist
export async function savePreOpChecklist(input: {
  surgeryId: string;
  identityVerified: boolean;
  procedureConfirmed: boolean;
  consentSigned: boolean;
  allergiesReviewed: boolean;
  allergiesNotes?: string;
  npoConfirmed: boolean;
  preopLabsReady: boolean;
  anesthesiaClearance: boolean;
  siteMarked?: boolean;
  preparationNotes?: string;
  verifiedBy: string;
}) {
  const pool = getPool();
  const surRes = await pool.query(
    "SELECT id, patient_id FROM ot_surgeries WHERE id = $1",
    [input.surgeryId]
  );
  if (surRes.rowCount === 0) {
    throw new HttpError(`Surgery ${input.surgeryId} not found.`, 404);
  }
  const sur = surRes.rows[0];

  const allMandatoryComplete =
    Boolean(input.identityVerified) &&
    Boolean(input.procedureConfirmed) &&
    Boolean(input.consentSigned) &&
    Boolean(input.allergiesReviewed) &&
    Boolean(input.npoConfirmed) &&
    Boolean(input.preopLabsReady) &&
    Boolean(input.anesthesiaClearance);

  const status = allMandatoryComplete ? "Verified" : "Pending";

  const existing = await pool.query(
    "SELECT id FROM ot_preop_checklists WHERE surgery_id = $1",
    [sur.id]
  );

  let res;
  if ((existing.rowCount ?? 0) > 0) {
    res = await pool.query(
      `UPDATE ot_preop_checklists
       SET identity_verified = $2, procedure_confirmed = $3, consent_signed = $4,
           allergies_reviewed = $5, allergies_notes = $6, npo_confirmed = $7,
           preop_labs_ready = $8, anesthesia_clearance = $9, site_marked = $10,
           preparation_notes = $11, status = $12,
           verified_by = CASE WHEN $12 = 'Verified' THEN $13 ELSE verified_by END,
           verified_at = CASE WHEN $12 = 'Verified' THEN NOW() ELSE verified_at END,
           updated_at = NOW()
       WHERE surgery_id = $1 RETURNING *`,
      [
        sur.id,
        Boolean(input.identityVerified),
        Boolean(input.procedureConfirmed),
        Boolean(input.consentSigned),
        Boolean(input.allergiesReviewed),
        input.allergiesNotes?.trim() || "None",
        Boolean(input.npoConfirmed),
        Boolean(input.preopLabsReady),
        Boolean(input.anesthesiaClearance),
        Boolean(input.siteMarked),
        input.preparationNotes?.trim() ?? "",
        status,
        input.verifiedBy || "OT Nurse",
      ]
    );
  } else {
    const seq = await nextCounter("ot_checklist");
    const id = `CHK-${new Date().getFullYear()}-${pad(seq)}`;
    res = await pool.query(
      `INSERT INTO ot_preop_checklists (
        id, surgery_id, patient_id, identity_verified, procedure_confirmed,
        consent_signed, allergies_reviewed, allergies_notes, npo_confirmed,
        preop_labs_ready, anesthesia_clearance, site_marked, preparation_notes,
        status, verified_by, verified_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,CASE WHEN $14='Verified' THEN NOW() ELSE NULL END)
      RETURNING *`,
      [
        id,
        sur.id,
        sur.patient_id,
        Boolean(input.identityVerified),
        Boolean(input.procedureConfirmed),
        Boolean(input.consentSigned),
        Boolean(input.allergiesReviewed),
        input.allergiesNotes?.trim() || "None",
        Boolean(input.npoConfirmed),
        Boolean(input.preopLabsReady),
        Boolean(input.anesthesiaClearance),
        Boolean(input.siteMarked),
        input.preparationNotes?.trim() ?? "",
        status,
        status === "Verified" ? input.verifiedBy || "OT Nurse" : null,
      ]
    );
  }

  return mapChecklist(res.rows[0]);
}

// 5. Surgical Records
export async function saveSurgicalRecord(input: {
  surgeryId: string;
  procedurePerformed: string;
  surgeryDate: string;
  actualStartTime: string;
  actualEndTime: string;
  primarySurgeon: string;
  assistingSurgeons?: string;
  participatingStaff?: string;
  surgicalFindings: string;
  operativeNotes: string;
  complications?: string;
  outcome: string;
  recordedBy: string;
}) {
  if (
    !input.surgeryId ||
    !input.procedurePerformed?.trim() ||
    !input.primarySurgeon?.trim() ||
    !input.surgicalFindings?.trim() ||
    !input.operativeNotes?.trim() ||
    !input.outcome?.trim()
  ) {
    throw new HttpError(
      "Surgery, procedure performed, primary surgeon, findings, operative notes, and outcome are required."
    );
  }

  const pool = getPool();
  const surRes = await pool.query(
    "SELECT id, patient_id, theatre_id FROM ot_surgeries WHERE id = $1",
    [input.surgeryId]
  );
  if (surRes.rowCount === 0) {
    throw new HttpError(`Surgery ${input.surgeryId} not found.`, 404);
  }
  const sur = surRes.rows[0];

  const existing = await pool.query(
    "SELECT id FROM ot_surgical_records WHERE surgery_id = $1",
    [sur.id]
  );

  let res;
  if ((existing.rowCount ?? 0) > 0) {
    res = await pool.query(
      `UPDATE ot_surgical_records
       SET procedure_performed = $2, surgery_date = $3, actual_start_time = $4,
           actual_end_time = $5, primary_surgeon = $6, assisting_surgeons = $7,
           participating_staff = $8, surgical_findings = $9, operative_notes = $10,
           complications = $11, outcome = $12, updated_at = NOW()
       WHERE surgery_id = $1 RETURNING *`,
      [
        sur.id,
        input.procedurePerformed.trim(),
        input.surgeryDate,
        input.actualStartTime,
        input.actualEndTime,
        input.primarySurgeon.trim(),
        input.assistingSurgeons?.trim() ?? "",
        input.participatingStaff?.trim() ?? "",
        input.surgicalFindings.trim(),
        input.operativeNotes.trim(),
        input.complications?.trim() || "None",
        input.outcome.trim(),
      ]
    );
  } else {
    const seq = await nextCounter("ot_surgical_record");
    const id = `OPR-${new Date().getFullYear()}-${pad(seq)}`;
    res = await pool.query(
      `INSERT INTO ot_surgical_records (
        id, surgery_id, patient_id, procedure_performed, surgery_date,
        actual_start_time, actual_end_time, primary_surgeon, assisting_surgeons,
        participating_staff, surgical_findings, operative_notes, complications,
        outcome, recorded_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        id,
        sur.id,
        sur.patient_id,
        input.procedurePerformed.trim(),
        input.surgeryDate,
        input.actualStartTime,
        input.actualEndTime,
        input.primarySurgeon.trim(),
        input.assistingSurgeons?.trim() ?? "",
        input.participatingStaff?.trim() ?? "",
        input.surgicalFindings.trim(),
        input.operativeNotes.trim(),
        input.complications?.trim() || "None",
        input.outcome.trim(),
        input.recordedBy || "Surgeon",
      ]
    );
  }

  // Mark surgery Completed and move OT Theatre into Cleaning
  await pool.query(
    `UPDATE ot_surgeries SET status = 'Completed', updated_at = NOW() WHERE id = $1`,
    [sur.id]
  );
  await pool.query(
    `UPDATE ot_theatres SET status = 'Cleaning', current_surgery_id = NULL, updated_at = NOW() WHERE id = $1`,
    [sur.theatre_id]
  );

  return mapSurgicalRecord(res.rows[0]);
}

// 6. Anesthesia Records
export async function saveAnesthesiaRecord(input: {
  surgeryId: string;
  anesthesiologist: string;
  anesthesiaType: string;
  preAnesthesiaAssessment: string;
  medicationsAndDosages: string;
  intraopMonitoring?: string;
  anesthesiaStartTime: string;
  anesthesiaEndTime: string;
  recoveryDetails?: string;
  observations?: string;
}) {
  if (
    !input.surgeryId ||
    !input.anesthesiologist?.trim() ||
    !input.anesthesiaType?.trim() ||
    !input.preAnesthesiaAssessment?.trim() ||
    !input.medicationsAndDosages?.trim()
  ) {
    throw new HttpError(
      "Surgery, anesthesiologist, anesthesia type, pre-anesthesia assessment, and medications/dosages are required."
    );
  }

  const pool = getPool();
  const surRes = await pool.query(
    "SELECT id, patient_id FROM ot_surgeries WHERE id = $1",
    [input.surgeryId]
  );
  if (surRes.rowCount === 0) {
    throw new HttpError(`Surgery ${input.surgeryId} not found.`, 404);
  }
  const sur = surRes.rows[0];

  const existing = await pool.query(
    "SELECT id FROM ot_anesthesia_records WHERE surgery_id = $1",
    [sur.id]
  );

  let res;
  if ((existing.rowCount ?? 0) > 0) {
    res = await pool.query(
      `UPDATE ot_anesthesia_records
       SET anesthesiologist = $2, anesthesia_type = $3, pre_anesthesia_assessment = $4,
           medications_and_dosages = $5, intraop_monitoring = $6,
           anesthesia_start_time = $7, anesthesia_end_time = $8,
           recovery_details = $9, observations = $10, updated_at = NOW()
       WHERE surgery_id = $1 RETURNING *`,
      [
        sur.id,
        input.anesthesiologist.trim(),
        input.anesthesiaType.trim(),
        input.preAnesthesiaAssessment.trim(),
        input.medicationsAndDosages.trim(),
        input.intraopMonitoring?.trim() ?? "",
        input.anesthesiaStartTime,
        input.anesthesiaEndTime,
        input.recoveryDetails?.trim() ?? "",
        input.observations?.trim() ?? "",
      ]
    );
  } else {
    const seq = await nextCounter("ot_anesthesia_record");
    const id = `ANE-${new Date().getFullYear()}-${pad(seq)}`;
    res = await pool.query(
      `INSERT INTO ot_anesthesia_records (
        id, surgery_id, patient_id, anesthesiologist, anesthesia_type,
        pre_anesthesia_assessment, medications_and_dosages, intraop_monitoring,
        anesthesia_start_time, anesthesia_end_time, recovery_details, observations
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        id,
        sur.id,
        sur.patient_id,
        input.anesthesiologist.trim(),
        input.anesthesiaType.trim(),
        input.preAnesthesiaAssessment.trim(),
        input.medicationsAndDosages.trim(),
        input.intraopMonitoring?.trim() ?? "",
        input.anesthesiaStartTime,
        input.anesthesiaEndTime,
        input.recoveryDetails?.trim() ?? "",
        input.observations?.trim() ?? "",
      ]
    );
  }

  return mapAnesthesiaRecord(res.rows[0]);
}

// 7. Post-operative Monitoring
export async function createPostOpRecord(input: {
  surgeryId: string;
  responsibleStaff: string;
  patientCondition: string;
  vitals: Record<string, string>;
  painScore: string;
  recoveryStatus: string;
  medicationsAndCare?: string;
  complications?: string;
  observations?: string;
  transferDestination: string;
}) {
  if (!input.surgeryId || !input.responsibleStaff?.trim()) {
    throw new HttpError("Surgery and responsible staff are required.");
  }

  const pool = getPool();
  const surRes = await pool.query(
    "SELECT id, patient_id FROM ot_surgeries WHERE id = $1",
    [input.surgeryId]
  );
  if (surRes.rowCount === 0) {
    throw new HttpError(`Surgery ${input.surgeryId} not found.`, 404);
  }
  const sur = surRes.rows[0];

  const oprRes = await pool.query(
    "SELECT id FROM ot_surgical_records WHERE surgery_id = $1",
    [sur.id]
  );
  const surgicalRecordId = (oprRes.rows[0]?.id as string | undefined) ?? null;

  const seq = await nextCounter("ot_postop");
  const id = `POP-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO ot_postop_monitoring (
      id, surgery_id, surgical_record_id, patient_id, responsible_staff,
      patient_condition, vitals, pain_score, recovery_status,
      medications_and_care, complications, observations, transfer_destination
    ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [
      id,
      sur.id,
      surgicalRecordId,
      sur.patient_id,
      input.responsibleStaff.trim(),
      input.patientCondition || "Recovering",
      JSON.stringify(input.vitals ?? {}),
      input.painScore || "3/10",
      input.recoveryStatus || "PACU Observation",
      input.medicationsAndCare?.trim() ?? "",
      input.complications?.trim() || "None",
      input.observations?.trim() ?? "",
      input.transferDestination || "PACU / Recovery",
    ]
  );
  return mapPostOp(res.rows[0]);
}
