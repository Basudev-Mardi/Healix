export type OtRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "OT Manager"
  | "Doctor"
  | "Nurse"
  | "ICU Staff"
  | "Ward Manager"
  | "Housekeeping Supervisors";

export interface OtPatient {
  id: string;
  fullName: string;
  gender: string;
  phone: string;
  bloodGroup: string;
  allergies: string;
}

export interface OtTheatre {
  id: string;
  name: string;
  specialty: string;
  location: string;
  status: "Available" | "Occupied" | "Reserved" | "Cleaning" | "Maintenance";
  currentSurgeryId?: string;
  updatedAt: string;
}

export interface OtSurgeon {
  id: string;
  name: string;
  specialty: string;
  roleType: string;
  isAvailable: boolean;
}

export interface OtSurgery {
  id: string;
  patientId: string;
  patientName: string;
  admissionId?: string;
  theatreId: string;
  theatreName: string;
  diagnosis: string;
  surgeryType: string;
  procedureName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  priority: string;
  status:
    | "Scheduled"
    | "Confirmed"
    | "Ready"
    | "In Progress"
    | "Completed"
    | "Cancelled";
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OtSurgeonAssignment {
  id: string;
  surgeryId: string;
  surgeonId: string;
  surgeonName: string;
  specialty: string;
  assignedRole: string;
  assignedBy: string;
  assignedAt: string;
}

export interface OtPreOpChecklist {
  id: string;
  surgeryId: string;
  patientId: string;
  identityVerified: boolean;
  procedureConfirmed: boolean;
  consentSigned: boolean;
  allergiesReviewed: boolean;
  allergiesNotes: string;
  npoConfirmed: boolean;
  preopLabsReady: boolean;
  anesthesiaClearance: boolean;
  siteMarked: boolean;
  preparationNotes: string;
  status: "Pending" | "Verified";
  verifiedBy?: string;
  verifiedAt?: string;
  updatedAt: string;
}

export interface OtSurgicalRecord {
  id: string;
  surgeryId: string;
  patientId: string;
  procedurePerformed: string;
  surgeryDate: string;
  actualStartTime: string;
  actualEndTime: string;
  primarySurgeon: string;
  assistingSurgeons: string;
  participatingStaff: string;
  surgicalFindings: string;
  operativeNotes: string;
  complications: string;
  outcome: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OtAnesthesiaRecord {
  id: string;
  surgeryId: string;
  patientId: string;
  anesthesiologist: string;
  anesthesiaType: string;
  preAnesthesiaAssessment: string;
  medicationsAndDosages: string;
  intraopMonitoring: string;
  anesthesiaStartTime: string;
  anesthesiaEndTime: string;
  recoveryDetails: string;
  observations: string;
  createdAt: string;
  updatedAt: string;
}

export interface OtPostOpRecord {
  id: string;
  surgeryId: string;
  surgicalRecordId?: string;
  patientId: string;
  recordedAt: string;
  responsibleStaff: string;
  patientCondition: string;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    spo2: string;
    temperature: string;
  };
  painScore: string;
  recoveryStatus: string;
  medicationsAndCare: string;
  complications: string;
  observations: string;
  transferDestination: string;
}

export interface OtState {
  patients: OtPatient[];
  theatres: OtTheatre[];
  surgeons: OtSurgeon[];
  surgeries: OtSurgery[];
  assignments: OtSurgeonAssignment[];
  checklists: OtPreOpChecklist[];
  surgicalRecords: OtSurgicalRecord[];
  anesthesiaRecords: OtAnesthesiaRecord[];
  postOpRecords: OtPostOpRecord[];
}
