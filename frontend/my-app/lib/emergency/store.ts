import fs from "node:fs";
import path from "node:path";
import type {
  AlertSeverity,
  ArrivalMode,
  CriticalAlert,
  EmergencyDatabase,
  EmergencyPatientSummary,
  EmergencyQueueStatus,
  EmergencyRegistration,
  EmergencyTreatmentRecord,
  EmergencyType,
  Gender,
  TransferDestination,
  TransferRecord,
  TransferStatus,
  TraumaInjuryType,
  TraumaProgressStatus,
  TraumaRecord,
  TraumaSeverity,
  TreatmentStatus,
  TriageAssessment,
  TriageLevel,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const EMERGENCY_DB_FILE = path.join(DATA_DIR, "emergency-db.json");
const OPD_DB_FILE = path.join(DATA_DIR, "opd-db.json");

function pad(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

export const TRIAGE_PRIORITY_RANK: Record<TriageLevel | "Unassessed", number> =
  {
    "Level 1 - Resuscitation": 1,
    "Level 2 - Emergent": 2,
    "Level 3 - Urgent": 3,
    "Level 4 - Less Urgent": 4,
    "Level 5 - Non-Urgent": 5,
    Unassessed: 6,
  };

export class EmergencyValidationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "EmergencyValidationError";
    this.statusCode = statusCode;
  }
}

