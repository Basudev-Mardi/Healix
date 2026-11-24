import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { PoolClient } from "pg";
import { getPool } from "../db/client.js";
import { HttpError } from "../opd/service.js";

function pad(n: number, size = 4): string {
  return String(n).padStart(size, "0");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;
  const derived = scryptSync(password, salt, 32);
  const storedBuf = Buffer.from(keyHex, "hex");
  if (derived.length !== storedBuf.length) return false;
  return timingSafeEqual(derived, storedBuf);
}

async function nextCounter(key: string, client?: PoolClient): Promise<number> {
  const runner = client ?? getPool();
  const res = await runner.query(
    `INSERT INTO entity_counters (counter_key, current_value)
     VALUES ($1, 1)
     ON CONFLICT (counter_key)
     DO UPDATE SET current_value = entity_counters.current_value + 1
     RETURNING current_value`,
    [key]
  );
  return Number(res.rows[0].current_value);
}

async function pushNotification(
  patientId: string,
  category: string,
  title: string,
  message: string,
  client?: PoolClient
) {
  const runner = client ?? getPool();
  const seq = await nextCounter("patient_notification", client);
  await runner.query(
    `INSERT INTO patient_notifications (id, patient_id, category, title, message)
     VALUES ($1,$2,$3,$4,$5)`,
    [`NTF-${new Date().getFullYear()}-${pad(seq)}`, patientId, category, title, message]
  );
}

// Auth: Login with Patient ID or Email + Password
export async function loginPatient(input: {
  identifier: string;
  password: string;
}) {
  if (!input.identifier?.trim() || !input.password) {
    throw new HttpError("Patient ID / Email and password are required.", 400);
  }

  const pool = getPool();
  const ident = input.identifier.trim();
  const credRes = await pool.query(
    `SELECT c.*, p.full_name
     FROM patient_portal_credentials c
     JOIN patients p ON p.id = c.patient_id
     WHERE UPPER(c.patient_id) = UPPER($1) OR LOWER(c.email) = LOWER($1)`,
    [ident]
  );

  if (credRes.rowCount === 0) {
    throw new HttpError("Invalid patient credentials.", 401);
  }

  const cred = credRes.rows[0];
  if (!verifyPassword(input.password, cred.password_hash as string)) {
    throw new HttpError("Invalid patient credentials.", 401);
  }

  const token = randomBytes(32).toString("hex");
  await pool.query(
    `INSERT INTO patient_portal_sessions (token, patient_id, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
    [token, cred.patient_id]
  );
  await pool.query(
    `UPDATE patient_portal_credentials SET last_login_at = NOW() WHERE patient_id = $1`,
    [cred.patient_id]
  );

  return {
    token,
    patientId: cred.patient_id as string,
    fullName: cred.full_name as string,
    email: cred.email as string,
  };
}

// Auth: Self-register new patient portal account
export async function registerPatientAccount(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
}) {
  if (
    !input.fullName?.trim() ||
    !input.email?.trim() ||
    !input.phone?.trim() ||
    !input.password ||
    input.password.length < 6
  ) {
    throw new HttpError(
      "Full name, email, phone, and a password of at least 6 characters are required.",
      400
    );
  }

  const pool = getPool();
  const email = input.email.trim().toLowerCase();
  const dup = await pool.query(
    "SELECT patient_id FROM patient_portal_credentials WHERE LOWER(email) = $1",
    [email]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError("An account with this email already exists.", 409);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const seq = await nextCounter("patient", client);
    const patientId = `PAT-${new Date().getFullYear()}-${pad(seq)}`;

    await client.query(
      `INSERT INTO patients (
        id, full_name, date_of_birth, gender, phone, email, blood_group
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        patientId,
        input.fullName.trim(),
        input.dateOfBirth?.trim() ?? "",
        input.gender?.trim() || "Unknown",
        input.phone.trim(),
        email,
        input.bloodGroup?.trim() || "Unknown",
      ]
    );

    await client.query(
      `INSERT INTO patient_portal_credentials (patient_id, email, password_hash, last_login_at)
       VALUES ($1,$2,$3,NOW())`,
      [patientId, email, hashPassword(input.password)]
    );

    const token = randomBytes(32).toString("hex");
    await client.query(
      `INSERT INTO patient_portal_sessions (token, patient_id, expires_at)
       VALUES ($1,$2,NOW() + INTERVAL '24 hours')`,
      [token, patientId]
    );

    await pushNotification(
      patientId,
      "Hospital",
      "Welcome to Healix Patient Portal",
      `Your patient ID is ${patientId}. You can now book appointments, view reports, and manage bills securely.`,
      client
    );

    await client.query("COMMIT");
    return { token, patientId, fullName: input.fullName.trim(), email };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function logoutPatient(token: string) {
  const pool = getPool();
  await pool.query("DELETE FROM patient_portal_sessions WHERE token = $1", [
    token,
  ]);
}

export async function resolvePatientFromToken(
  authHeader: string | undefined
): Promise<string> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError("Authentication required. Please sign in.", 401);
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new HttpError("Authentication required. Please sign in.", 401);
  }
  const pool = getPool();
  const res = await pool.query(
    `SELECT patient_id FROM patient_portal_sessions
     WHERE token = $1 AND expires_at > NOW()`,
    [token]
  );
  if (res.rowCount === 0) {
    throw new HttpError("Session expired or invalid. Please sign in again.", 401);
  }
  return res.rows[0].patient_id as string;
}

