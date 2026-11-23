export type IcuRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "ICU Staff"
  | "Doctor"
  | "Nurse"
  | "Ward Manager"
  | "Pharmacist";

export interface IcuDoctor {
  id: string;
  name: string;
  department: string;
}

export interface IcuPatient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  bloodGroup: string;
  allergies: string;
}

export interface IcuBed {
  id: string;
  department: string;
  ward: string;
  room: string;
  bedNumber: string;
  bedType: string;
  status: string;
  currentAdmissionId?: string;
}

export interface IcuAdmission {
  id: string;
  patientId: string;
  patientName: string;
  admissionDate: string;
  reason: string;
  diagnosis: string;
  referringDoctor: string;
  icuWard: string;
  bedId: string;
  bedLabel: string;
  careTeam: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface IcuMonitoringRecord {
  id: string;
  icuAdmissionId: string;
  patientId: string;
  recordedAt: string;
  responsibleStaff: string;
  patientCondition: string;
  monitoringStatus: string;
  neurologicalStatus: string;
  fluidBalance: string;
  notes: string;
}

export interface IcuVitalThresholds {
  systolicMin: number;
  systolicMax: number;
  heartRateMin: number;
  heartRateMax: number;
  respRateMin: number;
  respRateMax: number;
  tempMin: number;
  tempMax: number;
  spo2Min: number;
  updatedAt: string;
}

export interface IcuVitalSign {
  id: string;
  icuAdmissionId: string;
  patientId: string;
  measuredAt: string;
  responsibleStaff: string;
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  respiratoryRate: number;
  temperatureF: number;
  spo2: number;
  isAbnormal: boolean;
  abnormalFlags: string[];
}

export interface IcuCareNote {
  id: string;
  icuAdmissionId: string;
  patientId: string;
  recordedAt: string;
  authorName: string;
  authorRole: string;
  patientCondition: string;
  clinicalObservations: string;
  diagnosisUpdate: string;
  treatmentUpdate: string;
}

export interface IcuVentilatorRecord {
  id: string;
  icuAdmissionId: string;
  patientId: string;
  recordedAt: string;
  responsibleStaff: string;
  ventilatorStatus: string;
  mode: string;
  fio2Percent: number;
  peepCmh2o: number;
  tidalVolumeMl: number;
  respRateSet: number;
  observations: string;
}

export interface IcuMedication {
  id: string;
  icuAdmissionId: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  route: string;
  frequency: string;
  scheduledTime: string;
  actualAdministeredAt?: string;
  administeringStaff?: string;
  status: "Pending" | "Administered" | "Missed" | "Withheld";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface IcuDisposition {
  id: string;
  icuAdmissionId: string;
  patientId: string;
  dispositionType: "Transfer" | "Discharge";
  destination: string;
  targetBedId?: string;
  reason: string;
  responsibleDoctor: string;
  handoverDetails: string;
  dischargeCondition: string;
  dischargeInstructions: string;
  status: "Requested" | "Approved" | "Completed" | "Cancelled";
  approvedBy?: string;
  requestedAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface IcuState {
  doctors: IcuDoctor[];
  patients: IcuPatient[];
  icuBeds: IcuBed[];
  allBeds: IcuBed[];
  admissions: IcuAdmission[];
  monitoringRecords: IcuMonitoringRecord[];
  vitalSigns: IcuVitalSign[];
  vitalThresholds: IcuVitalThresholds;
  careNotes: IcuCareNote[];
  ventilatorRecords: IcuVentilatorRecord[];
  medications: IcuMedication[];
  dispositions: IcuDisposition[];
}