function createSeedEmergencyDb(): EmergencyDatabase {
  const nowIso = new Date().toISOString();
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const twentyFiveMinAgo = new Date(Date.now() - 25 * 60 * 1000).toISOString();

  return {
    staff: [
      {
        id: "ER-DOC-01",
        name: "Dr. Arjun Sen",
        role: "Emergency Physician",
        specialty: "Trauma & Resuscitation",
      },
      {
        id: "ER-DOC-02",
        name: "Dr. Meera Iyer",
        role: "Emergency Physician",
        specialty: "Acute Cardiac & Stroke Care",
      },
      {
        id: "ER-DOC-03",
        name: "Dr. Kabir Malhotra",
        role: "Trauma Surgeon",
        specialty: "Orthopedic & Polytrauma",
      },
      {
        id: "ER-RN-01",
        name: "Nurse Elena Gomez",
        role: "Triage Charge Nurse",
        specialty: "Emergency Triage",
      },
      {
        id: "ER-RN-02",
        name: "Nurse Rohan Das",
        role: "Critical Care Nurse",
        specialty: "Resuscitation Bay",
      },
    ],
    patients: [
      {
        id: "PAT-UNK-0001",
        fullName: "Unknown Male #1 (RTA)",
        ageOrDob: "Est. 35 yrs",
        gender: "Male",
        phone: "Unknown",
        bloodGroup: "Unknown",
        allergies: "Unknown",
        isUnknown: true,
        distinguishingMarks: "Blue jacket, no ID found at scene",
      },
      {
        id: "PAT-2026-0002",
        fullName: "Vikram Rao",
        ageOrDob: "1972-09-22",
        gender: "Male",
        phone: "9811223344",
        bloodGroup: "B+",
        allergies: "None",
        isUnknown: false,
      },
    ],
    registrations: [
      {
        id: "EMG-2026-0001",
        patientId: "PAT-UNK-0001",
        patientName: "Unknown Male #1 (RTA)",
        isUnknownIdentity: true,
        arrivalTime: twentyFiveMinAgo,
        arrivalMode: "Ambulance",
        emergencyType: "Trauma",
        presentingComplaints:
          "High-speed road traffic accident, suspected polytrauma and hypotension",
        assignedBay: "Trauma Bay 1",
        triageLevel: "Level 1 - Resuscitation",
        queueStatus: "Under Treatment",
        registeredBy: "Emergency Staff",
        createdAt: twentyFiveMinAgo,
        updatedAt: tenMinAgo,
      },
      {
        id: "EMG-2026-0002",
        patientId: "PAT-2026-0002",
        patientName: "Vikram Rao",
        isUnknownIdentity: false,
        arrivalTime: tenMinAgo,
        arrivalMode: "Walk-in",
        emergencyType: "Cardiac",
        presentingComplaints:
          "Acute substernal chest tightness radiating to left arm, diaphoresis",
        assignedBay: "ER Bay 3",
        triageLevel: "Level 2 - Emergent",
        queueStatus: "Waiting",
        registeredBy: "Nurse Elena Gomez",
        createdAt: tenMinAgo,
        updatedAt: tenMinAgo,
      },
    ],
    triages: [
      {
        id: "TRI-2026-0001",
        emergencyId: "EMG-2026-0001",
        patientId: "PAT-UNK-0001",
        triageLevel: "Level 1 - Resuscitation",
        vitals: {
          bloodPressure: "86/54 mmHg",
          heartRate: "126 bpm",
          respiratoryRate: "28 /min",
          spo2: "89%",
          temperature: "97.6 °F",
          gcsScore: "11/15",
          painScore: "9/10",
        },
        symptoms: "Severe hypotension, chest tenderness, open tibial fracture",
        severitySummary: "Immediate life-saving resuscitation required",
        assessmentNotes:
          "Two large-bore IV lines established; massive transfusion protocol on standby.",
        assessedBy: "Nurse Elena Gomez",
        assessedAt: twentyFiveMinAgo,
        updatedAt: twentyFiveMinAgo,
      },
      {
        id: "TRI-2026-0002",
        emergencyId: "EMG-2026-0002",
        patientId: "PAT-2026-0002",
        triageLevel: "Level 2 - Emergent",
        vitals: {
          bloodPressure: "152/94 mmHg",
          heartRate: "102 bpm",
          respiratoryRate: "22 /min",
          spo2: "95%",
          temperature: "98.4 °F",
          gcsScore: "15/15",
          painScore: "8/10",
        },
        symptoms: "Substernal chest pain, mild shortness of breath",
        severitySummary: "High risk ACS — STAT ECG and Troponin ordered",
        assessmentNotes: "Placed on continuous cardiac telemetry and O2 2L/min.",
        assessedBy: "Nurse Elena Gomez",
        assessedAt: tenMinAgo,
        updatedAt: tenMinAgo,
      },
    ],
    traumas: [
      {
        id: "TRM-2026-0001",
        emergencyId: "EMG-2026-0001",
        patientId: "PAT-UNK-0001",
        injuryType: "Polytrauma",
        severity: "Critical",
        mechanismOfInjury: "Motorcycle vs. SUV collision at ~60 km/h",
        affectedBodyAreas: ["Chest", "Abdomen", "Lower Limbs"],
        airwayStatus: "Patent with high-flow O2 mask",
        bleedingControl: "Pressure dressing applied to right lower leg",
        assessmentNotes:
          "FAST ultrasound positive for minimal free fluid; trauma surgery consulting.",
        treatmentProgress: "Active Resuscitation",
        recordedBy: "Dr. Kabir Malhotra",
        createdAt: twentyFiveMinAgo,
        updatedAt: tenMinAgo,
      },
    ],
    treatments: [
      {
        id: "ETR-2026-0001",
        emergencyId: "EMG-2026-0001",
        patientId: "PAT-UNK-0001",
        attendingDoctor: "Dr. Arjun Sen",
        emergencyStaffInvolved: "Dr. Kabir Malhotra, Nurse Rohan Das",
        vitals: {
          bloodPressure: "94/60 mmHg",
          heartRate: "118 bpm",
          spo2: "94%",
          temperature: "97.8 °F",
        },
        diagnosis: "Polytrauma with Hypovolemic Shock & Open Tibia Fracture",
        observations: "Responding partially to crystalloid bolus; FAST positive",
        treatmentsAndProcedures:
          "2x 16G IV access, 1L Ringer Lactate bolus, FAST exam, pelvic binder",
        medicationsAdministered:
          "Tranexamic Acid 1g IV, Fentanyl 50mcg IV, Cefazolin 2g IV",
        status: "Ongoing",
        outcome: "Prepared for urgent surgical / ICU escalation",
        recordedAt: tenMinAgo,
        updatedAt: nowIso,
      },
    ],
    alerts: [
      {
        id: "ALT-2026-0001",
        emergencyId: "EMG-2026-0001",
        patientId: "PAT-UNK-0001",
        patientName: "Unknown Male #1 (RTA)",
        assignedBay: "Trauma Bay 1",
        alertType: "Code Trauma / Resuscitation",
        severity: "Critical",
        conditionSummary:
          "Level 1 Polytrauma with hypotension (BP 86/54, SpO2 89%). Immediate trauma team & blood bank standby.",
        notifiedGroups: [
          "Emergency Physicians",
          "Trauma Team",
          "Blood Bank",
          "OT Emergency",
        ],
        status: "Acknowledged",
        triggeredBy: "Nurse Elena Gomez",
        triggeredAt: twentyFiveMinAgo,
        acknowledgedBy: "Dr. Arjun Sen",
        acknowledgedAt: tenMinAgo,
      },
      {
        id: "ALT-2026-0002",
        emergencyId: "EMG-2026-0002",
        patientId: "PAT-2026-0002",
        patientName: "Vikram Rao",
        assignedBay: "ER Bay 3",
        alertType: "STAT Cardiac Evaluation",
        severity: "High",
        conditionSummary:
          "Acute chest pain with diaphoresis in post-PCI patient. Immediate ECG interpretation required.",
        notifiedGroups: ["Emergency Physicians", "Cardiology STAT"],
        status: "Unresolved",
        triggeredBy: "Nurse Elena Gomez",
        triggeredAt: tenMinAgo,
      },
    ],
    transfers: [
      {
        id: "TRF-2026-0001",
        emergencyId: "EMG-2026-0001",
        patientId: "PAT-UNK-0001",
        fromLocation: "Trauma Bay 1",
        destination: "Operating Theatre (OT)",
        targetBedOrUnit: "OT-08 Emergency Trauma Suite",
        reason: "Positive FAST exam & open fracture requiring urgent surgical control",
        requestedBy: "Dr. Arjun Sen",
        responsibleStaff: "Dr. Kabir Malhotra",
        handoverDetails:
          "2 units O- RBC cross-matched; TXA & antibiotics given; airway stable on O2.",
        status: "Requested",
        requestedAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    counters: {
      unknownPatient: 1,
      newPatient: 10,
      registration: 2,
      triage: 2,
      trauma: 1,
      treatment: 1,
      alert: 2,
      transfer: 1,
    },
  };
}

function readSharedOpdPatients(): EmergencyPatientSummary[] {
  if (!fs.existsSync(OPD_DB_FILE)) return [];
  try {
    const raw = fs.readFileSync(OPD_DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as {
      patients?: Array<{
        id: string;
        fullName: string;
        dateOfBirth: string;
        gender: Gender;
        phone: string;
        bloodGroup: string;
        allergies: string;
      }>;
    };
    return (parsed.patients ?? []).map((p) => ({
      id: p.id,
      fullName: p.fullName,
      ageOrDob: p.dateOfBirth,
      gender: p.gender,
      phone: p.phone,
      bloodGroup: p.bloodGroup || "Unknown",
      allergies: p.allergies || "None",
      isUnknown: false,
    }));
  } catch {
    return [];
  }
}

export function readEmergencyDb(): EmergencyDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  let db: EmergencyDatabase;
  if (!fs.existsSync(EMERGENCY_DB_FILE)) {
    db = createSeedEmergencyDb();
    writeEmergencyDb(db);
  } else {
    db = JSON.parse(
      fs.readFileSync(EMERGENCY_DB_FILE, "utf-8")
    ) as EmergencyDatabase;
  }

  // Merge existing OPD patients (read-only) so emergency staff can select them seamlessly
  const opdPatients = readSharedOpdPatients();
  const knownIds = new Set(db.patients.map((p) => p.id));
  const mergedPatients = [...db.patients];
  for (const op of opdPatients) {
    if (!knownIds.has(op.id)) {
      mergedPatients.push(op);
      knownIds.add(op.id);
    }
  }
  return { ...db, patients: mergedPatients };
}

export function writeEmergencyDb(db: EmergencyDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempPath = `${EMERGENCY_DB_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tempPath, EMERGENCY_DB_FILE);
}

// 1. Emergency Registration
export function createEmergencyRegistration(input: {
  mode: "existing" | "new" | "unknown";
  existingPatientId?: string;
  newPatient?: {
    fullName: string;
    ageOrDob: string;
    gender: Gender;
    phone: string;
    bloodGroup?: string;
    allergies?: string;
  };
  unknownPatient?: {
    alias?: string;
    estimatedAge?: string;
    gender?: Gender;
    distinguishingMarks?: string;
  };
  arrivalTime?: string;
  arrivalMode: ArrivalMode;
  emergencyType: EmergencyType;
  presentingComplaints: string;
  assignedBay?: string;
  registeredBy: string;
}): { registration: EmergencyRegistration; patient: EmergencyPatientSummary } {
  if (!input.presentingComplaints?.trim()) {
    throw new EmergencyValidationError("Presenting complaints are required.");
  }

  const db = readEmergencyDb();
  const nowIso = new Date().toISOString();
  const year = new Date().getFullYear();

  let patient: EmergencyPatientSummary;

  if (input.mode === "existing") {
    const found = db.patients.find((p) => p.id === input.existingPatientId);
    if (!found) {
      throw new EmergencyValidationError(
        `Existing patient ${input.existingPatientId ?? ""} not found.`,
        404
      );
    }
    patient = found;
    // Persist copy in emergency db if it came from OPD
    if (
      !fs.existsSync(EMERGENCY_DB_FILE) ||
      !db.patients.some((p) => p.id === found.id)
    ) {
      db.patients.unshift(found);
    }
  } else if (input.mode === "new") {
    const np = input.newPatient;
    if (!np?.fullName?.trim() || !np.phone?.trim()) {
      throw new EmergencyValidationError(
        "Full name and contact phone are required for new patient registration."
      );
    }
    db.counters.newPatient += 1;
    patient = {
      id: `PAT-${year}-${pad(db.counters.newPatient)}`,
      fullName: np.fullName.trim(),
      ageOrDob: np.ageOrDob?.trim() || "Not provided",
      gender: np.gender || "Other",
      phone: np.phone.trim(),
      bloodGroup: np.bloodGroup?.trim() || "Unknown",
      allergies: np.allergies?.trim() || "None",
      isUnknown: false,
    };
    db.patients.unshift(patient);
  } else {
    db.counters.unknownPatient += 1;
    const unkNum = db.counters.unknownPatient;
    const gender = input.unknownPatient?.gender || "Unknown";
    const alias =
      input.unknownPatient?.alias?.trim() ||
      `Unknown ${gender === "Unknown" ? "Patient" : gender} #${unkNum}`;
    patient = {
      id: `PAT-UNK-${pad(unkNum)}`,
      fullName: alias,
      ageOrDob: input.unknownPatient?.estimatedAge?.trim() || "Unknown",
      gender,
      phone: "Unknown",
      bloodGroup: "Unknown",
      allergies: "Unknown",
      isUnknown: true,
      distinguishingMarks:
        input.unknownPatient?.distinguishingMarks?.trim() ||
        "Unidentified emergency arrival",
    };
    db.patients.unshift(patient);
  }

  db.counters.registration += 1;
  const regId = `EMG-${year}-${pad(db.counters.registration)}`;
  const registration: EmergencyRegistration = {
    id: regId,
    patientId: patient.id,
    patientName: patient.fullName,
    isUnknownIdentity: patient.isUnknown,
    arrivalTime: input.arrivalTime?.trim() || nowIso,
    arrivalMode: input.arrivalMode || "Walk-in",
    emergencyType: input.emergencyType || "General Emergency",
    presentingComplaints: input.presentingComplaints.trim(),
    assignedBay:
      input.assignedBay?.trim() ||
      (input.emergencyType === "Trauma"
        ? `Trauma Bay ${((db.counters.registration - 1) % 4) + 1}`
        : `ER Bay ${((db.counters.registration - 1) % 8) + 1}`),
    triageLevel: "Unassessed",
    queueStatus: "Waiting",
    registeredBy: input.registeredBy || "Emergency Staff",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.registrations.unshift(registration);
  writeEmergencyDb(db);
  return { registration, patient };
}

// 2. Triage Assessment (Create or Update + Auto Critical Alert for Level 1)
export function saveTriageAssessment(input: {
  emergencyId: string;
  triageLevel: TriageLevel;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    respiratoryRate: string;
    spo2: string;
    temperature: string;
    gcsScore: string;
    painScore: string;
  };
  symptoms: string;
  severitySummary: string;
  assessmentNotes?: string;
  assessedBy: string;
}): { triage: TriageAssessment; autoAlert?: CriticalAlert } {
  if (!input.emergencyId || !input.triageLevel || !input.symptoms?.trim()) {
    throw new EmergencyValidationError(
      "Emergency case, triage priority level, and symptoms are required."
    );
  }

  const db = readEmergencyDb();
  const reg = db.registrations.find((r) => r.id === input.emergencyId);
  if (!reg) {
    throw new EmergencyValidationError(
      `Emergency registration ${input.emergencyId} not found.`,
      404
    );
  }

  const nowIso = new Date().toISOString();
  const existing = db.triages.find((t) => t.emergencyId === input.emergencyId);
  let triage: TriageAssessment;

  if (existing) {
    existing.triageLevel = input.triageLevel;
    existing.vitals = { ...input.vitals };
    existing.symptoms = input.symptoms.trim();
    existing.severitySummary =
      input.severitySummary?.trim() || input.triageLevel;
    existing.assessmentNotes = input.assessmentNotes?.trim() ?? "";
    existing.assessedBy = input.assessedBy || existing.assessedBy;
    existing.updatedAt = nowIso;
    triage = existing;
  } else {
    db.counters.triage += 1;
    const year = new Date().getFullYear();
    triage = {
      id: `TRI-${year}-${pad(db.counters.triage)}`,
      emergencyId: reg.id,
      patientId: reg.patientId,
      triageLevel: input.triageLevel,
      vitals: { ...input.vitals },
      symptoms: input.symptoms.trim(),
      severitySummary: input.severitySummary?.trim() || input.triageLevel,
      assessmentNotes: input.assessmentNotes?.trim() ?? "",
      assessedBy: input.assessedBy || "Triage Staff",
      assessedAt: nowIso,
      updatedAt: nowIso,
    };
    db.triages.unshift(triage);
  }

  // Sync triage priority directly onto registration (reflects immediately in Emergency Queue)
  reg.triageLevel = input.triageLevel;
  reg.updatedAt = nowIso;

  // Auto-raise critical alert if Level 1 Resuscitation and no open alert exists for this case
  let autoAlert: CriticalAlert | undefined;
  const hasOpenAlert = db.alerts.some(
    (a) => a.emergencyId === reg.id && a.status !== "Resolved"
  );
  if (input.triageLevel === "Level 1 - Resuscitation" && !hasOpenAlert) {
    db.counters.alert += 1;
    const year = new Date().getFullYear();
    autoAlert = {
      id: `ALT-${year}-${pad(db.counters.alert)}`,
      emergencyId: reg.id,
      patientId: reg.patientId,
      patientName: reg.patientName,
      assignedBay: reg.assignedBay,
      alertType: `Critical Triage (${reg.emergencyType})`,
      severity: "Critical",
      conditionSummary: `${input.triageLevel}: ${input.symptoms.trim()} (BP ${input.vitals.bloodPressure}, SpO2 ${input.vitals.spo2})`,
      notifiedGroups: ["Emergency Physicians", "Trauma Team", "ICU Team"],
      status: "Unresolved",
      triggeredBy: input.assessedBy || "Triage Assessment",
      triggeredAt: nowIso,
    };
    db.alerts.unshift(autoAlert);
  }

  writeEmergencyDb(db);
  return { triage, autoAlert };
}

// 3. Emergency Queue Status Update
export function updateEmergencyQueueStatus(input: {
  emergencyId: string;
  queueStatus: EmergencyQueueStatus;
  assignedBay?: string;
}): EmergencyRegistration {
  const db = readEmergencyDb();
  const reg = db.registrations.find((r) => r.id === input.emergencyId);
  if (!reg) {
    throw new EmergencyValidationError(
      `Emergency registration ${input.emergencyId} not found.`,
      404
    );
  }

  reg.queueStatus = input.queueStatus;
  if (input.assignedBay?.trim()) {
    reg.assignedBay = input.assignedBay.trim();
  }
  reg.updatedAt = new Date().toISOString();
  writeEmergencyDb(db);
  return reg;
}

// 4. Trauma Management
export function saveTraumaRecord(input: {
  traumaId?: string;
  emergencyId: string;
  injuryType: TraumaInjuryType;
  severity: TraumaSeverity;
  mechanismOfInjury: string;
  affectedBodyAreas: string[];
  airwayStatus?: string;
  bleedingControl?: string;
  assessmentNotes?: string;
  treatmentProgress: TraumaProgressStatus;
  recordedBy: string;
}): TraumaRecord {
  if (
    !input.emergencyId ||
    !input.injuryType ||
    !input.mechanismOfInjury?.trim() ||
    !input.affectedBodyAreas?.length
  ) {
    throw new EmergencyValidationError(
      "Emergency case, injury type, mechanism of injury, and at least one affected body area are required."
    );
  }

  const db = readEmergencyDb();
  const reg = db.registrations.find((r) => r.id === input.emergencyId);
  if (!reg) {
    throw new EmergencyValidationError(
      `Emergency registration ${input.emergencyId} not found.`,
      404
    );
  }

  const nowIso = new Date().toISOString();

  if (input.traumaId) {
    const existing = db.traumas.find((t) => t.id === input.traumaId);
    if (!existing) {
      throw new EmergencyValidationError(
        `Trauma record ${input.traumaId} not found.`,
        404
      );
    }
    existing.injuryType = input.injuryType;
    existing.severity = input.severity;
    existing.mechanismOfInjury = input.mechanismOfInjury.trim();
    existing.affectedBodyAreas = input.affectedBodyAreas;
    existing.airwayStatus = input.airwayStatus?.trim() || existing.airwayStatus;
    existing.bleedingControl =
      input.bleedingControl?.trim() || existing.bleedingControl;
    existing.assessmentNotes = input.assessmentNotes?.trim() ?? "";
    existing.treatmentProgress = input.treatmentProgress;
    existing.updatedAt = nowIso;
    writeEmergencyDb(db);
    return existing;
  }

  db.counters.trauma += 1;
  const year = new Date().getFullYear();
  const record: TraumaRecord = {
    id: `TRM-${year}-${pad(db.counters.trauma)}`,
    emergencyId: reg.id,
    patientId: reg.patientId,
    injuryType: input.injuryType,
    severity: input.severity,
    mechanismOfInjury: input.mechanismOfInjury.trim(),
    affectedBodyAreas: input.affectedBodyAreas,
    airwayStatus: input.airwayStatus?.trim() || "Patent",
    bleedingControl: input.bleedingControl?.trim() || "None required",
    assessmentNotes: input.assessmentNotes?.trim() ?? "",
    treatmentProgress: input.treatmentProgress || "Active Resuscitation",
    recordedBy: input.recordedBy || "Trauma Team",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.traumas.unshift(record);
  if (reg.queueStatus === "Waiting") {
    reg.queueStatus = "Under Treatment";
    reg.updatedAt = nowIso;
  }
  writeEmergencyDb(db);
  return record;
}

export function updateTraumaProgress(
  traumaId: string,
  treatmentProgress: TraumaProgressStatus
): TraumaRecord {
  const db = readEmergencyDb();
  const record = db.traumas.find((t) => t.id === traumaId);
  if (!record) {
    throw new EmergencyValidationError(`Trauma record ${traumaId} not found.`, 404);
  }
  record.treatmentProgress = treatmentProgress;
  record.updatedAt = new Date().toISOString();
  writeEmergencyDb(db);
  return record;
}

// 5. Emergency Treatment Records
export function createTreatmentRecord(input: {
  emergencyId: string;
  attendingDoctor: string;
  emergencyStaffInvolved?: string;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    spo2: string;
    temperature: string;
  };
  diagnosis: string;
  observations?: string;
  treatmentsAndProcedures: string;
  medicationsAdministered?: string;
  status: TreatmentStatus;
  outcome?: string;
}): EmergencyTreatmentRecord {
  if (
    !input.emergencyId ||
    !input.attendingDoctor?.trim() ||
    !input.diagnosis?.trim() ||
    !input.treatmentsAndProcedures?.trim()
  ) {
    throw new EmergencyValidationError(
      "Emergency case, attending doctor, diagnosis, and treatments/procedures are required."
    );
  }

  const db = readEmergencyDb();
  const reg = db.registrations.find((r) => r.id === input.emergencyId);
  if (!reg) {
    throw new EmergencyValidationError(
      `Emergency registration ${input.emergencyId} not found.`,
      404
    );
  }

  const nowIso = new Date().toISOString();
  db.counters.treatment += 1;
  const year = new Date().getFullYear();

  const record: EmergencyTreatmentRecord = {
    id: `ETR-${year}-${pad(db.counters.treatment)}`,
    emergencyId: reg.id,
    patientId: reg.patientId,
    attendingDoctor: input.attendingDoctor.trim(),
    emergencyStaffInvolved:
      input.emergencyStaffInvolved?.trim() || "Emergency Care Team",
    vitals: {
      bloodPressure: input.vitals?.bloodPressure?.trim() || "120/80 mmHg",
      heartRate: input.vitals?.heartRate?.trim() || "80 bpm",
      spo2: input.vitals?.spo2?.trim() || "98%",
      temperature: input.vitals?.temperature?.trim() || "98.6 °F",
    },
    diagnosis: input.diagnosis.trim(),
    observations: input.observations?.trim() ?? "",
    treatmentsAndProcedures: input.treatmentsAndProcedures.trim(),
    medicationsAdministered: input.medicationsAdministered?.trim() || "None",
    status: input.status || "Ongoing",
    outcome: input.outcome?.trim() || "Monitoring in Emergency",
    recordedAt: nowIso,
    updatedAt: nowIso,
  };

  db.treatments.unshift(record);

  // Sync queue status with treatment outcome
  if (record.status === "Ongoing") reg.queueStatus = "Under Treatment";
  if (record.status === "Stabilized") reg.queueStatus = "Stabilized";
  if (record.status === "Admitted / Transferred") reg.queueStatus = "Transferred";
  if (record.status === "Discharged" || record.status === "Deceased") {
    reg.queueStatus = "Completed";
  }
  reg.updatedAt = nowIso;

  writeEmergencyDb(db);
  return record;
}

// 6. Critical Alerts
export function createCriticalAlert(input: {
  emergencyId: string;
  alertType: string;
  severity: AlertSeverity;
  conditionSummary: string;
  notifiedGroups: string[];
  triggeredBy: string;
}): CriticalAlert {
  if (
    !input.emergencyId ||
    !input.alertType?.trim() ||
    !input.conditionSummary?.trim()
  ) {
    throw new EmergencyValidationError(
      "Emergency case, alert type, and condition summary are required."
    );
  }

  const db = readEmergencyDb();
  const reg = db.registrations.find((r) => r.id === input.emergencyId);
  if (!reg) {
    throw new EmergencyValidationError(
      `Emergency registration ${input.emergencyId} not found.`,
      404
    );
  }

  const nowIso = new Date().toISOString();
  db.counters.alert += 1;
  const year = new Date().getFullYear();

  const alert: CriticalAlert = {
    id: `ALT-${year}-${pad(db.counters.alert)}`,
    emergencyId: reg.id,
    patientId: reg.patientId,
    patientName: reg.patientName,
    assignedBay: reg.assignedBay,
    alertType: input.alertType.trim(),
    severity: input.severity || "Critical",
    conditionSummary: input.conditionSummary.trim(),
    notifiedGroups:
      input.notifiedGroups?.length > 0
        ? input.notifiedGroups
        : ["Emergency Physicians"],
    status: "Unresolved",
    triggeredBy: input.triggeredBy || "Emergency Staff",
    triggeredAt: nowIso,
  };

  db.alerts.unshift(alert);
  writeEmergencyDb(db);
  return alert;
}

export function updateCriticalAlert(input: {
  alertId: string;
  action: "acknowledge" | "resolve";
  actor: string;
  resolutionNotes?: string;
}): CriticalAlert {
  const db = readEmergencyDb();
  const alert = db.alerts.find((a) => a.id === input.alertId);
  if (!alert) {
    throw new EmergencyValidationError(`Alert ${input.alertId} not found.`, 404);
  }

  const nowIso = new Date().toISOString();
  if (input.action === "acknowledge") {
    alert.status = "Acknowledged";
    alert.acknowledgedBy = input.actor || "Emergency Staff";
    alert.acknowledgedAt = nowIso;
  } else {
    alert.status = "Resolved";
    alert.resolvedBy = input.actor || "Emergency Staff";
    alert.resolvedAt = nowIso;
    alert.resolutionNotes =
      input.resolutionNotes?.trim() || "Patient condition stabilized";
  }

  writeEmergencyDb(db);
  return alert;
}

// 7. Transfer Management
export function createTransferRequest(input: {
  emergencyId: string;
  destination: TransferDestination;
  targetBedOrUnit?: string;
  reason: string;
  requestedBy: string;
  responsibleStaff: string;
  handoverDetails: string;
}): TransferRecord {
  if (
    !input.emergencyId ||
    !input.destination ||
    !input.reason?.trim() ||
    !input.responsibleStaff?.trim()
  ) {
    throw new EmergencyValidationError(
      "Emergency case, destination, transfer reason, and responsible staff are required."
    );
  }

  const db = readEmergencyDb();
  const reg = db.registrations.find((r) => r.id === input.emergencyId);
  if (!reg) {
    throw new EmergencyValidationError(
      `Emergency registration ${input.emergencyId} not found.`,
      404
    );
  }

  const nowIso = new Date().toISOString();
  db.counters.transfer += 1;
  const year = new Date().getFullYear();

  const transfer: TransferRecord = {
    id: `TRF-${year}-${pad(db.counters.transfer)}`,
    emergencyId: reg.id,
    patientId: reg.patientId,
    fromLocation: reg.assignedBay,
    destination: input.destination,
    targetBedOrUnit: input.targetBedOrUnit?.trim() || `${input.destination} Receiving`,
    reason: input.reason.trim(),
    requestedBy: input.requestedBy || "Emergency Staff",
    responsibleStaff: input.responsibleStaff.trim(),
    handoverDetails:
      input.handoverDetails?.trim() ||
      "Full emergency triage and treatment records handed over.",
    status: "Requested",
    requestedAt: nowIso,
    updatedAt: nowIso,
  };

  db.transfers.unshift(transfer);
  writeEmergencyDb(db);
  return transfer;
}

export function updateTransferStatus(input: {
  transferId: string;
  status: TransferStatus;
  handoverDetails?: string;
  targetBedOrUnit?: string;
}): TransferRecord {
  const db = readEmergencyDb();
  const transfer = db.transfers.find((t) => t.id === input.transferId);
  if (!transfer) {
    throw new EmergencyValidationError(
      `Transfer ${input.transferId} not found.`,
      404
    );
  }

  const nowIso = new Date().toISOString();
  transfer.status = input.status;
  if (input.handoverDetails?.trim()) {
    transfer.handoverDetails = input.handoverDetails.trim();
  }
  if (input.targetBedOrUnit?.trim()) {
    transfer.targetBedOrUnit = input.targetBedOrUnit.trim();
  }
  if (input.status === "Approved") {
    transfer.approvedAt = nowIso;
  }
  if (input.status === "Completed") {
    transfer.transferredAt = nowIso;
    const reg = db.registrations.find((r) => r.id === transfer.emergencyId);
    if (reg) {
      reg.queueStatus = "Transferred";
      reg.updatedAt = nowIso;
    }
  }
  transfer.updatedAt = nowIso;

  writeEmergencyDb(db);
  return transfer;
}
