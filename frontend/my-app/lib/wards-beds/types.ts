export type WardBedRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Ward Manager"
  | "Doctor"
  | "Nurse"
  | "Housekeeping Supervisors"
  | "Infection Control Officer";

export interface WardRecord {
  id: string;
  name: string;
  wardType: string;
  department: string;
  location: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BedRecord {
  id: string;
  wardId?: string;
  department: string;
  ward: string;
  room: string;
  bedNumber: string;
  bedType: string;
  status: "Available" | "Occupied" | "Reserved" | "Under Cleaning" | "Maintenance";
  currentAdmissionId?: string;
  isIsolation: boolean;
  isolationType: string;
  isolationReason: string;
  cleaningStatus: "Pending Cleaning" | "Cleaning in Progress" | "Cleaned";
}

export interface WardAdmissionSummary {
  id: string;
  patientId: string;
  patientName: string;
  admittingDoctor: string;
  department: string;
  ward: string;
  room: string;
  bedId: string;
  bedLabel: string;
  diagnosis: string;
  status: string;
}

export interface BedAllocationRecord {
  id: string;
  bedId: string;
  admissionId: string;
  patientId: string;
  patientName: string;
  wardName: string;
  room: string;
  bedNumber: string;
  isIsolation: boolean;
  isolationReason: string;
  allocatedBy: string;
  allocatedAt: string;
  releasedAt?: string;
  status: string;
}

export interface BedTransferRecord {
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

export interface BedCleaningLog {
  id: string;
  bedId: string;
  wardName: string;
  bedNumber: string;
  isIsolationBed: boolean;
  cleaningStatus: "Pending Cleaning" | "Cleaning in Progress" | "Cleaned";
  sanitizationProtocol: string;
  responsibleStaff: string;
  notes: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface WardOccupancyRow {
  wardId: string;
  wardName: string;
  department: string;
  wardType: string;
  configuredCapacity: number;
  totalBeds: number;
  occupied: number;
  available: number;
  unavailable: number;
  utilizationPercent: number;
}

export interface DepartmentOccupancyRow {
  department: string;
  totalBeds: number;
  occupied: number;
  available: number;
  unavailable: number;
  utilizationPercent: number;
}

export interface WardBedState {
  wards: WardRecord[];
  beds: BedRecord[];
  admissions: WardAdmissionSummary[];
  allocations: BedAllocationRecord[];
  transfers: BedTransferRecord[];
  cleaningLogs: BedCleaningLog[];
  occupancy: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    reservedBeds: number;
    cleaningBeds: number;
    maintenanceBeds: number;
    unavailableBeds: number;
    utilizationRate: number;
    wardOccupancy: WardOccupancyRow[];
    departmentOccupancy: DepartmentOccupancyRow[];
  };
}
