export type IpdRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Ward Manager"
  | "Doctor"
  | "Nurse"
  | "Billing Staff"
  | "Pharmacist"
  | "Receptionist";

export interface IpdDoctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
}

export interface IpdPatient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  bloodGroup: string;
  allergies: string;
}

export interface IpdBed {
  id: string;
  department: string;
  ward: string;
  room: string;
  bedNumber: string;
  bedType: string;
  status: "Available" | "Occupied" | "Maintenance";
  currentAdmissionId?: string;
}

export interface IpdAdmissionRequest {
  id: string;
  patientId: string;
  patientName: string;
  department: string;
  requestedBedType: string;
  reason: string;
  priority: string;
  requestedBy: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled" | "Converted";
  reviewedBy?: string;
  reviewNotes?: string;
  convertedAdmissionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IpdAdmission {
  id: string;
  patientId: string;
  patientName: string;
  admissionRequestId?: string;
  admissionDate: string;
  admittingDoctor: string;
  department: string;
  ward: string;
  room: string;
  bedId: string;
  bedLabel: string;
  reason: string;
  diagnosis: string;
  status: "Admitted" | "Under Treatment" | "Discharge Requested" | "Discharged";
  createdAt: string;
  updatedAt: string;
}

export interface IpdTransfer {
  id: string;
  admissionId: string;
  patientId: string;
  fromDepartment: string;
  fromWard: string;
  fromRoom: string;
  fromBedId: string;
  toDepartment: string;
  toWard: string;
  toRoom: string;
  toBedId: string;
  reason: string;
  requestingDoctor: string;
  responsibleStaff: string;
  status: string;
  transferredAt: string;
}

export interface IpdProgressNote {
  id: string;
  admissionId: string;
  patientId: string;
  noteDate: string;
  recordedBy: string;
  recordedRole: string;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    spo2: string;
    respiratoryRate: string;
  };
  symptoms: string;
  observations: string;
  patientCondition: "Stable" | "Improving" | "Guarded" | "Critical";
  createdAt: string;
}

export interface IpdTreatmentPlan {
  id: string;
  admissionId: string;
  patientId: string;
  doctorName: string;
  diagnosis: string;
  treatmentInstructions: string;
  medications: string;
  procedures: string;
  careRequirements: string;
  assignedStaff: string;
  status: "Active" | "Revised" | "Completed" | "Discontinued";
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface IpdDischarge {
  id: string;
  admissionId: string;
  patientId: string;
  dischargeDate: string;
  reason: string;
  clinicalClearance: boolean;
  billingClearance: boolean;
  pharmacyClearance: boolean;
  doctorApproval: boolean;
  approvedBy?: string;
  status: "Pending" | "Completed" | "Cancelled";
  dischargeSummaryId?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface IpdDischargeSummary {
  id: string;
  admissionId: string;
  dischargeId?: string;
  patientId: string;
  admissionDate: string;
  dischargeDate: string;
  finalDiagnosis: string;
  treatmentReceived: string;
  proceduresPerformed: string;
  clinicalProgress: string;
  dischargeMedications: string;
  followUpInstructions: string;
  recommendations: string;
  responsibleDoctor: string;
  authorizedBy: string;
  createdAt: string;
}

export interface IpdState {
  doctors: IpdDoctor[];
  patients: IpdPatient[];
  beds: IpdBed[];
  requests: IpdAdmissionRequest[];
  admissions: IpdAdmission[];
  transfers: IpdTransfer[];
  progressNotes: IpdProgressNote[];
  treatmentPlans: IpdTreatmentPlan[];
  discharges: IpdDischarge[];
  dischargeSummaries: IpdDischargeSummary[];
}