// Unified Authenticated Patient Portal State (Strictly isolated to patientId!)
export async function getPatientPortalState(patientId: string) {
  const pool = getPool();

  const [
    patRes,
    docRes,
    aptRes,
    tokRes,
    consRes,
    rxRes,
    labRepRes,
    labResRes,
    radRepRes,
    admRes,
    disSumRes,
    invRes,
    payRes,
    clmRes,
    ntfRes,
    supRes,
  ] = await Promise.all([
    pool.query("SELECT * FROM patients WHERE id = $1", [patientId]),
    pool.query(
      "SELECT id, name, department, specialization, room, slots FROM opd_doctors ORDER BY department, name"
    ),
    pool.query(
      `SELECT a.*, d.name AS doctor_name, d.room AS doctor_room
       FROM opd_appointments a
       LEFT JOIN opd_doctors d ON d.id = a.doctor_id
       WHERE a.patient_id = $1
       ORDER BY a.appointment_date DESC, a.time_slot DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT t.*, d.name AS doctor_name, d.room AS doctor_room,
              (SELECT COUNT(*)::int FROM opd_tokens q
               WHERE q.doctor_id = t.doctor_id
                 AND q.token_date = t.token_date
                 AND q.status = 'Waiting'
                 AND q.sequence < t.sequence) AS ahead_in_queue
       FROM opd_tokens t
       LEFT JOIN opd_doctors d ON d.id = t.doctor_id
       WHERE t.patient_id = $1
       ORDER BY t.created_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT c.*, d.name AS doctor_name
       FROM opd_consultations c
       LEFT JOIN opd_doctors d ON d.id = c.doctor_id
       WHERE c.patient_id = $1
       ORDER BY c.visit_date DESC, c.created_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT * FROM pharmacy_prescriptions
       WHERE patient_id = $1
       ORDER BY prescribed_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT * FROM lab_reports
       WHERE patient_id = $1
       ORDER BY generated_at DESC`,
      [patientId]
    ),
    // Only Verified lab results are exposed to patients!
    pool.query(
      `SELECT * FROM lab_results
       WHERE patient_id = $1 AND verification_status = 'Verified'
       ORDER BY verified_at DESC`,
      [patientId]
    ),
    // Only Finalized radiology reports are exposed to patients!
    pool.query(
      `SELECT * FROM radiology_reports
       WHERE patient_id = $1 AND status = 'Finalized'
       ORDER BY finalized_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT * FROM ipd_admissions
       WHERE patient_id = $1
       ORDER BY admission_date DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT * FROM ipd_discharge_summaries
       WHERE patient_id = $1
       ORDER BY created_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT * FROM billing_invoices
       WHERE patient_id = $1
       ORDER BY created_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT * FROM billing_payments
       WHERE patient_id = $1
       ORDER BY paid_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT * FROM billing_insurance_claims
       WHERE patient_id = $1
       ORDER BY updated_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT * FROM patient_notifications
       WHERE patient_id = $1
       ORDER BY created_at DESC`,
      [patientId]
    ),
    pool.query(
      `SELECT * FROM patient_support_tickets
       WHERE patient_id = $1
       ORDER BY created_at DESC`,
      [patientId]
    ),
  ]);

  if (patRes.rowCount === 0) {
    throw new HttpError("Patient profile not found.", 404);
  }
  const p = patRes.rows[0];

  return {
    profile: {
      id: p.id as string,
      fullName: p.full_name as string,
      dateOfBirth: (p.date_of_birth as string) ?? "",
      gender: (p.gender as string) ?? "",
      phone: (p.phone as string) ?? "",
      email: (p.email as string) ?? "",
      address: (p.address as string) ?? "",
      bloodGroup: (p.blood_group as string) ?? "",
      emergencyContactName: (p.emergency_contact_name as string) ?? "",
      emergencyContactPhone: (p.emergency_contact_phone as string) ?? "",
      allergies: (p.allergies as string) ?? "None",
    },
    doctors: docRes.rows.map((d) => ({
      id: d.id as string,
      name: d.name as string,
      department: d.department as string,
      specialization: d.specialization as string,
      room: d.room as string,
      slots: (d.slots as string[]) ?? [],
    })),
    appointments: aptRes.rows.map((a) => ({
      id: a.id as string,
      department: a.department as string,
      doctorId: a.doctor_id as string,
      doctorName: (a.doctor_name as string) ?? a.doctor_id,
      room: (a.doctor_room as string) ?? "",
      appointmentDate: a.appointment_date as string,
      timeSlot: a.time_slot as string,
      reason: a.reason as string,
      status: a.status as string,
      tokenId: (a.token_id as string | null) ?? undefined,
      cancelReason: (a.cancel_reason as string | null) ?? undefined,
    })),
    tokens: tokRes.rows.map((t) => ({
      id: t.id as string,
      tokenNumber: t.token_number as string,
      sequence: Number(t.sequence),
      tokenDate: t.token_date as string,
      doctorName: (t.doctor_name as string) ?? t.doctor_id,
      room: (t.doctor_room as string) ?? "",
      department: t.department as string,
      appointmentId: t.appointment_id as string,
      status: t.status as string,
      aheadInQueue: Number(t.ahead_in_queue ?? 0),
    })),
    consultations: consRes.rows.map((c) => ({
      id: c.id as string,
      doctorName: (c.doctor_name as string) ?? c.doctor_id,
      department: c.department as string,
      visitDate: c.visit_date as string,
      symptoms: c.symptoms as string,
      diagnosis: c.diagnosis as string,
      treatment: c.treatment as string,
      clinicalNotes: (c.clinical_notes as string) ?? "",
      status: c.status as string,
    })),
    prescriptions: rxRes.rows.map((r) => ({
      id: r.id as string,
      doctorName: r.doctor_name as string,
      items: r.items as {
        medicineCode: string;
        medicineName: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions: string;
        prescribedQty: number;
        dispensedQty: number;
      }[],
      status: r.status as string,
      prescribedAt: (r.prescribed_at as Date).toISOString(),
    })),
    labReports: labRepRes.rows.map((r) => ({
      id: r.id as string,
      requestId: r.request_id as string,
      referringDoctor: r.referring_doctor as string,
      verifiedBy: r.verified_by as string,
      generatedAt: (r.generated_at as Date).toISOString(),
      reportSnapshot: r.report_snapshot,
    })),
    verifiedLabResults: labResRes.rows.map((r) => ({
      id: r.id as string,
      requestId: r.request_id as string,
      testCode: r.test_code as string,
      testName: r.test_name as string,
      resultValue: r.result_value as string,
      unit: r.unit as string,
      referenceRange: r.reference_range as string,
      isOutOfRange: Boolean(r.is_out_of_range),
      remarks: (r.remarks as string) ?? "",
      verifiedBy: (r.verified_by as string) ?? "",
      verifiedAt: r.verified_at ? (r.verified_at as Date).toISOString() : "",
    })),
    radiologyReports: radRepRes.rows.map((r) => ({
      id: r.id as string,
      modality: r.modality as string,
      examType: r.exam_type as string,
      bodyRegion: r.body_region as string,
      findings: r.findings as string,
      impression: r.impression as string,
      radiologistName: r.radiologist_name as string,
      finalizedAt: r.finalized_at ? (r.finalized_at as Date).toISOString() : "",
    })),
    admissions: admRes.rows.map((a) => ({
      id: a.id as string,
      admissionDate: (a.admission_date as Date).toISOString(),
      admittingDoctor: a.admitting_doctor as string,
      department: a.department as string,
      ward: a.ward as string,
      room: a.room as string,
      bedLabel: a.bed_label as string,
      reason: a.reason as string,
      diagnosis: a.diagnosis as string,
      status: a.status as string,
    })),
    dischargeSummaries: disSumRes.rows.map((d) => ({
      id: d.id as string,
      admissionId: d.admission_id as string,
      admissionDate: d.admission_date as string,
      dischargeDate: d.discharge_date as string,
      finalDiagnosis: d.final_diagnosis as string,
      treatmentReceived: d.treatment_received as string,
      dischargeMedications: d.discharge_medications as string,
      followUpInstructions: d.follow_up_instructions as string,
      responsibleDoctor: d.responsible_doctor as string,
    })),
    invoices: invRes.rows.map((i) => ({
      id: i.id as string,
      billNumber: i.bill_number as string,
      category: i.category as string,
      sourceReferenceId: (i.source_reference_id as string) ?? "",
      items: i.items as {
        description: string;
        code?: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }[],
      subtotal: Number(i.subtotal),
      discountPercent: Number(i.discount_percent),
      discountAmount: Number(i.discount_amount),
      taxPercent: Number(i.tax_percent),
      taxAmount: Number(i.tax_amount),
      totalAmount: Number(i.total_amount),
      paidAmount: Number(i.paid_amount),
      refundedAmount: Number(i.refunded_amount),
      outstandingBalance: Number(i.outstanding_balance),
      status: i.status as string,
      dueDate: (i.due_date as string) ?? "",
      createdAt: (i.created_at as Date).toISOString(),
    })),
    payments: payRes.rows.map((pay) => ({
      id: pay.id as string,
      invoiceId: pay.invoice_id as string,
      amount: Number(pay.amount),
      paymentType: pay.payment_type as string,
      paymentMethod: pay.payment_method as string,
      referenceNumber: (pay.reference_number as string) ?? "",
      paidAt: (pay.paid_at as Date).toISOString(),
    })),
    insuranceClaims: clmRes.rows.map((c) => ({
      id: c.id as string,
      invoiceId: c.invoice_id as string,
      providerName: c.provider_name as string,
      policyNumber: c.policy_number as string,
      coverageVerified: Boolean(c.coverage_verified),
      preAuthNumber: (c.pre_auth_number as string) ?? "",
      claimedAmount: Number(c.claimed_amount),
      approvedAmount: Number(c.approved_amount),
      settledAmount: Number(c.settled_amount),
      status: c.status as string,
      rejectionReason: (c.rejection_reason as string) ?? "",
      updatedAt: (c.updated_at as Date).toISOString(),
    })),
    notifications: ntfRes.rows.map((n) => ({
      id: n.id as string,
      category: n.category as string,
      title: n.title as string,
      message: n.message as string,
      isRead: Boolean(n.is_read),
      createdAt: (n.created_at as Date).toISOString(),
    })),
    supportTickets: supRes.rows.map((s) => ({
      id: s.id as string,
      subject: s.subject as string,
      category: s.category as string,
      message: s.message as string,
      status: s.status as string,
      staffResponse: (s.staff_response as string) ?? "",
      respondedAt: s.responded_at
        ? (s.responded_at as Date).toISOString()
        : undefined,
      createdAt: (s.created_at as Date).toISOString(),
    })),
  };
}

