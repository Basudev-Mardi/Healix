import { getPool } from "../db/client.js";
import { HttpError } from "../opd/service.js";

export type RadiologyModality = "X-ray" | "CT Scan" | "MRI" | "Ultrasound";

export interface MriScreeningInfo {
  pacemaker?: boolean;
  metalImplants?: boolean;
  claustrophobia?: boolean;
  contrastAllergy?: boolean;
  renalCleared?: boolean;
  screeningNotes?: string;
}

export interface SchedulingHistoryEntry {
  action: string;
  staff: string;
  timestamp: string;
  note: string;
}

export interface ReportHistoryEntry {
  status: string;
  staff: string;
  timestamp: string;
  note: string;
}

const VALID_MODALITIES = new Set<RadiologyModality>([
  "X-ray",
  "CT Scan",
  "MRI",
  "Ultrasound",
]);

function pad(n: number, size = 4): string {
  return String(n).padStart(size, "0");
}

async function nextCounter(key: string): Promise<number> {
  const pool = getPool();
  const res = await pool.query(
    `INSERT INTO entity_counters (counter_key, current_value)
     VALUES ($1, 1)
     ON CONFLICT (counter_key)
     DO UPDATE SET current_value = entity_counters.current_value + 1
     RETURNING current_value`,
    [key]
  );
  return Number(res.rows[0].current_value);
}

