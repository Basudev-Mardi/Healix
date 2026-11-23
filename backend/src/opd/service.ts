import { getPool, nextCounter } from "../db/client.js";

export class HttpError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function pad(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function mapPatient(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    fullName: r.full_name as string,
    dateOfBirth: r.date_of_birth as string,
    gender: r.gender as string,
    phone: r.phone as string,
    email: r.email as string,
    address: r.address as string,
    bloodGroup: r.blood_group as string,
    emergencyContactName: r.emergency_contact_name as string,
    emergencyContactPhone: r.emergency_contact_phone as string,
    allergies: r.allergies as string,
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

function mapDoctor(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    name: r.name as string,
    department: r.department as string,
    specialization: r.specialization as string,
    room: r.room as string,
    availableDays: r.available_days as number[],
    slots: r.slots as string[],
  };
}

function mapAppointment(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    department: r.department as string,
    doctorId: r.doctor_id as string,
    date: r.appointment_date as string,
    timeSlot: r.time_slot as string,
    visitType: r.visit_type as string,
    priority: r.priority as string,
    reason: r.reason as string,
    status: r.status as string,
    tokenId: (r.token_id as string | null) ?? undefined,
    originalConsultationId:
      (r.original_consultation_id as string | null) ?? undefined,
    cancelReason: (r.cancel_reason as string | null) ?? undefined,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapToken(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    tokenNumber: r.token_number as string,
    sequence: Number(r.sequence),
    date: r.token_date as string,
    patientId: r.patient_id as string,
    doctorId: r.doctor_id as string,
    department: r.department as string,
    appointmentId: r.appointment_id as string,
    visitType: r.visit_type as string,
    priority: r.priority as string,
    status: r.status as string,
    calledAt: r.called_at ? new Date(r.called_at as string).toISOString() : undefined,
    startedAt: r.started_at ? new Date(r.started_at as string).toISOString() : undefined,
    completedAt: r.completed_at
      ? new Date(r.completed_at as string).toISOString()
      : undefined,
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

function mapConsultation(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    doctorId: r.doctor_id as string,
    department: r.department as string,
    appointmentId: r.appointment_id as string,
    tokenId: r.token_id as string,
    visitDate: r.visit_date as string,
    vitals: r.vitals as {
      bloodPressure: string;
      temperature: string;
      pulse: string;
      spo2: string;
    },
    symptoms: r.symptoms as string,
    observations: r.observations as string,
    diagnosis: r.diagnosis as string,
    clinicalNotes: r.clinical_notes as string,
    treatment: r.treatment as string,
    status: r.status as string,
    followUpId: (r.follow_up_id as string | null) ?? undefined,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapFollowUp(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    originalConsultationId: r.original_consultation_id as string,
    originalAppointmentId: r.original_appointment_id as string,
    followUpAppointmentId: r.follow_up_appointment_id as string,
    patientId: r.patient_id as string,
    doctorId: r.doctor_id as string,
    department: r.department as string,
    scheduledDate: r.scheduled_date as string,
    timeSlot: r.time_slot as string,
    instructions: r.instructions as string,
    status: r.status as string,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

export async function getOpdState() {
  const pool = getPool();
  const [doctorsRes, patientsRes, apptsRes, tokensRes, consRes, fupsRes] =
    await Promise.all([
      pool.query("SELECT * FROM opd_doctors ORDER BY id ASC"),
      pool.query(
        "SELECT * FROM patients WHERE is_unknown = FALSE ORDER BY created_at DESC"
      ),
      pool.query("SELECT * FROM opd_appointments ORDER BY created_at DESC"),
      pool.query("SELECT * FROM opd_tokens ORDER BY sequence ASC"),
      pool.query("SELECT * FROM opd_consultations ORDER BY created_at DESC"),
      pool.query("SELECT * FROM opd_follow_ups ORDER BY created_at DESC"),
    ]);

  return {
    doctors: doctorsRes.rows.map(mapDoctor),
    patients: patientsRes.rows.map(mapPatient),
    appointments: apptsRes.rows.map(mapAppointment),
    tokens: tokensRes.rows.map(mapToken),
    consultations: consRes.rows.map(mapConsultation),
    followUps: fupsRes.rows.map(mapFollowUp),
  };
}

export async function searchPatients(q: string) {
  const pool = getPool();
  if (!q.trim()) {
    const res = await pool.query(
      "SELECT * FROM patients WHERE is_unknown = FALSE ORDER BY created_at DESC"
    );
    return res.rows.map(mapPatient);
  }
  const like = `%${q.trim().toLowerCase()}%`;
  const res = await pool.query(
    `SELECT * FROM patients
     WHERE is_unknown = FALSE
       AND (LOWER(id) LIKE $1 OR LOWER(full_name) LIKE $1 OR LOWER(phone) LIKE $1)
     ORDER BY created_at DESC`,
    [like]
  );
  return res.rows.map(mapPatient);
}

export async function registerPatient(input: {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
}) {
  const fullName = input.fullName?.trim();
  const dateOfBirth = input.dateOfBirth?.trim();
  const phone = input.phone?.trim();
  const gender = input.gender?.trim();

  if (!fullName || !dateOfBirth || !phone || !gender) {
    throw new HttpError(
      "Full name, date of birth, gender, and phone number are required."
    );
  }

  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length < 7) {
    throw new HttpError("Enter a valid contact phone number.");
  }

  const pool = getPool();
  const existingRes = await pool.query(
    "SELECT * FROM patients WHERE is_unknown = FALSE"
  );
  const duplicate = existingRes.rows.find(
    (p) =>
      normalizePhone(p.phone as string) === normalizedPhone ||
      (normalizeText(p.full_name as string) === normalizeText(fullName) &&
        p.date_of_birth === dateOfBirth)
  );

  if (duplicate) {
    throw new HttpError(
      `Duplicate patient detected: ${duplicate.full_name} is already registered with ID ${duplicate.id}.`,
      409,
      { existingPatient: mapPatient(duplicate) }
    );
  }

  const seq = await nextCounter("patient");
  const id = `PAT-${new Date().getFullYear()}-${pad(seq)}`;
  const res = await pool.query(
    `INSERT INTO patients (
      id, full_name, date_of_birth, gender, phone, email, address,
      blood_group, emergency_contact_name, emergency_contact_phone, allergies
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      id,
      fullName,
      dateOfBirth,
      gender,
      phone,
      input.email?.trim() ?? "",
      input.address?.trim() ?? "",
      input.bloodGroup?.trim() || "Unknown",
      input.emergencyContactName?.trim() ?? "",
      input.emergencyContactPhone?.trim() ?? "",
      input.allergies?.trim() || "None",
    ]
  );
  return mapPatient(res.rows[0]);
}

export async function createAppointment(input: {
  patientId: string;
  department: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  reason?: string;
  priority?: string;
  visitType?: string;
  originalConsultationId?: string;
}) {
  const { patientId, department, doctorId, date, timeSlot } = input;
  if (!patientId || !department || !doctorId || !date || !timeSlot) {
    throw new HttpError(
      "Patient, department, doctor, date, and time slot are required."
    );
  }

  const pool = getPool();
  const [patRes, docRes] = await Promise.all([
    pool.query("SELECT id FROM patients WHERE id = $1", [patientId]),
    pool.query("SELECT * FROM opd_doctors WHERE id = $1", [doctorId]),
  ]);

  if (patRes.rowCount === 0) {
    throw new HttpError(`Patient ${patientId} not found.`, 404);
  }
  if (docRes.rowCount === 0) {
    throw new HttpError(`Doctor ${doctorId} not found.`, 404);
  }

  const doctor = mapDoctor(docRes.rows[0]);
  if (doctor.department !== department) {
    throw new HttpError(
      `${doctor.name} belongs to ${doctor.department}, not ${department}.`
    );
  }
  if (!doctor.slots.includes(timeSlot)) {
    throw new HttpError(
      `Time slot ${timeSlot} is outside ${doctor.name}'s OPD schedule.`
    );
  }

  const conflictRes = await pool.query(
    `SELECT id FROM opd_appointments
     WHERE doctor_id = $1 AND appointment_date = $2 AND time_slot = $3 AND status <> 'Cancelled'`,
    [doctorId, date, timeSlot]
  );
  if ((conflictRes.rowCount ?? 0) > 0) {
    throw new HttpError(
      `${doctor.name} already has a booking on ${date} at ${timeSlot} (${conflictRes.rows[0].id}).`,
      409
    );
  }

  const seq = await nextCounter("opd_appointment");
  const id = `APT-${new Date().getFullYear()}-${pad(seq)}`;
  const res = await pool.query(
    `INSERT INTO opd_appointments (
      id, patient_id, department, doctor_id, appointment_date, time_slot,
      visit_type, priority, reason, status, original_consultation_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Scheduled',$10)
    RETURNING *`,
    [
      id,
      patientId,
      department,
      doctorId,
      date,
      timeSlot,
      input.visitType ?? "Appointment",
      input.priority ?? "Normal",
      input.reason?.trim() || "OPD Consultation",
      input.originalConsultationId ?? null,
    ]
  );
  return mapAppointment(res.rows[0]);
}

export async function updateAppointment(
  appointmentId: string,
  input: {
    action: "reschedule" | "cancel";
    date?: string;
    timeSlot?: string;
    doctorId?: string;
    cancelReason?: string;
  }
) {
  const pool = getPool();
  const aptRes = await pool.query(
    "SELECT * FROM opd_appointments WHERE id = $1",
    [appointmentId]
  );
  if (aptRes.rowCount === 0) {
    throw new HttpError(`Appointment ${appointmentId} not found.`, 404);
  }
  const apt = aptRes.rows[0];
  if (apt.status === "Completed") {
    throw new HttpError("Completed appointments cannot be modified.");
  }

  if (input.action === "cancel") {
    const updated = await pool.query(
      `UPDATE opd_appointments
       SET status = 'Cancelled', cancel_reason = $2, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [appointmentId, input.cancelReason?.trim() || "Cancelled by staff"]
    );
    if (apt.token_id) {
      await pool.query(
        `UPDATE opd_tokens SET status = 'Cancelled'
         WHERE id = $1 AND status <> 'Completed'`,
        [apt.token_id]
      );
    }
    await pool.query(
      `UPDATE opd_follow_ups SET status = 'Cancelled', updated_at = NOW()
       WHERE follow_up_appointment_id = $1 AND status <> 'Completed'`,
      [appointmentId]
    );
    return mapAppointment(updated.rows[0]);
  }

  const newDate = input.date?.trim() || (apt.appointment_date as string);
  const newSlot = input.timeSlot?.trim() || (apt.time_slot as string);
  const newDoctorId = input.doctorId?.trim() || (apt.doctor_id as string);

  const docRes = await pool.query("SELECT * FROM opd_doctors WHERE id = $1", [
    newDoctorId,
  ]);
  if (docRes.rowCount === 0) {
    throw new HttpError(`Doctor ${newDoctorId} not found.`, 404);
  }
  const doctor = mapDoctor(docRes.rows[0]);
  if (!doctor.slots.includes(newSlot)) {
    throw new HttpError(
      `Time slot ${newSlot} is not in ${doctor.name}'s schedule.`
    );
  }

  const conflictRes = await pool.query(
    `SELECT id FROM opd_appointments
     WHERE id <> $1 AND doctor_id = $2 AND appointment_date = $3 AND time_slot = $4 AND status <> 'Cancelled'`,
    [appointmentId, newDoctorId, newDate, newSlot]
  );
  if ((conflictRes.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Conflict: ${doctor.name} is already booked on ${newDate} at ${newSlot}.`,
      409
    );
  }

  const updated = await pool.query(
    `UPDATE opd_appointments
     SET doctor_id = $2, department = $3, appointment_date = $4, time_slot = $5, status = 'Rescheduled', updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [appointmentId, newDoctorId, doctor.department, newDate, newSlot]
  );

  await pool.query(
    `UPDATE opd_follow_ups
     SET doctor_id = $2, department = $3, scheduled_date = $4, time_slot = $5, updated_at = NOW()
     WHERE follow_up_appointment_id = $1`,
    [appointmentId, newDoctorId, doctor.department, newDate, newSlot]
  );

  return mapAppointment(updated.rows[0]);
}

export async function generateTokenForAppointment(
  appointmentId: string,
  priorityOverride?: string
) {
  const pool = getPool();
  const aptRes = await pool.query(
    "SELECT * FROM opd_appointments WHERE id = $1",
    [appointmentId]
  );
  if (aptRes.rowCount === 0) {
    throw new HttpError(`Appointment ${appointmentId} not found.`, 404);
  }
  const apt = aptRes.rows[0];
  if (apt.status === "Cancelled" || apt.status === "Completed") {
    throw new HttpError(
      `Cannot generate token for a ${(apt.status as string).toLowerCase()} appointment.`
    );
  }

  const activeTokenRes = await pool.query(
    `SELECT token_number FROM opd_tokens
     WHERE appointment_id = $1 AND status NOT IN ('Cancelled','Completed')`,
    [appointmentId]
  );
  if ((activeTokenRes.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Active token ${activeTokenRes.rows[0].token_number} already exists for appointment ${appointmentId}.`,
      409
    );
  }

  const seq = await nextCounter("opd_token");
  const tokenId = `TKN-${new Date().getFullYear()}-${pad(seq)}`;
  const tokenNumber = `OPD-${pad(seq, 3)}`;

  const tokenRes = await pool.query(
    `INSERT INTO opd_tokens (
      id, token_number, sequence, token_date, patient_id, doctor_id, department,
      appointment_id, visit_type, priority, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Waiting')
    RETURNING *`,
    [
      tokenId,
      tokenNumber,
      seq,
      apt.appointment_date,
      apt.patient_id,
      apt.doctor_id,
      apt.department,
      apt.id,
      apt.visit_type,
      priorityOverride ?? apt.priority,
    ]
  );

  const updatedAptRes = await pool.query(
    `UPDATE opd_appointments SET token_id = $2, status = 'Checked In', updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [appointmentId, tokenId]
  );

  await pool.query(
    `UPDATE opd_follow_ups SET status = 'Checked In', updated_at = NOW()
     WHERE follow_up_appointment_id = $1 AND status = 'Upcoming'`,
    [appointmentId]
  );

  return {
    token: mapToken(tokenRes.rows[0]),
    appointment: mapAppointment(updatedAptRes.rows[0]),
  };
}

export async function registerWalkIn(input: {
  existingPatientId?: string;
  newPatient?: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    bloodGroup?: string;
    allergies?: string;
  };
  department: string;
  doctorId: string;
  priority?: string;
  reason?: string;
}) {
  if (!input.department || !input.doctorId) {
    throw new HttpError("Department and doctor are required for walk-in.");
  }

  const pool = getPool();
  let patient;
  if (input.existingPatientId) {
    const patRes = await pool.query("SELECT * FROM patients WHERE id = $1", [
      input.existingPatientId,
    ]);
    if (patRes.rowCount === 0) {
      throw new HttpError(`Patient ${input.existingPatientId} not found.`, 404);
    }
    patient = mapPatient(patRes.rows[0]);
  } else if (input.newPatient) {
    patient = await registerPatient(input.newPatient);
  } else {
    throw new HttpError("Select an existing patient or provide new patient details.");
  }

  const docRes = await pool.query("SELECT * FROM opd_doctors WHERE id = $1", [
    input.doctorId,
  ]);
  if (docRes.rowCount === 0) {
    throw new HttpError(`Doctor ${input.doctorId} not found.`, 404);
  }
  const doctor = mapDoctor(docRes.rows[0]);
  if (doctor.department !== input.department) {
    throw new HttpError(
      `${doctor.name} belongs to ${doctor.department}, not ${input.department}.`
    );
  }

  const now = new Date();
  const today = todayIso();
  const walkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  const aptSeq = await nextCounter("opd_appointment");
  const tknSeq = await nextCounter("opd_token");
  const year = now.getFullYear();
  const appointmentId = `APT-${year}-${pad(aptSeq)}`;
  const tokenId = `TKN-${year}-${pad(tknSeq)}`;
  const tokenNumber = `OPD-${pad(tknSeq, 3)}`;
  const priority = input.priority ?? "Normal";

  const aptRes = await pool.query(
    `INSERT INTO opd_appointments (
      id, patient_id, department, doctor_id, appointment_date, time_slot,
      visit_type, priority, reason, status, token_id
    ) VALUES ($1,$2,$3,$4,$5,$6,'Walk-in',$7,$8,'Checked In',$9)
    RETURNING *`,
    [
      appointmentId,
      patient.id,
      input.department,
      input.doctorId,
      today,
      walkInTime,
      priority,
      input.reason?.trim() || "Walk-in OPD Visit",
      tokenId,
    ]
  );

  const tokenRes = await pool.query(
    `INSERT INTO opd_tokens (
      id, token_number, sequence, token_date, patient_id, doctor_id, department,
      appointment_id, visit_type, priority, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Walk-in',$9,'Waiting')
    RETURNING *`,
    [
      tokenId,
      tokenNumber,
      tknSeq,
      today,
      patient.id,
      input.doctorId,
      input.department,
      appointmentId,
      priority,
    ]
  );

  return {
    patient,
    appointment: mapAppointment(aptRes.rows[0]),
    token: mapToken(tokenRes.rows[0]),
  };
}

export async function updateQueueToken(input: {
  action: "call-next" | "call" | "start" | "skip" | "requeue" | "complete";
  tokenId?: string;
  doctorId?: string;
}) {
  const pool = getPool();
  let targetId = input.tokenId;

  if (input.action === "call-next") {
    const waitingRes = await pool.query(
      `SELECT id FROM opd_tokens
       WHERE status = 'Waiting' AND ($1::text IS NULL OR doctor_id = $1)
       ORDER BY
         CASE priority WHEN 'Urgent' THEN 0 WHEN 'Priority' THEN 1 ELSE 2 END ASC,
         sequence ASC
       LIMIT 1`,
      [input.doctorId ?? null]
    );
    if (waitingRes.rowCount === 0) {
      throw new HttpError("No waiting patients in the selected queue.", 404);
    }
    targetId = waitingRes.rows[0].id as string;
  }

  if (!targetId) {
    throw new HttpError("Token ID is required for this queue action.");
  }

  const nextStatusMap: Record<typeof input.action, string> = {
    "call-next": "Called",
    call: "Called",
    start: "In Consultation",
    skip: "Skipped",
    requeue: "Waiting",
    complete: "Completed",
  };
  const nextStatus = nextStatusMap[input.action];

  const tknRes = await pool.query(
    `UPDATE opd_tokens
     SET status = $2,
         called_at = CASE WHEN $2 = 'Called' THEN NOW() ELSE called_at END,
         started_at = CASE WHEN $2 = 'In Consultation' THEN NOW() ELSE started_at END,
         completed_at = CASE WHEN $2 = 'Completed' THEN NOW() ELSE completed_at END
     WHERE id = $1
     RETURNING *`,
    [targetId, nextStatus]
  );
  if (tknRes.rowCount === 0) {
    throw new HttpError(`Token ${targetId} not found.`, 404);
  }
  const token = mapToken(tknRes.rows[0]);

  const aptStatusMap: Record<string, string> = {
    Waiting: "Checked In",
    Called: "Checked In",
    "In Consultation": "In Consultation",
    Completed: "Completed",
  };
  if (aptStatusMap[nextStatus]) {
    await pool.query(
      `UPDATE opd_appointments SET status = $2, updated_at = NOW() WHERE id = $1`,
      [token.appointmentId, aptStatusMap[nextStatus]]
    );
  }
  if (nextStatus === "Completed") {
    await pool.query(
      `UPDATE opd_follow_ups SET status = 'Completed', updated_at = NOW()
       WHERE follow_up_appointment_id = $1`,
      [token.appointmentId]
    );
  }

  return token;
}

export async function saveConsultation(input: {
  tokenId: string;
  vitals?: {
    bloodPressure?: string;
    temperature?: string;
    pulse?: string;
    spo2?: string;
  };
  symptoms: string;
  observations?: string;
  diagnosis: string;
  clinicalNotes?: string;
  treatment: string;
  status: "In Progress" | "Completed";
}) {
  if (!input.tokenId) {
    throw new HttpError("Token ID is required to record a consultation.");
  }
  if (!input.symptoms?.trim() || !input.diagnosis?.trim() || !input.treatment?.trim()) {
    throw new HttpError("Symptoms, diagnosis, and treatment plan are required.");
  }

  const pool = getPool();
  const tknRes = await pool.query("SELECT * FROM opd_tokens WHERE id = $1", [
    input.tokenId,
  ]);
  if (tknRes.rowCount === 0) {
    throw new HttpError(`Token ${input.tokenId} not found.`, 404);
  }
  const token = tknRes.rows[0];

  const vitals = {
    bloodPressure: input.vitals?.bloodPressure?.trim() || "120/80 mmHg",
    temperature: input.vitals?.temperature?.trim() || "98.6 °F",
    pulse: input.vitals?.pulse?.trim() || "74 bpm",
    spo2: input.vitals?.spo2?.trim() || "99%",
  };

  const existingRes = await pool.query(
    "SELECT id FROM opd_consultations WHERE token_id = $1",
    [input.tokenId]
  );

  let consRes;
  if ((existingRes.rowCount ?? 0) > 0) {
    consRes = await pool.query(
      `UPDATE opd_consultations
       SET vitals = $2::jsonb, symptoms = $3, observations = $4, diagnosis = $5,
           clinical_notes = $6, treatment = $7, status = $8, updated_at = NOW()
       WHERE token_id = $1 RETURNING *`,
      [
        input.tokenId,
        JSON.stringify(vitals),
        input.symptoms.trim(),
        input.observations?.trim() ?? "",
        input.diagnosis.trim(),
        input.clinicalNotes?.trim() ?? "",
        input.treatment.trim(),
        input.status,
      ]
    );
  } else {
    const seq = await nextCounter("opd_consultation");
    const id = `CON-${new Date().getFullYear()}-${pad(seq)}`;
    consRes = await pool.query(
      `INSERT INTO opd_consultations (
        id, patient_id, doctor_id, department, appointment_id, token_id, visit_date,
        vitals, symptoms, observations, diagnosis, clinical_notes, treatment, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        id,
        token.patient_id,
        token.doctor_id,
        token.department,
        token.appointment_id,
        token.id,
        token.token_date,
        JSON.stringify(vitals),
        input.symptoms.trim(),
        input.observations?.trim() ?? "",
        input.diagnosis.trim(),
        input.clinicalNotes?.trim() ?? "",
        input.treatment.trim(),
        input.status,
      ]
    );
  }

  if (input.status === "Completed") {
    await pool.query(
      `UPDATE opd_tokens SET status = 'Completed', completed_at = NOW() WHERE id = $1`,
      [token.id]
    );
    await pool.query(
      `UPDATE opd_appointments SET status = 'Completed', updated_at = NOW() WHERE id = $1`,
      [token.appointment_id]
    );
    await pool.query(
      `UPDATE opd_follow_ups SET status = 'Completed', updated_at = NOW()
       WHERE follow_up_appointment_id = $1`,
      [token.appointment_id]
    );
  } else {
    await pool.query(
      `UPDATE opd_tokens SET status = 'In Consultation', started_at = COALESCE(started_at, NOW()) WHERE id = $1`,
      [token.id]
    );
    await pool.query(
      `UPDATE opd_appointments SET status = 'In Consultation', updated_at = NOW() WHERE id = $1`,
      [token.appointment_id]
    );
  }

  return mapConsultation(consRes.rows[0]);
}

export async function scheduleFollowUp(input: {
  originalConsultationId: string;
  scheduledDate: string;
  timeSlot: string;
  doctorId?: string;
  instructions?: string;
}) {
  if (!input.originalConsultationId || !input.scheduledDate || !input.timeSlot) {
    throw new HttpError(
      "Original consultation, follow-up date, and time slot are required."
    );
  }

  const pool = getPool();
  const consRes = await pool.query(
    "SELECT * FROM opd_consultations WHERE id = $1",
    [input.originalConsultationId]
  );
  if (consRes.rowCount === 0) {
    throw new HttpError(
      `Consultation ${input.originalConsultationId} not found.`,
      404
    );
  }
  const cons = consRes.rows[0];
  const doctorId = input.doctorId?.trim() || (cons.doctor_id as string);

  const docRes = await pool.query("SELECT * FROM opd_doctors WHERE id = $1", [
    doctorId,
  ]);
  if (docRes.rowCount === 0) {
    throw new HttpError(`Doctor ${doctorId} not found.`, 404);
  }
  const doctor = mapDoctor(docRes.rows[0]);

  const appointment = await createAppointment({
    patientId: cons.patient_id as string,
    department: doctor.department,
    doctorId,
    date: input.scheduledDate,
    timeSlot: input.timeSlot,
    visitType: "Follow-up",
    priority: "Normal",
    reason: `Follow-up for ${cons.diagnosis} (${cons.id})`,
    originalConsultationId: cons.id as string,
  });

  const seq = await nextCounter("opd_followup");
  const followUpId = `FUP-${new Date().getFullYear()}-${pad(seq)}`;
  const fupRes = await pool.query(
    `INSERT INTO opd_follow_ups (
      id, original_consultation_id, original_appointment_id, follow_up_appointment_id,
      patient_id, doctor_id, department, scheduled_date, time_slot, instructions, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Upcoming')
    RETURNING *`,
    [
      followUpId,
      cons.id,
      cons.appointment_id,
      appointment.id,
      cons.patient_id,
      doctorId,
      doctor.department,
      input.scheduledDate,
      input.timeSlot,
      input.instructions?.trim() || "Review recovery progress and test results.",
    ]
  );

  await pool.query(
    "UPDATE opd_consultations SET follow_up_id = $2, updated_at = NOW() WHERE id = $1",
    [cons.id, followUpId]
  );

  return { followUp: mapFollowUp(fupRes.rows[0]), appointment };
}

export async function updateFollowUpStatus(followUpId: string, status: string) {
  const pool = getPool();
  const fupRes = await pool.query(
    `UPDATE opd_follow_ups SET status = $2, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [followUpId, status]
  );
  if (fupRes.rowCount === 0) {
    throw new HttpError(`Follow-up ${followUpId} not found.`, 404);
  }
  const followUp = mapFollowUp(fupRes.rows[0]);
  if (status === "Cancelled" || status === "Completed") {
    await pool.query(
      `UPDATE opd_appointments SET status = $2, updated_at = NOW() WHERE id = $1`,
      [followUp.followUpAppointmentId, status]
    );
  }
  return followUp;
}