// 2. Update permitted profile fields (never modifies ID, DOB, blood group, or another patient)
export async function updatePatientProfile(
  patientId: string,
  input: {
    phone: string;
    email: string;
    address: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    allergies: string;
  }
) {
  if (!input.phone?.trim()) {
    throw new HttpError("Phone number is required.", 400);
  }
  const pool = getPool();
  await pool.query(
    `UPDATE patients
     SET phone = $2,
         email = $3,
         address = $4,
         emergency_contact_name = $5,
         emergency_contact_phone = $6,
         allergies = $7
     WHERE id = $1`,
    [
      patientId,
      input.phone.trim(),
      input.email?.trim() ?? "",
      input.address?.trim() ?? "",
      input.emergencyContactName?.trim() ?? "",
      input.emergencyContactPhone?.trim() ?? "",
      input.allergies?.trim() || "None",
    ]
  );
  return { ok: true };
}

// 3. Book, Reschedule, Cancel Patient's Own Appointment (Synced with OPD)
export async function bookPatientAppointment(
  patientId: string,
  input: {
    doctorId: string;
    appointmentDate: string;
    timeSlot: string;
    reason?: string;
  }
) {
  if (!input.doctorId || !input.appointmentDate?.trim() || !input.timeSlot?.trim()) {
    throw new HttpError("Doctor, date, and time slot are required.", 400);
  }

  const pool = getPool();
  const docRes = await pool.query("SELECT * FROM opd_doctors WHERE id = $1", [
    input.doctorId,
  ]);
  if (docRes.rowCount === 0) {
    throw new HttpError("Selected doctor not found.", 404);
  }
  const doc = docRes.rows[0];

  const conflict = await pool.query(
    `SELECT id FROM opd_appointments
     WHERE doctor_id = $1 AND appointment_date = $2 AND time_slot = $3
       AND status NOT IN ('Cancelled','Completed')`,
    [doc.id, input.appointmentDate.trim(), input.timeSlot.trim()]
  );
  if ((conflict.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Slot ${input.timeSlot} on ${input.appointmentDate} with ${doc.name} is already booked. Please pick another slot.`,
      409
    );
  }

  const seq = await nextCounter("opd_appointment");
  const id = `APT-${new Date().getFullYear()}-${pad(seq)}`;

  await pool.query(
    `INSERT INTO opd_appointments (
      id, patient_id, department, doctor_id, appointment_date, time_slot,
      visit_type, priority, reason, status
    ) VALUES ($1,$2,$3,$4,$5,$6,'Appointment','Normal',$7,'Scheduled')`,
    [
      id,
      patientId,
      doc.department,
      doc.id,
      input.appointmentDate.trim(),
      input.timeSlot.trim(),
      input.reason?.trim() || "Patient Portal Consultation",
    ]
  );

  await pushNotification(
    patientId,
    "Appointment",
    "Appointment Confirmed",
    `Booking ${id} with ${doc.name} (${doc.department}) on ${input.appointmentDate} at ${input.timeSlot} is confirmed.`
  );

  return { id };
}

export async function updatePatientAppointment(
  patientId: string,
  input: {
    appointmentId: string;
    action: "reschedule" | "cancel";
    appointmentDate?: string;
    timeSlot?: string;
    cancelReason?: string;
  }
) {
  const pool = getPool();
  // Enforce patient ownership!
  const curRes = await pool.query(
    "SELECT * FROM opd_appointments WHERE id = $1 AND patient_id = $2",
    [input.appointmentId, patientId]
  );
  if (curRes.rowCount === 0) {
    throw new HttpError("Appointment not found for your account.", 404);
  }
  const cur = curRes.rows[0];
  if (cur.status === "Completed" || cur.status === "Cancelled") {
    throw new HttpError(`Cannot modify a ${cur.status} appointment.`, 409);
  }

  if (input.action === "cancel") {
    await pool.query(
      `UPDATE opd_appointments
       SET status = 'Cancelled', cancel_reason = $2, updated_at = NOW()
       WHERE id = $1 AND patient_id = $3`,
      [
        cur.id,
        input.cancelReason?.trim() || "Cancelled by patient via portal",
        patientId,
      ]
    );
    await pushNotification(
      patientId,
      "Appointment",
      "Appointment Cancelled",
      `Your appointment ${cur.id} on ${cur.appointment_date} has been cancelled.`
    );
    return { ok: true };
  }

  if (!input.appointmentDate?.trim() || !input.timeSlot?.trim()) {
    throw new HttpError("New date and time slot are required to reschedule.", 400);
  }
  const conflict = await pool.query(
    `SELECT id FROM opd_appointments
     WHERE doctor_id = $1 AND appointment_date = $2 AND time_slot = $3
       AND status NOT IN ('Cancelled','Completed') AND id <> $4`,
    [cur.doctor_id, input.appointmentDate.trim(), input.timeSlot.trim(), cur.id]
  );
  if ((conflict.rowCount ?? 0) > 0) {
    throw new HttpError("Selected slot is already booked. Please pick another.", 409);
  }

  await pool.query(
    `UPDATE opd_appointments
     SET appointment_date = $2, time_slot = $3, status = 'Rescheduled', updated_at = NOW()
     WHERE id = $1 AND patient_id = $4`,
    [cur.id, input.appointmentDate.trim(), input.timeSlot.trim(), patientId]
  );
  await pushNotification(
    patientId,
    "Appointment",
    "Appointment Rescheduled",
    `Appointment ${cur.id} moved to ${input.appointmentDate} at ${input.timeSlot}.`
  );
  return { ok: true };
}

// 9. Patient Online Bill Payment (Atomic & strictly isolated to patient's own invoice!)
export async function payPatientInvoice(
  patientId: string,
  input: {
    invoiceId: string;
    amount: number;
    paymentMethod: "Card" | "UPI" | "Bank Transfer";
  }
) {
  const amount = round2(Number(input.amount));
  if (!input.invoiceId || amount <= 0) {
    throw new HttpError("Invoice and positive payment amount are required.", 400);
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invRes = await client.query(
      "SELECT * FROM billing_invoices WHERE id = $1 AND patient_id = $2 FOR UPDATE",
      [input.invoiceId, patientId]
    );
    if (invRes.rowCount === 0) {
      throw new HttpError("Invoice not found for your account.", 404);
    }
    const inv = invRes.rows[0];
    const outstanding = Number(inv.outstanding_balance);
    if (outstanding <= 0) {
      throw new HttpError("This invoice is already paid in full.", 409);
    }
    if (amount > outstanding + 0.01) {
      throw new HttpError(
        `Amount exceeds outstanding balance of $${outstanding.toFixed(2)}.`,
        400
      );
    }

    const paySeq = await nextCounter("billing_payment", client);
    const payId = `PAY-${new Date().getFullYear()}-${pad(paySeq)}`;
    const refNo = `PORTAL-${Date.now().toString().slice(-6)}`;

    await client.query(
      `INSERT INTO billing_payments (
        id, invoice_id, patient_id, patient_name, amount, payment_type,
        payment_method, reference_number, received_by, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Patient Portal','Online patient portal payment')`,
      [
        payId,
        inv.id,
        patientId,
        inv.patient_name,
        amount,
        amount >= outstanding - 0.01 ? "Full" : "Partial",
        input.paymentMethod,
        refNo,
      ]
    );

    const newPaid = round2(Number(inv.paid_amount) + amount);
    const newOut = Math.max(
      0,
      round2(Number(inv.total_amount) - (newPaid - Number(inv.refunded_amount)))
    );
    const nextStatus = newOut <= 0.01 ? "Paid" : "Partially Paid";

    await client.query(
      `UPDATE billing_invoices
       SET paid_amount = $2, outstanding_balance = $3, status = $4, updated_at = NOW()
       WHERE id = $1`,
      [inv.id, newPaid, newOut, nextStatus]
    );

    await pushNotification(
      patientId,
      "Billing",
      "Payment Receipt Confirmed",
      `Payment ${payId} of $${amount.toFixed(2)} via ${input.paymentMethod} for ${inv.id} was received (Ref: ${refNo}).`,
      client
    );

    await client.query("COMMIT");
    return { paymentId: payId, referenceNumber: refNo, status: nextStatus };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// 11. Mark Notification Read (Strictly isolated to patientId)
export async function markNotificationRead(
  patientId: string,
  notificationId: string
) {
  const pool = getPool();
  await pool.query(
    `UPDATE patient_notifications SET is_read = TRUE
     WHERE id = $1 AND patient_id = $2`,
    [notificationId, patientId]
  );
  return { ok: true };
}

// 12. Submit Support Ticket
export async function createSupportTicket(
  patientId: string,
  input: { subject: string; category: string; message: string }
) {
  if (!input.subject?.trim() || !input.message?.trim()) {
    throw new HttpError("Subject and message are required.", 400);
  }
  const pool = getPool();
  const seq = await nextCounter("patient_support");
  const id = `SUP-PT-${new Date().getFullYear()}-${pad(seq)}`;
  await pool.query(
    `INSERT INTO patient_support_tickets (id, patient_id, subject, category, message, status)
     VALUES ($1,$2,$3,$4,$5,'Open')`,
    [
      id,
      patientId,
      input.subject.trim(),
      input.category?.trim() || "General Inquiry",
      input.message.trim(),
    ]
  );
  return { id };
}
