export type LabRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Laboratory Staff"
  | "Doctor"
  | "Nurse"
  | "Patient";

export interface LabDoctor {
  id: string;
  name: string;
  department: string;
}

export interface LabPatient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  bloodGroup: string;
}

export interface LabTest {
  id: string;
  testCode: string;
  testName: string;
  category: string;
  description: string;
  specimenType: string;
  department: string;
  resultFormat: "Numerical" | "Qualitative";
  unit: string;
  refMin?: number;
  refMax?: number;
  referenceRangeLabel: string;
  price: number;
  turnaroundMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabRequest {
  id: string;
  patientId: string;
  patientName: string;
  referringDoctor: string;
  priority: "Routine" | "Urgent" | "STAT";
  clinicalNotes: string;
  testIds: string[];
  status: "Pending" | "Accepted" | "Processing" | "Completed" | "Cancelled";
  requestedAt: string;
  updatedAt: string;
}

export interface LabSampleTrackingEntry {
  stage: string;
  staff: string;
  timestamp: string;
  note: string;
}

export interface LabSample {
  id: string;
  requestId: string;
  patientId: string;
  specimenType: string;
  collectedBy: string;
  collectedAt: string;
  status: "Collected" | "Received" | "Processing" | "Rejected" | "Completed";
  rejectionReason: string;
  notes: string;
  trackingHistory: LabSampleTrackingEntry[];
  updatedAt: string;
}

export interface LabResult {
  id: string;
  requestId: string;
  sampleId: string;
  patientId: string;
  testId: string;
  testCode: string;
  testName: string;
  resultFormat: "Numerical" | "Qualitative";
  resultValue: string;
  unit: string;
  referenceRange: string;
  isOutOfRange: boolean;
  remarks: string;
  processedBy: string;
  processedAt: string;
  verificationStatus: "Pending" | "Verified" | "Rejected";
  verifiedBy?: string;
  verifiedAt?: string;
  correctionNotes: string;
  updatedAt: string;
}

export interface LabReportSnapshot {
  requestId: string;
  sampleId: string;
  specimenType: string;
  patient: {
    id: string;
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    phone?: string;
  };
  referringDoctor: string;
  priority: string;
  clinicalNotes: string;
  verifiedBy: string;
  results: LabResult[];
}

export interface LabReport {
  id: string;
  requestId: string;
  patientId: string;
  patientName: string;
  referringDoctor: string;
  verifiedBy: string;
  generatedBy: string;
  generatedAt: string;
  reportSnapshot: LabReportSnapshot;
}

export interface LabState {
  doctors: LabDoctor[];
  patients: LabPatient[];
  tests: LabTest[];
  requests: LabRequest[];
  samples: LabSample[];
  results: LabResult[];
  reports: LabReport[];
}
