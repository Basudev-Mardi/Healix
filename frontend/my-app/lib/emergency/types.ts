export type EmergencyRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Emergency Staff"
  | "Doctor"
  | "Nurse"
  | "ICU Staff"
  | "Ward Manager"
  | "OT Manager"
  | "Ambulance Operators";

export type Gender = "Male" | "Female" | "Other" | "Unknown";

export type ArrivalMode =
  | "Ambulance"
  | "Walk-in"
  | "Police / Bystander"
  | "External Transfer";

export type EmergencyType =
  | "Trauma"
  | "Cardiac"
  | "Respiratory"
  | "Neurological / Stroke"
  | "Pediatric"
  | "Toxicology"
  | "General Emergency";

export type TriageLevel =
  | "Level 1 - Resuscitation"
  | "Level 2 - Emergent"
  | "Level 3 - Urgent"
  | "Level 4 - Less Urgent"
  | "Level 5 - Non-Urgent";

export type EmergencyQueueStatus =
  | "Waiting"
  | "Under Treatment"
  | "Stabilized"
  | "Transferred"
  | "Completed";

export type TraumaInjuryType =
  | "Blunt Trauma"
  | "Penetrating Trauma"
  | "Fracture / Orthopedic"
  | "Burns"
  | "Head / TBI"
  | "Spinal Injury"
  | "Polytrauma"
  | "Crush Injury";

export type TraumaSeverity = "Critical" | "Severe" | "Moderate" | "Minor";

export type TraumaProgressStatus =
  | "Active Resuscitation"
  | "Stabilized"
  | "In Surgery"
  | "Post-Op Monitoring"
  | "Resolved";

export type TreatmentStatus =
  | "Ongoing"
  | "Stabilized"
  | "Admitted / Transferred"
  | "Discharged"
  | "Deceased";

export type AlertSeverity = "Critical" | "High" | "Moderate";

export type AlertStatus = "Unresolved" | "Acknowledged" | "Resolved";

export type TransferDestination =
  | "ICU"
  | "General Ward"
  | "Operating Theatre (OT)"
  | "Cardiac Care Unit (CCU)"
  | "Radiology / Cath Lab"
  | "External Hospital";

export type TransferStatus =
  | "Requested"
  | "Approved"
  | "In Transit"
  | "Completed"
  | "Cancelled";

export interface EmergencyStaffMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
}

export interface EmergencyPatientSummary {
  id: string; // PAT-YYYY-XXXX or PAT-UNK-XXXX
  fullName: string;
  ageOrDob: string;
  gender: Gender;
  phone: string;
  bloodGroup: string;
  allergies: string;
  isUnknown: boolean;
  distinguishingMarks?: string;
}

export interface EmergencyRegistration {
  id: string; // EMG-2026-0001
  patientId: string;
  patientName: string;
  isUnknownIdentity: boolean;
  arrivalTime: string; // ISO string or YYYY-MM-DDTHH:mm
  arrivalMode: ArrivalMode;
  emergencyType: EmergencyType;
  presentingComplaints: string;
  assignedBay: string;
  triageLevel: TriageLevel | "Unassessed";
  queueStatus: EmergencyQueueStatus;
  registeredBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TriageAssessment {
  id: string; // TRI-2026-0001
  emergencyId: string;
  patientId: string;
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
  assessmentNotes: string;
  assessedBy: string;
  assessedAt: string;
  updatedAt: string;
}

export interface TraumaRecord {
  id: string; // TRM-2026-0001
  emergencyId: string;
  patientId: string;
  injuryType: TraumaInjuryType;
  severity: TraumaSeverity;
  mechanismOfInjury: string;
  affectedBodyAreas: string[];
  airwayStatus: string;
  bleedingControl: string;
  assessmentNotes: string;
  treatmentProgress: TraumaProgressStatus;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyTreatmentRecord {
  id: string; // ETR-2026-0001
  emergencyId: string;
  patientId: string;
  attendingDoctor: string;
  emergencyStaffInvolved: string;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    spo2: string;
    temperature: string;
  };
  diagnosis: string;
  observations: string;
  treatmentsAndProcedures: string;
  medicationsAdministered: string;
  status: TreatmentStatus;
  outcome: string;
  recordedAt: string;
  updatedAt: string;
}

export interface CriticalAlert {
  id: string; // ALT-2026-0001
  emergencyId: string;
  patientId: string;
  patientName: string;
  assignedBay: string;
  alertType: string;
  severity: AlertSeverity;
  conditionSummary: string;
  notifiedGroups: string[];
  status: AlertStatus;
  triggeredBy: string;
  triggeredAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface TransferRecord {
  id: string; // TRF-2026-0001
  emergencyId: string;
  patientId: string;
  fromLocation: string;
  destination: TransferDestination;
  targetBedOrUnit: string;
  reason: string;
  requestedBy: string;
  responsibleStaff: string;
  handoverDetails: string;
  status: TransferStatus;
  requestedAt: string;
  approvedAt?: string;
  transferredAt?: string;
  updatedAt: string;
}

export interface EmergencyDatabase {
  staff: EmergencyStaffMember[];
  patients: EmergencyPatientSummary[];
  registrations: EmergencyRegistration[];
  triages: TriageAssessment[];
  traumas: TraumaRecord[];
  treatments: EmergencyTreatmentRecord[];
  alerts: CriticalAlert[];
  transfers: TransferRecord[];
  counters: {
    unknownPatient: number;
    newPatient: number;
    registration: number;
    triage: number;
    trauma: number;
    treatment: number;
    alert: number;
    transfer: number;
  };
}
