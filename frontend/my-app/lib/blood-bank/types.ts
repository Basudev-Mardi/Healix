export type BloodBankRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Blood Bank Staff"
  | "Laboratory Staff"
  | "Doctor"
  | "Nurse"
  | "Donor";

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

export type BloodComponent =
  | "Whole Blood"
  | "RBC"
  | "Platelets"
  | "Plasma"
  | "Cryoprecipitate";

export const BLOOD_GROUPS: BloodGroup[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

export const BLOOD_COMPONENTS: BloodComponent[] = [
  "Whole Blood",
  "RBC",
  "Platelets",
  "Plasma",
  "Cryoprecipitate",
];

export interface BloodBankDoctor {
  id: string;
  name: string;
  department: string;
}

export interface BloodBankPatient {
  id: string;
  fullName: string;
  bloodGroup: string;
  phone: string;
  gender: string;
}

export interface BloodDonor {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: BloodGroup;
  weightKg: number;
  hemoglobinGdl: number;
  medicalHistory: string;
  eligibilityStatus: "Eligible" | "Deferred" | "Ineligible";
  deferralReason: string;
  lastDonationDate: string;
  totalDonations: number;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface BloodUnit {
  id: string;
  donationId: string;
  donorId: string;
  donorName: string;
  sourceUnitId?: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  volumeMl: number;
  collectionCenter: string;
  storageLocation: string;
  storageTemp: string;
  collectionDate: string;
  expiryDate: string;
  screeningStatus: "Pending" | "Cleared" | "Reactive";
  screeningNotes: string;
  status:
    | "Testing"
    | "Available"
    | "Reserved"
    | "Issued"
    | "Transfused"
    | "Expired"
    | "Discarded";
  reservedForRequestId?: string;
  createdAt: string;
}

export interface BloodRequest {
  id: string;
  patientId: string;
  patientName: string;
  department: "OPD" | "IPD" | "Emergency" | "Surgery";
  requestedBloodGroup: BloodGroup;
  component: BloodComponent;
  unitsRequested: number;
  unitsFulfilled: number;
  urgency: "Routine" | "Urgent" | "Emergency";
  requestingDoctor: string;
  clinicalIndication: string;
  status:
    | "Pending"
    | "Approved"
    | "Reserved"
    | "Fulfilled"
    | "Rejected"
    | "Cancelled";
  rejectionReason: string;
  approvedBy?: string;
  requestedAt: string;
}

export interface BloodCompatibilityTest {
  id: string;
  requestId: string;
  patientId: string;
  patientName: string;
  patientBloodGroup: BloodGroup;
  unitId: string;
  donorBloodGroup: BloodGroup;
  component: BloodComponent;
  groupingConfirmed: boolean;
  crossmatchResult: "Compatible" | "Incompatible";
  antibodyScreen: "Negative" | "Positive";
  testedBy: string;
  testedAt: string;
  verificationStatus: "Pending" | "Verified" | "Rejected";
  verifiedBy?: string;
  verifiedAt?: string;
  notes: string;
}

export interface BloodTransfusion {
  id: string;
  requestId: string;
  unitId: string;
  compatibilityTestId: string;
  patientId: string;
  patientName: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  volumeMl: number;
  administeringStaff: string;
  startedAt: string;
  completedAt?: string;
  monitoringObservations: string;
  adverseReaction: string;
  adverseReactionNotes: string;
  status: "In Progress" | "Completed" | "Stopped - Reaction";
}

export interface BloodAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorRole: string;
  actorName: string;
  details: string;
  createdAt: string;
}

export interface BloodBankState {
  doctors: BloodBankDoctor[];
  patients: BloodBankPatient[];
  donors: BloodDonor[];
  units: BloodUnit[];
  requests: BloodRequest[];
  compatibilityTests: BloodCompatibilityTest[];
  transfusions: BloodTransfusion[];
  auditLogs: BloodAuditLog[];
}
