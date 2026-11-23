export type RadiologyRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Radiologist"
  | "Radiology Technician"
  | "Doctor"
  | "Nurse"
  | "Patient";

export type RadiologyModality = "X-ray" | "CT Scan" | "MRI" | "Ultrasound";

export interface RadiologyDoctor {
  id: string;
  name: string;
  department: string;
}

export interface RadiologyPatient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  bloodGroup: string;
}

export interface RadiologyEquipment {
  id: string;
  name: string;
  modality: RadiologyModality;
  roomLocation: string;
  status: "Available" | "In Use" | "Maintenance";
  updatedAt: string;
}

export interface MriScreeningInfo {
  pacemaker?: boolean;
  metalImplants?: boolean;
  claustrophobia?: boolean;
  contrastAllergy?: boolean;
  renalCleared?: boolean;
  screeningNotes?: string;
}

export interface RadiologyRequest {
  id: string;
  examinationId: string;
  patientId: string;
  patientName: string;
  modality: RadiologyModality;
  examType: string;
  bodyRegion: string;
  clinicalIndication: string;
  instructions: string;
  mriScreening: MriScreeningInfo;
  priority: "Routine" | "Urgent" | "STAT";
  referringDoctor: string;
  assignedTechnician: string;
  examDate: string;
  examTime: string;
  status: "Pending" | "Scheduled" | "In Progress" | "Completed" | "Cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface SchedulingHistoryEntry {
  action: string;
  staff: string;
  timestamp: string;
  note: string;
}

export interface RadiologyAppointment {
  id: string;
  requestId: string;
  examinationId: string;
  patientId: string;
  patientName: string;
  modality: RadiologyModality;
  examType: string;
  equipmentId: string;
  equipmentName: string;
  appointmentDate: string;
  timeSlot: string;
  status: "Scheduled" | "Rescheduled" | "In Progress" | "Completed" | "Cancelled";
  cancelReason: string;
  schedulingHistory: SchedulingHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RadiologyImage {
  id: string;
  requestId: string;
  examinationId: string;
  patientId: string;
  patientName: string;
  modality: RadiologyModality;
  examType: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  imageDataUrl: string;
  uploadedBy: string;
  notes: string;
  uploadedAt: string;
}

export interface ReportHistoryEntry {
  status: string;
  staff: string;
  timestamp: string;
  note: string;
}

export interface RadiologyReport {
  id: string;
  requestId: string;
  examinationId: string;
  patientId: string;
  patientName: string;
  modality: RadiologyModality;
  examType: string;
  bodyRegion: string;
  referringDoctor: string;
  imageIds: string[];
  findings: string;
  observations: string;
  impression: string;
  conclusion: string;
  radiologistName: string;
  status: "Draft" | "Pending Verification" | "Finalized";
  reportHistory: ReportHistoryEntry[];
  createdAt: string;
  finalizedAt?: string;
  updatedAt: string;
}

export interface RadiologyState {
  doctors: RadiologyDoctor[];
  patients: RadiologyPatient[];
  equipment: RadiologyEquipment[];
  requests: RadiologyRequest[];
  appointments: RadiologyAppointment[];
  images: RadiologyImage[];
  reports: RadiologyReport[];
}
