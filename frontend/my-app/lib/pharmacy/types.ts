export type PharmacyRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Pharmacist"
  | "Pharmacy Technician"
  | "Doctor"
  | "Nurse"
  | "Patient";

export interface PharmacyDoctor {
  id: string;
  name: string;
  department: string;
}

export interface PharmacyPatient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
}

export interface PharmacySupplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  licenseNumber: string;
  status: "Active" | "Inactive";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PharmacyMedicine {
  id: string;
  medicineCode: string;
  medicineName: string;
  genericName: string;
  brand: string;
  category: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  unitPrice: number;
  minStockThreshold: number;
  availableStock: number;
  reservedQty: number;
  dispensedQty: number;
  stockAlert: "In Stock" | "Low Stock" | "Out of Stock";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PharmacyHistoryEntry {
  status?: string;
  action?: string;
  staff: string;
  timestamp: string;
  note: string;
}

export interface PharmacyBatch {
  id: string;
  batchNumber: string;
  medicineId: string;
  supplierId?: string;
  manufacturer: string;
  initialQty: number;
  remainingQty: number;
  purchaseDate: string;
  manufacturingDate: string;
  expiryDate: string;
  unitCost: number;
  status: "Active" | "Expired" | "Quarantined" | "Disposed" | "Depleted";
  expiryHistory: PharmacyHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface PharmacyStockMovement {
  id: string;
  medicineId: string;
  batchId?: string;
  movementType:
    | "Received"
    | "Dispensed"
    | "Adjustment"
    | "Quarantined"
    | "Disposed";
  quantityDelta: number;
  balanceAfter: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface PrescriptionItem {
  medicineId: string;
  medicineCode: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribedQty: number;
  dispensedQty: number;
}

export interface PharmacyPrescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  items: PrescriptionItem[];
  status:
    | "Pending"
    | "Processing"
    | "Partially Fulfilled"
    | "Completed"
    | "Cancelled";
  validatedBy?: string;
  validatedAt?: string;
  processingHistory: PharmacyHistoryEntry[];
  prescribedAt: string;
  updatedAt: string;
}

export interface PharmacyDispensing {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantityDispensed: number;
  dosageInstructions: string;
  dispensedBy: string;
  dispensedAt: string;
}

export interface PharmacyState {
  doctors: PharmacyDoctor[];
  patients: PharmacyPatient[];
  suppliers: PharmacySupplier[];
  medicines: PharmacyMedicine[];
  batches: PharmacyBatch[];
  stockMovements: PharmacyStockMovement[];
  prescriptions: PharmacyPrescription[];
  dispensings: PharmacyDispensing[];
}
