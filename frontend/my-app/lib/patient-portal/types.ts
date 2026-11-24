export interface PatientProfile {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string;
}

export interface PortalDoctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  room: string;
  slots: string[];
}

export interface PortalAppointment {
  id: string;
  department: string;
  doctorId: string;
  doctorName: string;
  room: string;
  appointmentDate: string;
  timeSlot: string;
  reason: string;
  status: string;
  tokenId?: string;
  cancelReason?: string;
}

export interface PortalToken {
  id: string;
  tokenNumber: string;
  sequence: number;
  tokenDate: string;
  doctorName: string;
  room: string;
  department: string;
  appointmentId: string;
  status: string;
  aheadInQueue: number;
}

export interface PortalConsultation {
  id: string;
  doctorName: string;
  department: string;
  visitDate: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  clinicalNotes: string;
  status: string;
}

export interface PortalPrescriptionItem {
  medicineCode: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribedQty: number;
  dispensedQty: number;
}

export interface PortalPrescription {
  id: string;
  doctorName: string;
  items: PortalPrescriptionItem[];
  status: string;
  prescribedAt: string;
}

export interface PortalLabReport {
  id: string;
  requestId: string;
  referringDoctor: string;
  verifiedBy: string;
  generatedAt: string;
  reportSnapshot: {
    results?: {
      testCode: string;
      testName: string;
      resultValue: string;
      unit: string;
      referenceRange: string;
      isOutOfRange: boolean;
    }[];
  };
}

export interface PortalVerifiedLabResult {
  id: string;
  requestId: string;
  testCode: string;
  testName: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  isOutOfRange: boolean;
  remarks: string;
  verifiedBy: string;
  verifiedAt: string;
}

export interface PortalRadiologyReport {
  id: string;
  modality: string;
  examType: string;
  bodyRegion: string;
  findings: string;
  impression: string;
  radiologistName: string;
  finalizedAt: string;
}

export interface PortalAdmission {
  id: string;
  admissionDate: string;
  admittingDoctor: string;
  department: string;
  ward: string;
  room: string;
  bedLabel: string;
  reason: string;
  diagnosis: string;
  status: string;
}

export interface PortalDischargeSummary {
  id: string;
  admissionId: string;
  admissionDate: string;
  dischargeDate: string;
  finalDiagnosis: string;
  treatmentReceived: string;
  dischargeMedications: string;
  followUpInstructions: string;
  responsibleDoctor: string;
}

export interface PortalInvoice {
  id: string;
  billNumber: string;
  category: string;
  sourceReferenceId: string;
  items: {
    description: string;
    code?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  outstandingBalance: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

export interface PortalPayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  referenceNumber: string;
  paidAt: string;
}

export interface PortalInsuranceClaim {
  id: string;
  invoiceId: string;
  providerName: string;
  policyNumber: string;
  coverageVerified: boolean;
  preAuthNumber: string;
  claimedAmount: number;
  approvedAmount: number;
  settledAmount: number;
  status: string;
  rejectionReason: string;
  updatedAt: string;
}

export interface PortalNotification {
  id: string;
  category: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PortalSupportTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  staffResponse: string;
  respondedAt?: string;
  createdAt: string;
}

export interface PatientPortalState {
  profile: PatientProfile;
  doctors: PortalDoctor[];
  appointments: PortalAppointment[];
  tokens: PortalToken[];
  consultations: PortalConsultation[];
  prescriptions: PortalPrescription[];
  labReports: PortalLabReport[];
  verifiedLabResults: PortalVerifiedLabResult[];
  radiologyReports: PortalRadiologyReport[];
  admissions: PortalAdmission[];
  dischargeSummaries: PortalDischargeSummary[];
  invoices: PortalInvoice[];
  payments: PortalPayment[];
  insuranceClaims: PortalInsuranceClaim[];
  notifications: PortalNotification[];
  supportTickets: PortalSupportTicket[];
}
