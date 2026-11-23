export type BillingRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Finance Manager"
  | "Billing Staff"
  | "Insurance Coordinator"
  | "Doctor"
  | "Patient";

export type BillingCategory =
  | "OPD"
  | "IPD"
  | "Surgery"
  | "Laboratory"
  | "Pharmacy";

export type PaymentMethod =
  | "Cash"
  | "Card"
  | "UPI"
  | "Bank Transfer"
  | "Insurance";

export interface BillingPatient {
  id: string;
  fullName: string;
  phone: string;
  gender: string;
}

export interface BillingLineItem {
  description: string;
  code?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BillingInvoice {
  id: string;
  billNumber: string;
  patientId: string;
  patientName: string;
  category: BillingCategory;
  sourceReferenceId: string;
  items: BillingLineItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  depositApplied: number;
  paidAmount: number;
  refundedAmount: number;
  outstandingBalance: number;
  status:
    | "Unpaid"
    | "Pending"
    | "Partially Paid"
    | "Paid"
    | "Overdue"
    | "Cancelled"
    | "Refunded";
  dueDate: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPayment {
  id: string;
  invoiceId: string;
  patientId: string;
  patientName: string;
  amount: number;
  paymentType: "Full" | "Partial" | "Advance" | "Insurance Settlement";
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  receivedBy: string;
  notes: string;
  paidAt: string;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  tpaCode: string;
  contactPhone: string;
  contactEmail: string;
  coverageNotes: string;
  isActive: boolean;
  createdAt: string;
}

export interface ClaimHistoryEntry {
  status: string;
  staff: string;
  timestamp: string;
  note: string;
}

export interface InsuranceClaim {
  id: string;
  invoiceId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  policyNumber: string;
  coverageVerified: boolean;
  preAuthNumber: string;
  claimedAmount: number;
  approvedAmount: number;
  settledAmount: number;
  status:
    | "Pre-Auth Requested"
    | "Submitted"
    | "Under Review"
    | "Approved"
    | "Rejected"
    | "Settled";
  rejectionReason: string;
  submittedBy: string;
  history: ClaimHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface BillingRefund {
  id: string;
  invoiceId: string;
  paymentId?: string;
  patientId: string;
  patientName: string;
  refundType: "Full" | "Partial";
  amount: number;
  refundMethod: Exclude<PaymentMethod, "Insurance">;
  reason: string;
  authorizedBy: string;
  processedBy: string;
  refundedAt: string;
}

export interface BillingAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorRole: string;
  actorName: string;
  details: string;
  createdAt: string;
}

export interface BillingSourceRecord {
  id: string;
  patientId: string;
  patientName: string;
  label: string;
  suggestedItems: {
    description: string;
    code?: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface BillingState {
  patients: BillingPatient[];
  invoices: BillingInvoice[];
  payments: BillingPayment[];
  providers: InsuranceProvider[];
  claims: InsuranceClaim[];
  refunds: BillingRefund[];
  auditLogs: BillingAuditLog[];
  sources: {
    opd: BillingSourceRecord[];
    ipd: BillingSourceRecord[];
    surgery: BillingSourceRecord[];
    laboratory: BillingSourceRecord[];
    pharmacy: BillingSourceRecord[];
  };
}
