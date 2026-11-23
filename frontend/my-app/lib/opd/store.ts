import fs from "node:fs";
import path from "node:path";
import type {
  AppointmentStatus,
  ConsultationStatus,
  FollowUpStatus,
  Gender,
  OpdAppointment,
  OpdConsultation,
  OpdDatabase,
  OpdFollowUp,
  OpdPatient,
  OpdToken,
  PriorityLevel,
  TokenStatus,
  VisitType,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "opd-db.json");

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

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getOffsetIso(daysOffset: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysOffset);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pad(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

function createSeedDatabase(): OpdDatabase {
  const today = getTodayIso();
  const yesterday = getOffsetIso(-1);
  const nextWeek = getOffsetIso(7);
  const nowIso = new Date().toISOString();

  return {
    doctors: [
      {
        id: "DOC-001",
        name: "Dr. Rajesh Mehta",
        department: "General Medicine",
        specialization: "Internal Medicine",
        room: "OPD-101",
        availableDays: [0, 1, 2, 3, 4, 5, 6],
        slots: STANDARD_SLOTS,
      },
      {
        id: "DOC-002",
        name: "Dr. Lin Chen",
        department: "Cardiology",
        specialization: "Interventional Cardiology",
        room: "OPD-204",
        availableDays: [0, 1, 2, 3, 4, 5, 6],
        slots: STANDARD_SLOTS,
      },
      {
        id: "DOC-003",
        name: "Dr. Sunita Kapoor",
        department: "Orthopedics",
        specialization: "Joint & Spine Surgery",
        room: "OPD-108",
        availableDays: [0, 1, 2, 3, 4, 5, 6],
        slots: STANDARD_SLOTS,
      },
      {
        id: "DOC-004",
        name: "Dr. Aarav Deshmukh",
        department: "Pediatrics",
        specialization: "Child Health & Immunization",
        room: "OPD-112",
        availableDays: [0, 1, 2, 3, 4, 5, 6],
        slots: STANDARD_SLOTS,
      },
      {
        id: "DOC-005",
        name: "Dr. Clara Jensen",
        department: "Dermatology",
        specialization: "Clinical Dermatology",
        room: "OPD-209",
        availableDays: [0, 1, 2, 3, 4, 5, 6],
        slots: STANDARD_SLOTS,
      },
    ],
    patients: [
      {
        id: "PAT-2026-0001",
        fullName: "Ananya Sharma",
        dateOfBirth: "1991-05-14",
        gender: "Female",
        phone: "9876543210",
        email: "ananya.sharma@example.com",
        address: "14 Park Avenue, Sector 7",
        bloodGroup: "O+",
        emergencyContactName: "Rohan Sharma",
        emergencyContactPhone: "9876543211",
        allergies: "Penicillin",
        createdAt: nowIso,
      },
      {
        id: "PAT-2026-0002",
        fullName: "Vikram Rao",
        dateOfBirth: "1972-09-22",
        gender: "Male",
        phone: "9811223344",
        email: "vikram.rao@example.com",
        address: "88 Lakeview Residency",
        bloodGroup: "B+",
        emergencyContactName: "Meera Rao",
        emergencyContactPhone: "9811223345",
        allergies: "None",
        createdAt: nowIso,
      },
      {
        id: "PAT-2026-0003",
        fullName: "Claire Evans",
        dateOfBirth: "1989-11-03",
        gender: "Female",
        phone: "9822334455",
        email: "claire.evans@example.com",
        address: "212 Cedar Heights",
        bloodGroup: "A+",
        emergencyContactName: "Mark Evans",
        emergencyContactPhone: "9822334456",
        allergies: "Sulfa drugs",
        createdAt: nowIso,
      },
    ],
    appointments: [
      {
        id: "APT-2026-0001",
        patientId: "PAT-2026-0002",
        department: "Cardiology",
        doctorId: "DOC-002",
        date: yesterday,
        timeSlot: "10:00",
        visitType: "Appointment",
        priority: "Normal",
        reason: "Routine post-angioplasty blood pressure review",
        status: "Completed",
        tokenId: "TKN-2026-0001",
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: "APT-2026-0002",
        patientId: "PAT-2026-0001",
        department: "General Medicine",
        doctorId: "DOC-001",
        date: today,
        timeSlot: "10:00",
        visitType: "Appointment",
        priority: "Normal",
        reason: "Persistent fever and fatigue for 3 days",
        status: "Checked In",
        tokenId: "TKN-2026-0002",
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: "APT-2026-0003",
        patientId: "PAT-2026-0003",
        department: "Orthopedics",
        doctorId: "DOC-003",
        date: today,
        timeSlot: "10:30",
        visitType: "Appointment",
        priority: "Normal",
        reason: "Right knee stiffness after running",
        status: "Scheduled",
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: "APT-2026-0004",
        patientId: "PAT-2026-0002",
        department: "Cardiology",
        doctorId: "DOC-002",
        date: nextWeek,
        timeSlot: "10:30",
        visitType: "Follow-up",
        priority: "Normal",
        reason: "Follow-up ECG and lipid profile review",
        status: "Scheduled",
        originalConsultationId: "CON-2026-0001",
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    tokens: [
      {
        id: "TKN-2026-0001",
        tokenNumber: "OPD-001",
        sequence: 1,
        date: yesterday,
        patientId: "PAT-2026-0002",
        doctorId: "DOC-002",
        department: "Cardiology",
        appointmentId: "APT-2026-0001",
        visitType: "Appointment",
        priority: "Normal",
        status: "Completed",
        calledAt: nowIso,
        startedAt: nowIso,
        completedAt: nowIso,
        createdAt: nowIso,
      },
      {
        id: "TKN-2026-0002",
        tokenNumber: "OPD-002",
        sequence: 2,
        date: today,
        patientId: "PAT-2026-0001",
        doctorId: "DOC-001",
        department: "General Medicine",
        appointmentId: "APT-2026-0002",
        visitType: "Appointment",
        priority: "Normal",
        status: "Waiting",
        createdAt: nowIso,
      },
    ],
    consultations: [
      {
        id: "CON-2026-0001",
        patientId: "PAT-2026-0002",
        doctorId: "DOC-002",
        department: "Cardiology",
        appointmentId: "APT-2026-0001",
        tokenId: "TKN-2026-0001",
        visitDate: yesterday,
        vitals: {
          bloodPressure: "128/82 mmHg",
          temperature: "98.4 °F",
          pulse: "72 bpm",
          spo2: "98%",
        },
        symptoms: "Mild exertional dyspnea, no chest pain",
        observations: "Heart sounds normal S1/S2, lungs clear bilaterally",
        diagnosis: "Stable Coronary Artery Disease (Post-PCI)",
        clinicalNotes: "Continue dual antiplatelet therapy and low-sodium diet.",
        treatment: "Aspirin 75mg OD, Atorvastatin 40mg HS, Metoprolol 25mg OD",
        status: "Completed",
        followUpId: "FUP-2026-0001",
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    followUps: [
      {
        id: "FUP-2026-0001",
        originalConsultationId: "CON-2026-0001",
        originalAppointmentId: "APT-2026-0001",
        followUpAppointmentId: "APT-2026-0004",
        patientId: "PAT-2026-0002",
        doctorId: "DOC-002",
        department: "Cardiology",
        scheduledDate: nextWeek,
        timeSlot: "10:30",
        instructions: "Bring fasting lipid panel and resting ECG report.",
        status: "Upcoming",
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    counters: {
      patient: 3,
      appointment: 4,
      token: 2,
      consultation: 1,
      followUp: 1,
    },
  };
}

export function readOpdDb(): OpdDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedDatabase();
    writeOpdDb(seed);
    return seed;
  }
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(raw) as OpdDatabase;
}

export function writeOpdDb(db: OpdDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tempPath, DB_FILE);
}

export class OpdValidationError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "OpdValidationError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function registerPatient(input: {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
}): OpdPatient {
  const fullName = input.fullName?.trim();
  const dateOfBirth = input.dateOfBirth?.trim();
  const phone = input.phone?.trim();
  const gender = input.gender;

  if (!fullName || !dateOfBirth || !phone || !gender) {
    throw new OpdValidationError(
      "Full name, date of birth, gender, and phone number are required."
    );
  }

  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length < 7) {
    throw new OpdValidationError("Enter a valid contact phone number.");
  }

  const db = readOpdDb();
  const duplicate = db.patients.find(
    (p) =>
      normalizePhone(p.phone) === normalizedPhone ||
      (normalizeText(p.fullName) === normalizeText(fullName) &&
        p.dateOfBirth === dateOfBirth)
  );

  if (duplicate) {
    throw new OpdValidationError(
      `Duplicate patient detected: ${duplicate.fullName} is already registered with ID ${duplicate.id}.`,
      409,
      { existingPatient: duplicate }
    );
  }

  db.counters.patient += 1;
  const year = new Date().getFullYear();
  const patient: OpdPatient = {
    id: `PAT-${year}-${pad(db.counters.patient)}`,
    fullName,
    dateOfBirth,
    gender,
    phone,
    email: input.email?.trim() ?? "",
    address: input.address?.trim() ?? "",
    bloodGroup: input.bloodGroup?.trim() || "Unknown",
    emergencyContactName: input.emergencyContactName?.trim() ?? "",
    emergencyContactPhone: input.emergencyContactPhone?.trim() ?? "",
    allergies: input.allergies?.trim() || "None",
    createdAt: new Date().toISOString(),
  };

  db.patients.unshift(patient);
  writeOpdDb(db);
  return patient;
}

export function getDoctorSlotAvailability(
  db: OpdDatabase,
  doctorId: string,
  date: string,
  excludeAppointmentId?: string
): { availableSlots: string[]; bookedSlots: string[] } {
  const doctor = db.doctors.find((d) => d.id === doctorId);
  if (!doctor) {
    throw new OpdValidationError("Selected doctor was not found.", 404);
  }

  const bookedSlots = db.appointments
    .filter(
      (apt) =>
        apt.doctorId === doctorId &&
        apt.date === date &&
        apt.status !== "Cancelled" &&
        apt.id !== excludeAppointmentId
    )
    .map((apt) => apt.timeSlot);

  const bookedSet = new Set(bookedSlots);
  const availableSlots = doctor.slots.filter((slot) => !bookedSet.has(slot));
  return { availableSlots, bookedSlots };
}

export function createAppointment(input: {
  patientId: string;
  department: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  reason?: string;
  priority?: PriorityLevel;
  visitType?: VisitType;
  originalConsultationId?: string;
}): OpdAppointment {
  const { patientId, department, doctorId, date, timeSlot } = input;
  if (!patientId || !department || !doctorId || !date || !timeSlot) {
    throw new OpdValidationError(
      "Patient, department, doctor, date, and time slot are required."
    );
  }

  const db = readOpdDb();
  const patient = db.patients.find((p) => p.id === patientId);
  if (!patient) {
    throw new OpdValidationError(`Patient ${patientId} not found.`, 404);
  }

  const doctor = db.doctors.find((d) => d.id === doctorId);
  if (!doctor) {
    throw new OpdValidationError(`Doctor ${doctorId} not found.`, 404);
  }
  if (doctor.department !== department) {
    throw new OpdValidationError(
      `${doctor.name} belongs to ${doctor.department}, not ${department}.`
    );
  }
  if (!doctor.slots.includes(timeSlot)) {
    throw new OpdValidationError(
      `Time slot ${timeSlot} is outside ${doctor.name}'s OPD schedule.`
    );
  }

  const conflict = db.appointments.find(
    (apt) =>
      apt.doctorId === doctorId &&
      apt.date === date &&
      apt.timeSlot === timeSlot &&
      apt.status !== "Cancelled"
  );
  if (conflict) {
    throw new OpdValidationError(
      `${doctor.name} already has a booking on ${date} at ${timeSlot} (${conflict.id}).`,
      409
    );
  }

  db.counters.appointment += 1;
  const year = new Date().getFullYear();
  const nowIso = new Date().toISOString();
  const appointment: OpdAppointment = {
    id: `APT-${year}-${pad(db.counters.appointment)}`,
    patientId,
    department,
    doctorId,
    date,
    timeSlot,
    visitType: input.visitType ?? "Appointment",
    priority: input.priority ?? "Normal",
    reason: input.reason?.trim() || "OPD Consultation",
    status: "Scheduled",
    originalConsultationId: input.originalConsultationId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.appointments.unshift(appointment);
  writeOpdDb(db);
  return appointment;
}

export function updateAppointment(
  appointmentId: string,
  input: {
    action: "reschedule" | "cancel";
    date?: string;
    timeSlot?: string;
    doctorId?: string;
    cancelReason?: string;
  }
): OpdAppointment {
  const db = readOpdDb();
  const apt = db.appointments.find((a) => a.id === appointmentId);
  if (!apt) {
    throw new OpdValidationError(`Appointment ${appointmentId} not found.`, 404);
  }

  if (apt.status === "Completed") {
    throw new OpdValidationError("Completed appointments cannot be modified.");
  }

  const nowIso = new Date().toISOString();

  if (input.action === "cancel") {
    apt.status = "Cancelled";
    apt.cancelReason = input.cancelReason?.trim() || "Cancelled by staff";
    apt.updatedAt = nowIso;

    if (apt.tokenId) {
      const token = db.tokens.find((t) => t.id === apt.tokenId);
      if (token && token.status !== "Completed") {
        token.status = "Cancelled";
      }
    }

    const linkedFollowUp = db.followUps.find(
      (f) => f.followUpAppointmentId === apt.id
    );
    if (linkedFollowUp && linkedFollowUp.status !== "Completed") {
      linkedFollowUp.status = "Cancelled";
      linkedFollowUp.updatedAt = nowIso;
    }

    writeOpdDb(db);
    return apt;
  }

  // Reschedule
  const newDate = input.date?.trim() || apt.date;
  const newSlot = input.timeSlot?.trim() || apt.timeSlot;
  const newDoctorId = input.doctorId?.trim() || apt.doctorId;

  const doctor = db.doctors.find((d) => d.id === newDoctorId);
  if (!doctor) {
    throw new OpdValidationError(`Doctor ${newDoctorId} not found.`, 404);
  }
  if (!doctor.slots.includes(newSlot)) {
    throw new OpdValidationError(
      `Time slot ${newSlot} is not in ${doctor.name}'s schedule.`
    );
  }

  const conflict = db.appointments.find(
    (other) =>
      other.id !== apt.id &&
      other.doctorId === newDoctorId &&
      other.date === newDate &&
      other.timeSlot === newSlot &&
      other.status !== "Cancelled"
  );
  if (conflict) {
    throw new OpdValidationError(
      `Conflict: ${doctor.name} is already booked on ${newDate} at ${newSlot}.`,
      409
    );
  }

  apt.doctorId = newDoctorId;
  apt.department = doctor.department;
  apt.date = newDate;
  apt.timeSlot = newSlot;
  apt.status = "Rescheduled";
  apt.updatedAt = nowIso;

  const linkedFollowUp = db.followUps.find(
    (f) => f.followUpAppointmentId === apt.id
  );
  if (linkedFollowUp) {
    linkedFollowUp.doctorId = newDoctorId;
    linkedFollowUp.department = doctor.department;
    linkedFollowUp.scheduledDate = newDate;
    linkedFollowUp.timeSlot = newSlot;
    linkedFollowUp.updatedAt = nowIso;
  }

  writeOpdDb(db);
  return apt;
}

export function generateTokenForAppointment(
  appointmentId: string,
  priorityOverride?: PriorityLevel
): { token: OpdToken; appointment: OpdAppointment } {
  const db = readOpdDb();
  const apt = db.appointments.find((a) => a.id === appointmentId);
  if (!apt) {
    throw new OpdValidationError(`Appointment ${appointmentId} not found.`, 404);
  }
  if (apt.status === "Cancelled" || apt.status === "Completed") {
    throw new OpdValidationError(
      `Cannot generate token for a ${apt.status.toLowerCase()} appointment.`
    );
  }

  const existingActiveToken = db.tokens.find(
    (t) =>
      t.appointmentId === appointmentId &&
      t.status !== "Cancelled" &&
      t.status !== "Completed"
  );
  if (existingActiveToken) {
    throw new OpdValidationError(
      `Active token ${existingActiveToken.tokenNumber} already exists for appointment ${appointmentId}.`,
      409
    );
  }

  db.counters.token += 1;
  const year = new Date().getFullYear();
  const nowIso = new Date().toISOString();
  const token: OpdToken = {
    id: `TKN-${year}-${pad(db.counters.token)}`,
    tokenNumber: `OPD-${pad(db.counters.token, 3)}`,
    sequence: db.counters.token,
    date: apt.date,
    patientId: apt.patientId,
    doctorId: apt.doctorId,
    department: apt.department,
    appointmentId: apt.id,
    visitType: apt.visitType,
    priority: priorityOverride ?? apt.priority,
    status: "Waiting",
    createdAt: nowIso,
  };

  db.tokens.push(token);
  apt.tokenId = token.id;
  apt.status = "Checked In";
  apt.updatedAt = nowIso;

  const linkedFollowUp = db.followUps.find(
    (f) => f.followUpAppointmentId === apt.id
  );
  if (linkedFollowUp && linkedFollowUp.status === "Upcoming") {
    linkedFollowUp.status = "Checked In";
    linkedFollowUp.updatedAt = nowIso;
  }

  writeOpdDb(db);
  return { token, appointment: apt };
}

export function registerWalkIn(input: {
  existingPatientId?: string;
  newPatient?: {
    fullName: string;
    dateOfBirth: string;
    gender: Gender;
    phone: string;
    email?: string;
    address?: string;
    bloodGroup?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    allergies?: string;
  };
  department: string;
  doctorId: string;
  priority?: PriorityLevel;
  reason?: string;
}): { patient: OpdPatient; appointment: OpdAppointment; token: OpdToken } {
  const { department, doctorId } = input;
  if (!department || !doctorId) {
    throw new OpdValidationError("Department and doctor are required for walk-in.");
  }

  let patient: OpdPatient;
  if (input.existingPatientId) {
    const dbCheck = readOpdDb();
    const found = dbCheck.patients.find((p) => p.id === input.existingPatientId);
    if (!found) {
      throw new OpdValidationError(
        `Patient ${input.existingPatientId} not found.`,
        404
      );
    }
    patient = found;
  } else if (input.newPatient) {
    patient = registerPatient(input.newPatient);
  } else {
    throw new OpdValidationError(
      "Select an existing patient or provide new patient details."
    );
  }

  const db = readOpdDb();
  const doctor = db.doctors.find((d) => d.id === doctorId);
  if (!doctor) {
    throw new OpdValidationError(`Doctor ${doctorId} not found.`, 404);
  }
  if (doctor.department !== department) {
    throw new OpdValidationError(
      `${doctor.name} belongs to ${doctor.department}, not ${department}.`
    );
  }

  const today = getTodayIso();
  const nowIso = new Date().toISOString();
  const now = new Date();
  const walkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  db.counters.appointment += 1;
  db.counters.token += 1;
  const year = now.getFullYear();

  const appointmentId = `APT-${year}-${pad(db.counters.appointment)}`;
  const tokenId = `TKN-${year}-${pad(db.counters.token)}`;
  const priority: PriorityLevel = input.priority ?? "Normal";

  const appointment: OpdAppointment = {
    id: appointmentId,
    patientId: patient.id,
    department,
    doctorId,
    date: today,
    timeSlot: walkInTime,
    visitType: "Walk-in",
    priority,
    reason: input.reason?.trim() || "Walk-in OPD Visit",
    status: "Checked In",
    tokenId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const token: OpdToken = {
    id: tokenId,
    tokenNumber: `OPD-${pad(db.counters.token, 3)}`,
    sequence: db.counters.token,
    date: today,
    patientId: patient.id,
    doctorId,
    department,
    appointmentId,
    visitType: "Walk-in",
    priority,
    status: "Waiting",
    createdAt: nowIso,
  };

  db.appointments.unshift(appointment);
  db.tokens.push(token);
  writeOpdDb(db);

  return { patient, appointment, token };
}

const PRIORITY_WEIGHT: Record<PriorityLevel, number> = {
  Urgent: 0,
  Priority: 1,
  Normal: 2,
};

export function updateQueueToken(input: {
  action: "call-next" | "call" | "start" | "skip" | "requeue" | "complete";
  tokenId?: string;
  doctorId?: string;
}): OpdToken {
  const db = readOpdDb();
  const nowIso = new Date().toISOString();

  let token: OpdToken | undefined;

  if (input.action === "call-next") {
    const waiting = db.tokens
      .filter(
        (t) =>
          t.status === "Waiting" &&
          (!input.doctorId || t.doctorId === input.doctorId)
      )
      .sort((a, b) => {
        const pDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        if (pDiff !== 0) return pDiff;
        return a.sequence - b.sequence;
      });

    if (waiting.length === 0) {
      throw new OpdValidationError("No waiting patients in the selected queue.", 404);
    }
    token = waiting[0];
    token.status = "Called";
    token.calledAt = nowIso;
  } else {
    if (!input.tokenId) {
      throw new OpdValidationError("Token ID is required for this queue action.");
    }
    token = db.tokens.find((t) => t.id === input.tokenId);
    if (!token) {
      throw new OpdValidationError(`Token ${input.tokenId} not found.`, 404);
    }

    const statusMap: Record<
      Exclude<typeof input.action, "call-next">,
      TokenStatus
    > = {
      call: "Called",
      start: "In Consultation",
      skip: "Skipped",
      requeue: "Waiting",
      complete: "Completed",
    };

    token.status = statusMap[input.action];
    if (input.action === "call") token.calledAt = nowIso;
    if (input.action === "start") token.startedAt = nowIso;
    if (input.action === "complete") token.completedAt = nowIso;
  }

  // Sync appointment & follow-up status
  const apt = db.appointments.find((a) => a.id === token.appointmentId);
  if (apt) {
    const aptStatusMap: Partial<Record<TokenStatus, AppointmentStatus>> = {
      Waiting: "Checked In",
      Called: "Checked In",
      "In Consultation": "In Consultation",
      Completed: "Completed",
    };
    const mapped = aptStatusMap[token.status];
    if (mapped) {
      apt.status = mapped;
      apt.updatedAt = nowIso;
    }
  }

  if (token.status === "Completed" && apt) {
    const linkedFollowUp = db.followUps.find(
      (f) => f.followUpAppointmentId === apt.id
    );
    if (linkedFollowUp) {
      linkedFollowUp.status = "Completed";
      linkedFollowUp.updatedAt = nowIso;
    }
  }

  writeOpdDb(db);
  return token;
}

export function saveConsultation(input: {
  tokenId: string;
  vitals?: {
    bloodPressure?: string;
    temperature?: string;
    pulse?: string;
    spo2?: string;
  };
  symptoms: string;
  observations: string;
  diagnosis: string;
  clinicalNotes?: string;
  treatment: string;
  status: ConsultationStatus;
}): OpdConsultation {
  const { tokenId, symptoms, observations, diagnosis, treatment, status } = input;
  if (!tokenId) {
    throw new OpdValidationError("Token ID is required to record a consultation.");
  }
  if (!symptoms?.trim() || !diagnosis?.trim() || !treatment?.trim()) {
    throw new OpdValidationError(
      "Symptoms, diagnosis, and treatment plan are required."
    );
  }

  const db = readOpdDb();
  const token = db.tokens.find((t) => t.id === tokenId);
  if (!token) {
    throw new OpdValidationError(`Token ${tokenId} not found.`, 404);
  }

  const nowIso = new Date().toISOString();
  const existing = db.consultations.find((c) => c.tokenId === tokenId);

  let consultation: OpdConsultation;
  if (existing) {
    existing.vitals = {
      bloodPressure: input.vitals?.bloodPressure?.trim() || existing.vitals.bloodPressure,
      temperature: input.vitals?.temperature?.trim() || existing.vitals.temperature,
      pulse: input.vitals?.pulse?.trim() || existing.vitals.pulse,
      spo2: input.vitals?.spo2?.trim() || existing.vitals.spo2,
    };
    existing.symptoms = symptoms.trim();
    existing.observations = observations?.trim() ?? "";
    existing.diagnosis = diagnosis.trim();
    existing.clinicalNotes = input.clinicalNotes?.trim() ?? "";
    existing.treatment = treatment.trim();
    existing.status = status;
    existing.updatedAt = nowIso;
    consultation = existing;
  } else {
    db.counters.consultation += 1;
    const year = new Date().getFullYear();
    consultation = {
      id: `CON-${year}-${pad(db.counters.consultation)}`,
      patientId: token.patientId,
      doctorId: token.doctorId,
      department: token.department,
      appointmentId: token.appointmentId,
      tokenId: token.id,
      visitDate: token.date,
      vitals: {
        bloodPressure: input.vitals?.bloodPressure?.trim() || "120/80 mmHg",
        temperature: input.vitals?.temperature?.trim() || "98.6 °F",
        pulse: input.vitals?.pulse?.trim() || "74 bpm",
        spo2: input.vitals?.spo2?.trim() || "99%",
      },
      symptoms: symptoms.trim(),
      observations: observations?.trim() ?? "",
      diagnosis: diagnosis.trim(),
      clinicalNotes: input.clinicalNotes?.trim() ?? "",
      treatment: treatment.trim(),
      status,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.consultations.unshift(consultation);
  }

  // Sync token, appointment, and linked follow-up
  const apt = db.appointments.find((a) => a.id === token.appointmentId);
  if (status === "Completed") {
    token.status = "Completed";
    token.completedAt = nowIso;
    if (apt) {
      apt.status = "Completed";
      apt.updatedAt = nowIso;
    }
    const linkedFollowUp = db.followUps.find(
      (f) => f.followUpAppointmentId === token.appointmentId
    );
    if (linkedFollowUp) {
      linkedFollowUp.status = "Completed";
      linkedFollowUp.updatedAt = nowIso;
    }
  } else {
    token.status = "In Consultation";
    token.startedAt = token.startedAt ?? nowIso;
    if (apt) {
      apt.status = "In Consultation";
      apt.updatedAt = nowIso;
    }
  }

  writeOpdDb(db);
  return consultation;
}

export function scheduleFollowUp(input: {
  originalConsultationId: string;
  scheduledDate: string;
  timeSlot: string;
  doctorId?: string;
  instructions?: string;
}): { followUp: OpdFollowUp; appointment: OpdAppointment } {
  const { originalConsultationId, scheduledDate, timeSlot } = input;
  if (!originalConsultationId || !scheduledDate || !timeSlot) {
    throw new OpdValidationError(
      "Original consultation, follow-up date, and time slot are required."
    );
  }

  const db = readOpdDb();
  const consultation = db.consultations.find(
    (c) => c.id === originalConsultationId
  );
  if (!consultation) {
    throw new OpdValidationError(
      `Consultation ${originalConsultationId} not found.`,
      404
    );
  }

  const doctorId = input.doctorId?.trim() || consultation.doctorId;
  const doctor = db.doctors.find((d) => d.id === doctorId);
  if (!doctor) {
    throw new OpdValidationError(`Doctor ${doctorId} not found.`, 404);
  }

  if (!doctor.slots.includes(timeSlot)) {
    throw new OpdValidationError(
      `Time slot ${timeSlot} is not available in ${doctor.name}'s schedule.`
    );
  }

  const conflict = db.appointments.find(
    (apt) =>
      apt.doctorId === doctorId &&
      apt.date === scheduledDate &&
      apt.timeSlot === timeSlot &&
      apt.status !== "Cancelled"
  );
  if (conflict) {
    throw new OpdValidationError(
      `${doctor.name} already has an appointment on ${scheduledDate} at ${timeSlot}.`,
      409
    );
  }

  const nowIso = new Date().toISOString();
  const year = new Date().getFullYear();

  db.counters.appointment += 1;
  db.counters.followUp += 1;

  const followUpAppointment: OpdAppointment = {
    id: `APT-${year}-${pad(db.counters.appointment)}`,
    patientId: consultation.patientId,
    department: doctor.department,
    doctorId,
    date: scheduledDate,
    timeSlot,
    visitType: "Follow-up",
    priority: "Normal",
    reason: `Follow-up for ${consultation.diagnosis} (${consultation.id})`,
    status: "Scheduled",
    originalConsultationId: consultation.id,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const followUp: OpdFollowUp = {
    id: `FUP-${year}-${pad(db.counters.followUp)}`,
    originalConsultationId: consultation.id,
    originalAppointmentId: consultation.appointmentId,
    followUpAppointmentId: followUpAppointment.id,
    patientId: consultation.patientId,
    doctorId,
    department: doctor.department,
    scheduledDate,
    timeSlot,
    instructions: input.instructions?.trim() || "Review recovery progress and test results.",
    status: "Upcoming",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  consultation.followUpId = followUp.id;
  db.appointments.unshift(followUpAppointment);
  db.followUps.unshift(followUp);
  writeOpdDb(db);

  return { followUp, appointment: followUpAppointment };
}

export function updateFollowUpStatus(
  followUpId: string,
  status: FollowUpStatus
): OpdFollowUp {
  const db = readOpdDb();
  const followUp = db.followUps.find((f) => f.id === followUpId);
  if (!followUp) {
    throw new OpdValidationError(`Follow-up ${followUpId} not found.`, 404);
  }
  const nowIso = new Date().toISOString();
  followUp.status = status;
  followUp.updatedAt = nowIso;

  const apt = db.appointments.find((a) => a.id === followUp.followUpAppointmentId);
  if (apt) {
    if (status === "Cancelled") apt.status = "Cancelled";
    if (status === "Completed") apt.status = "Completed";
    apt.updatedAt = nowIso;
  }

  writeOpdDb(db);
  return followUp;
}