function mapEquipment(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    name: r.name as string,
    modality: r.modality as RadiologyModality,
    roomLocation: r.room_location as string,
    status: r.status as "Available" | "In Use" | "Maintenance",
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

function mapRequest(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    examinationId: r.examination_id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    modality: r.modality as RadiologyModality,
    examType: r.exam_type as string,
    bodyRegion: r.body_region as string,
    clinicalIndication: r.clinical_indication as string,
    instructions: (r.instructions as string) ?? "",
    mriScreening: (r.mri_screening as MriScreeningInfo) ?? {},
    priority: r.priority as "Routine" | "Urgent" | "STAT",
    referringDoctor: r.referring_doctor as string,
    assignedTechnician: (r.assigned_technician as string) ?? "",
    examDate: (r.exam_date as string) ?? "",
    examTime: (r.exam_time as string) ?? "",
    status: r.status as
      | "Pending"
      | "Scheduled"
      | "In Progress"
      | "Completed"
      | "Cancelled",
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

function mapAppointment(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    requestId: r.request_id as string,
    examinationId: r.examination_id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    modality: r.modality as RadiologyModality,
    examType: r.exam_type as string,
    equipmentId: r.equipment_id as string,
    equipmentName: r.equipment_name as string,
    appointmentDate: r.appointment_date as string,
    timeSlot: r.time_slot as string,
    status: r.status as
      | "Scheduled"
      | "Rescheduled"
      | "In Progress"
      | "Completed"
      | "Cancelled",
    cancelReason: (r.cancel_reason as string) ?? "",
    schedulingHistory: (r.scheduling_history as SchedulingHistoryEntry[]) ?? [],
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

function mapImage(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    requestId: r.request_id as string,
    examinationId: r.examination_id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    modality: r.modality as RadiologyModality,
    examType: r.exam_type as string,
    fileName: r.file_name as string,
    mimeType: r.mime_type as string,
    fileSizeBytes: Number(r.file_size_bytes ?? 0),
    imageDataUrl: r.image_data_url as string,
    uploadedBy: r.uploaded_by as string,
    notes: (r.notes as string) ?? "",
    uploadedAt: (r.uploaded_at as Date).toISOString(),
  };
}

function mapReport(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    requestId: r.request_id as string,
    examinationId: r.examination_id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    modality: r.modality as RadiologyModality,
    examType: r.exam_type as string,
    bodyRegion: r.body_region as string,
    referringDoctor: r.referring_doctor as string,
    imageIds: (r.image_ids as string[]) ?? [],
    findings: r.findings as string,
    observations: (r.observations as string) ?? "",
    impression: r.impression as string,
    conclusion: (r.conclusion as string) ?? "",
    radiologistName: r.radiologist_name as string,
    status: r.status as "Draft" | "Pending Verification" | "Finalized",
    reportHistory: (r.report_history as ReportHistoryEntry[]) ?? [],
    createdAt: (r.created_at as Date).toISOString(),
    finalizedAt: r.finalized_at
      ? (r.finalized_at as Date).toISOString()
      : undefined,
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

export async function getRadiologyState() {
  const pool = getPool();
  const [docRes, patRes, eqpRes, reqRes, aptRes, imgRes, rptRes] =
    await Promise.all([
      pool.query("SELECT id, name, department FROM opd_doctors ORDER BY name ASC"),
      pool.query(
        "SELECT id, full_name, date_of_birth, gender, phone, blood_group FROM patients ORDER BY created_at DESC"
      ),
      pool.query("SELECT * FROM radiology_equipment ORDER BY modality, name"),
      pool.query("SELECT * FROM radiology_requests ORDER BY created_at DESC"),
      pool.query(
        "SELECT * FROM radiology_appointments ORDER BY appointment_date DESC, time_slot ASC"
      ),
      pool.query("SELECT * FROM radiology_images ORDER BY uploaded_at DESC"),
      pool.query("SELECT * FROM radiology_reports ORDER BY updated_at DESC"),
    ]);

  return {
    doctors: docRes.rows.map((d) => ({
      id: d.id as string,
      name: d.name as string,
      department: d.department as string,
    })),
    patients: patRes.rows.map((p) => ({
      id: p.id as string,
      fullName: p.full_name as string,
      dateOfBirth: (p.date_of_birth as string) ?? "",
      gender: (p.gender as string) ?? "",
      phone: (p.phone as string) ?? "",
      bloodGroup: (p.blood_group as string) ?? "",
    })),
    equipment: eqpRes.rows.map(mapEquipment),
    requests: reqRes.rows.map(mapRequest),
    appointments: aptRes.rows.map(mapAppointment),
    images: imgRes.rows.map(mapImage),
    reports: rptRes.rows.map(mapReport),
  };
}

// 1-4. X-ray, CT Scan, MRI, Ultrasound Requests & Examinations
export async function createRadiologyRequest(input: {
  patientId: string;
  modality: RadiologyModality;
  examType: string;
  bodyRegion: string;
  clinicalIndication: string;
  instructions?: string;
  mriScreening?: MriScreeningInfo;
  priority?: "Routine" | "Urgent" | "STAT";
  referringDoctor: string;
  assignedTechnician?: string;
  examDate?: string;
  examTime?: string;
}) {
  if (
    !input.patientId ||
    !VALID_MODALITIES.has(input.modality) ||
    !input.examType?.trim() ||
    !input.bodyRegion?.trim() ||
    !input.clinicalIndication?.trim() ||
    !input.referringDoctor?.trim()
  ) {
    throw new HttpError(
      "Patient, valid modality, examination type, body region, clinical indication, and referring doctor are required."
    );
  }

  if (input.modality === "MRI") {
    const s = input.mriScreening ?? {};
    if (s.pacemaker) {
      throw new HttpError(
        "MRI Safety Block: Patient has a pacemaker flagged in screening. Consult Radiology Safety Officer before ordering."
      );
    }
  }

  const pool = getPool();
  const patRes = await pool.query(
    "SELECT id, full_name FROM patients WHERE id = $1",
    [input.patientId]
  );
  if (patRes.rowCount === 0) {
    throw new HttpError(`Patient ${input.patientId} not found.`, 404);
  }

  const reqSeq = await nextCounter("radiology_request");
  const examSeq = await nextCounter("radiology_exam");
  const year = new Date().getFullYear();
  const id = `RAD-${year}-${pad(reqSeq)}`;
  const examinationId = `EXM-${year}-${pad(examSeq)}`;

  const res = await pool.query(
    `INSERT INTO radiology_requests (
      id, examination_id, patient_id, patient_name, modality, exam_type, body_region,
      clinical_indication, instructions, mri_screening, priority, referring_doctor,
      assigned_technician, exam_date, exam_time, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,'Pending')
    RETURNING *`,
    [
      id,
      examinationId,
      patRes.rows[0].id,
      patRes.rows[0].full_name,
      input.modality,
      input.examType.trim(),
      input.bodyRegion.trim(),
      input.clinicalIndication.trim(),
      input.instructions?.trim() ?? "",
      JSON.stringify(input.mriScreening ?? {}),
      input.priority ?? "Routine",
      input.referringDoctor.trim(),
      input.assignedTechnician?.trim() ?? "",
      input.examDate?.trim() ?? "",
      input.examTime?.trim() ?? "",
    ]
  );

  return mapRequest(res.rows[0]);
}

export async function updateRadiologyRequest(input: {
  requestId: string;
  status?: "Pending" | "Scheduled" | "In Progress" | "Completed" | "Cancelled";
  assignedTechnician?: string;
  examDate?: string;
  examTime?: string;
  instructions?: string;
  mriScreening?: MriScreeningInfo;
}) {
  if (!input.requestId) {
    throw new HttpError("requestId is required.");
  }

  const pool = getPool();
  const curRes = await pool.query(
    "SELECT * FROM radiology_requests WHERE id = $1",
    [input.requestId]
  );
  if (curRes.rowCount === 0) {
    throw new HttpError(`Radiology request ${input.requestId} not found.`, 404);
  }

  const res = await pool.query(
    `UPDATE radiology_requests
     SET status = COALESCE($2, status),
         assigned_technician = COALESCE($3, assigned_technician),
         exam_date = COALESCE($4, exam_date),
         exam_time = COALESCE($5, exam_time),
         instructions = COALESCE($6, instructions),
         mri_screening = COALESCE($7::jsonb, mri_screening),
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      input.requestId,
      input.status ?? null,
      input.assignedTechnician !== undefined
        ? input.assignedTechnician.trim()
        : null,
      input.examDate !== undefined ? input.examDate.trim() : null,
      input.examTime !== undefined ? input.examTime.trim() : null,
      input.instructions !== undefined ? input.instructions.trim() : null,
      input.mriScreening !== undefined
        ? JSON.stringify(input.mriScreening)
        : null,
    ]
  );

  // Sync active appointment status when exam starts or completes
  if (input.status === "In Progress" || input.status === "Completed") {
    await pool.query(
      `UPDATE radiology_appointments
       SET status = $2, updated_at = NOW()
       WHERE request_id = $1 AND status <> 'Cancelled'`,
      [input.requestId, input.status]
    );
  }

  return mapRequest(res.rows[0]);
}

// 5. Imaging Appointments (Conflict prevention, rescheduling, cancellation, history)
export async function createImagingAppointment(input: {
  requestId: string;
  equipmentId: string;
  appointmentDate: string;
  timeSlot: string;
  staff: string;
  note?: string;
}) {
  if (
    !input.requestId ||
    !input.equipmentId ||
    !input.appointmentDate?.trim() ||
    !input.timeSlot?.trim()
  ) {
    throw new HttpError(
      "Imaging request, equipment, date, and time slot are required."
    );
  }

  const pool = getPool();
  const [reqRes, eqpRes] = await Promise.all([
    pool.query("SELECT * FROM radiology_requests WHERE id = $1", [
      input.requestId,
    ]),
    pool.query("SELECT * FROM radiology_equipment WHERE id = $1", [
      input.equipmentId,
    ]),
  ]);

  if (reqRes.rowCount === 0) {
    throw new HttpError(`Radiology request ${input.requestId} not found.`, 404);
  }
  if (eqpRes.rowCount === 0) {
    throw new HttpError(`Equipment ${input.equipmentId} not found.`, 404);
  }

  const req = mapRequest(reqRes.rows[0]);
  const eqp = mapEquipment(eqpRes.rows[0]);

  if (req.status === "Cancelled") {
    throw new HttpError("Cannot schedule an appointment for a cancelled request.");
  }
  if (eqp.status === "Maintenance") {
    throw new HttpError(
      `Equipment "${eqp.name}" is currently under Maintenance.`,
      409
    );
  }
  if (eqp.modality !== req.modality) {
    throw new HttpError(
      `Modality mismatch: ${req.modality} request cannot be booked on ${eqp.modality} equipment (${eqp.name}).`,
      400
    );
  }

  // Check equipment double-booking conflict
  const conflict = await pool.query(
    `SELECT id, patient_name FROM radiology_appointments
     WHERE equipment_id = $1
       AND appointment_date = $2
       AND time_slot = $3
       AND status <> 'Cancelled'`,
    [eqp.id, input.appointmentDate.trim(), input.timeSlot.trim()]
  );
  if ((conflict.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Scheduling conflict: ${eqp.name} is already booked on ${input.appointmentDate} at ${input.timeSlot} (${conflict.rows[0].id}).`,
      409
    );
  }

  // Prevent duplicate active appointment for the same request
  const existingForReq = await pool.query(
    `SELECT id FROM radiology_appointments
     WHERE request_id = $1 AND status <> 'Cancelled'`,
    [req.id]
  );
  if ((existingForReq.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Request ${req.id} already has active appointment ${existingForReq.rows[0].id}. Use Reschedule instead.`,
      409
    );
  }

  const seq = await nextCounter("radiology_appointment");
  const id = `RAPT-${new Date().getFullYear()}-${pad(seq)}`;
  const history: SchedulingHistoryEntry[] = [
    {
      action: "Scheduled",
      staff: input.staff || "Radiology Technician",
      timestamp: new Date().toISOString(),
      note:
        input.note?.trim() ||
        `Booked on ${eqp.name} for ${input.appointmentDate} at ${input.timeSlot}`,
    },
  ];

  const res = await pool.query(
    `INSERT INTO radiology_appointments (
      id, request_id, examination_id, patient_id, patient_name, modality, exam_type,
      equipment_id, equipment_name, appointment_date, time_slot, status, scheduling_history
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Scheduled',$12::jsonb)
    RETURNING *`,
    [
      id,
      req.id,
      req.examinationId,
      req.patientId,
      req.patientName,
      req.modality,
      req.examType,
      eqp.id,
      eqp.name,
      input.appointmentDate.trim(),
      input.timeSlot.trim(),
      JSON.stringify(history),
    ]
  );

  await pool.query(
    `UPDATE radiology_requests
     SET status = CASE WHEN status = 'Pending' THEN 'Scheduled' ELSE status END,
         exam_date = $2,
         exam_time = $3,
         updated_at = NOW()
     WHERE id = $1`,
    [req.id, input.appointmentDate.trim(), input.timeSlot.trim()]
  );

  return mapAppointment(res.rows[0]);
}

export async function updateImagingAppointment(input: {
  appointmentId: string;
  action: "reschedule" | "cancel";
  equipmentId?: string;
  appointmentDate?: string;
  timeSlot?: string;
  cancelReason?: string;
  staff: string;
}) {
  const pool = getPool();
  const curRes = await pool.query(
    "SELECT * FROM radiology_appointments WHERE id = $1",
    [input.appointmentId]
  );
  if (curRes.rowCount === 0) {
    throw new HttpError(
      `Imaging appointment ${input.appointmentId} not found.`,
      404
    );
  }
  const cur = mapAppointment(curRes.rows[0]);
  if (cur.status === "Completed") {
    throw new HttpError("Completed appointments cannot be modified.", 409);
  }

  if (input.action === "cancel") {
    const reason = input.cancelReason?.trim() || "Cancelled by staff";
    const history: SchedulingHistoryEntry[] = [
      ...cur.schedulingHistory,
      {
        action: "Cancelled",
        staff: input.staff || "Radiology Technician",
        timestamp: new Date().toISOString(),
        note: reason,
      },
    ];
    const res = await pool.query(
      `UPDATE radiology_appointments
       SET status = 'Cancelled',
           cancel_reason = $2,
           scheduling_history = $3::jsonb,
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [cur.id, reason, JSON.stringify(history)]
    );
    await pool.query(
      `UPDATE radiology_requests
       SET status = CASE WHEN status = 'Scheduled' THEN 'Pending' ELSE status END,
           updated_at = NOW()
       WHERE id = $1`,
      [cur.requestId]
    );
    return mapAppointment(res.rows[0]);
  }

  // Reschedule
  const nextEquipmentId = input.equipmentId || cur.equipmentId;
  const nextDate = input.appointmentDate?.trim() || cur.appointmentDate;
  const nextSlot = input.timeSlot?.trim() || cur.timeSlot;

  const eqpRes = await pool.query(
    "SELECT * FROM radiology_equipment WHERE id = $1",
    [nextEquipmentId]
  );
  if (eqpRes.rowCount === 0) {
    throw new HttpError(`Equipment ${nextEquipmentId} not found.`, 404);
  }
  const eqp = mapEquipment(eqpRes.rows[0]);
  if (eqp.modality !== cur.modality) {
    throw new HttpError(
      `Cannot reschedule ${cur.modality} appointment onto ${eqp.modality} equipment.`,
      400
    );
  }
  if (eqp.status === "Maintenance") {
    throw new HttpError(`Equipment "${eqp.name}" is under Maintenance.`, 409);
  }

  const conflict = await pool.query(
    `SELECT id FROM radiology_appointments
     WHERE equipment_id = $1
       AND appointment_date = $2
       AND time_slot = $3
       AND status <> 'Cancelled'
       AND id <> $4`,
    [eqp.id, nextDate, nextSlot, cur.id]
  );
  if ((conflict.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Scheduling conflict: ${eqp.name} is already booked on ${nextDate} at ${nextSlot} (${conflict.rows[0].id}).`,
      409
    );
  }

  const history: SchedulingHistoryEntry[] = [
    ...cur.schedulingHistory,
    {
      action: "Rescheduled",
      staff: input.staff || "Radiology Technician",
      timestamp: new Date().toISOString(),
      note: `Moved to ${eqp.name} on ${nextDate} at ${nextSlot}`,
    },
  ];

  const res = await pool.query(
    `UPDATE radiology_appointments
     SET equipment_id = $2,
         equipment_name = $3,
         appointment_date = $4,
         time_slot = $5,
         status = 'Rescheduled',
         scheduling_history = $6::jsonb,
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [cur.id, eqp.id, eqp.name, nextDate, nextSlot, JSON.stringify(history)]
  );

  await pool.query(
    `UPDATE radiology_requests
     SET exam_date = $2, exam_time = $3, updated_at = NOW()
     WHERE id = $1`,
    [cur.requestId, nextDate, nextSlot]
  );

  return mapAppointment(res.rows[0]);
}

// 6. Image Storage
export async function uploadRadiologyImage(input: {
  requestId: string;
  fileName: string;
  mimeType?: string;
  fileSizeBytes?: number;
  imageDataUrl: string;
  uploadedBy: string;
  notes?: string;
}) {
  if (
    !input.requestId ||
    !input.fileName?.trim() ||
    !input.imageDataUrl?.trim()
  ) {
    throw new HttpError(
      "Radiology request, file name, and image data are required."
    );
  }

  if (input.imageDataUrl.length > 3_500_000) {
    throw new HttpError(
      "Image exceeds maximum inline storage size (2.5 MB). Please upload a compressed image.",
      400
    );
  }

  const pool = getPool();
  const reqRes = await pool.query(
    "SELECT * FROM radiology_requests WHERE id = $1",
    [input.requestId]
  );
  if (reqRes.rowCount === 0) {
    throw new HttpError(`Radiology request ${input.requestId} not found.`, 404);
  }
  const req = mapRequest(reqRes.rows[0]);

  const seq = await nextCounter("radiology_image");
  const id = `IMG-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO radiology_images (
      id, request_id, examination_id, patient_id, patient_name, modality, exam_type,
      file_name, mime_type, file_size_bytes, image_data_url, uploaded_by, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *`,
    [
      id,
      req.id,
      req.examinationId,
      req.patientId,
      req.patientName,
      req.modality,
      req.examType,
      input.fileName.trim(),
      input.mimeType?.trim() || "image/png",
      Number(input.fileSizeBytes ?? input.imageDataUrl.length),
      input.imageDataUrl,
      input.uploadedBy?.trim() || "Radiology Technician",
      input.notes?.trim() ?? "",
    ]
  );

  return mapImage(res.rows[0]);
}

// 7. Radiologist Reports (Draft -> Pending Verification -> Finalized; Finalized locked)
export async function saveRadiologistReport(input: {
  requestId: string;
  findings: string;
  observations?: string;
  impression: string;
  conclusion?: string;
  radiologistName: string;
  status?: "Draft" | "Pending Verification" | "Finalized";
  canFinalize: boolean;
}) {
  if (
    !input.requestId ||
    !input.findings?.trim() ||
    !input.impression?.trim() ||
    !input.radiologistName?.trim()
  ) {
    throw new HttpError(
      "Radiology request, findings, impression, and radiologist name are required."
    );
  }

  const targetStatus = input.status ?? "Draft";
  if (targetStatus === "Finalized" && !input.canFinalize) {
    throw new HttpError(
      "Access denied: your role cannot finalize radiologist reports.",
      403
    );
  }

  const pool = getPool();
  const [reqRes, imgRes, existingRes] = await Promise.all([
    pool.query("SELECT * FROM radiology_requests WHERE id = $1", [
      input.requestId,
    ]),
    pool.query(
      "SELECT id FROM radiology_images WHERE request_id = $1 ORDER BY uploaded_at ASC",
      [input.requestId]
    ),
    pool.query("SELECT * FROM radiology_reports WHERE request_id = $1", [
      input.requestId,
    ]),
  ]);

  if (reqRes.rowCount === 0) {
    throw new HttpError(`Radiology request ${input.requestId} not found.`, 404);
  }
  const req = mapRequest(reqRes.rows[0]);
  const imageIds = imgRes.rows.map((r) => r.id as string);

  if (targetStatus === "Finalized" && imageIds.length === 0) {
    throw new HttpError(
      "Cannot finalize report: at least one stored radiology image must be linked to this examination.",
      400
    );
  }

  if ((existingRes.rowCount ?? 0) > 0) {
    const existing = mapReport(existingRes.rows[0]);
    if (existing.status === "Finalized") {
      throw new HttpError(
        `Report ${existing.id} is already Finalized and locked against modification.`,
        409
      );
    }

    const history: ReportHistoryEntry[] = [
      ...existing.reportHistory,
      {
        status: targetStatus,
        staff: input.radiologistName.trim(),
        timestamp: new Date().toISOString(),
        note:
          targetStatus === "Finalized"
            ? "Report finalized and signed"
            : `Updated report (${targetStatus})`,
      },
    ];

    const res = await pool.query(
      `UPDATE radiology_reports
       SET image_ids = $2,
           findings = $3,
           observations = $4,
           impression = $5,
           conclusion = $6,
           radiologist_name = $7,
           status = $8,
           report_history = $9::jsonb,
           finalized_at = CASE WHEN $8 = 'Finalized' THEN NOW() ELSE finalized_at END,
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        existing.id,
        imageIds,
        input.findings.trim(),
        input.observations?.trim() ?? "",
        input.impression.trim(),
        input.conclusion?.trim() ?? "",
        input.radiologistName.trim(),
        targetStatus,
        JSON.stringify(history),
      ]
    );

    if (targetStatus === "Finalized") {
      await pool.query(
        `UPDATE radiology_requests SET status = 'Completed', updated_at = NOW() WHERE id = $1`,
        [req.id]
      );
    }

    return mapReport(res.rows[0]);
  }

  const seq = await nextCounter("radiology_report");
  const id = `RADR-${new Date().getFullYear()}-${pad(seq)}`;
  const history: ReportHistoryEntry[] = [
    {
      status: targetStatus,
      staff: input.radiologistName.trim(),
      timestamp: new Date().toISOString(),
      note:
        targetStatus === "Finalized"
          ? "Report created and finalized"
          : `Created report (${targetStatus})`,
    },
  ];

  const res = await pool.query(
    `INSERT INTO radiology_reports (
      id, request_id, examination_id, patient_id, patient_name, modality, exam_type,
      body_region, referring_doctor, image_ids, findings, observations, impression,
      conclusion, radiologist_name, status, report_history, finalized_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,
      CASE WHEN $16 = 'Finalized' THEN NOW() ELSE NULL END
    ) RETURNING *`,
    [
      id,
      req.id,
      req.examinationId,
      req.patientId,
      req.patientName,
      req.modality,
      req.examType,
      req.bodyRegion,
      req.referringDoctor,
      imageIds,
      input.findings.trim(),
      input.observations?.trim() ?? "",
      input.impression.trim(),
      input.conclusion?.trim() ?? "",
      input.radiologistName.trim(),
      targetStatus,
      JSON.stringify(history),
    ]
  );

  if (targetStatus === "Finalized") {
    await pool.query(
      `UPDATE radiology_requests SET status = 'Completed', updated_at = NOW() WHERE id = $1`,
      [req.id]
    );
  }

  return mapReport(res.rows[0]);
}
