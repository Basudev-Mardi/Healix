export type OpdRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Receptionist"
  | "Doctor"
  | "Nurse"
  | "Patient";

export type Gender = "Male" | "Female" | "Other";

export type AppointmentStatus =
  | "Scheduled"
  | "Rescheduled"
  | "Checked In"
  | "In Consultation"
  | "Completed"
  | "Cancelled";

export type VisitType = "Appointment" | "Walk-in" | "Follow-up";

export type PriorityLevel = "Normal" | "Priority" | "Urgent";

export type TokenStatus =
  | "Waiting"
  | "Called"
  | "In Consultation"
  | "Skipped"
  | "Completed"
  | "Cancelled";

export type ConsultationStatus = "In Progress" | "Completed";

export type FollowUpStatus =
  | "Upcoming"
  | "Checked In"
  | "Completed"
  | "Cancelled";

export interface OpdDoctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  room: string;
  availableDays: number[]; // 0 = Sun ... 6 = Sat
  slots: string[]; // e.g. ["09:00", "09:30", ...]
}

export interface OpdPatient {
  id: string; // e.g., PAT-2026-0001
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string;
  createdAt: string;
}

export interface OpdAppointment {
  id: string; // e.g., APT-2026-0001
  patientId: string;
  department: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  visitType: VisitType;
  priority: PriorityLevel;
  reason: string;
  status: AppointmentStatus;
  tokenId?: string;
  originalConsultationId?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpdToken {
  id: string; // e.g., TKN-2026-0001
  tokenNumber: string; // e.g., OPD-001
  sequence: number;
  date: string; // YYYY-MM-DD
  patientId: string;
  doctorId: string;
  department: string;
  appointmentId: string;
  visitType: VisitType;
  priority: PriorityLevel;
  status: TokenStatus;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface OpdConsultation {
  id: string; // e.g., CON-2026-0001
  patientId: string;
  doctorId: string;
  department: string;
  appointmentId: string;
  tokenId: string;
  visitDate: string; // YYYY-MM-DD
  vitals: {
    bloodPressure: string;
    temperature: string;
    pulse: string;
    spo2: string;
  };
  symptoms: string;
  observations: string;
  diagnosis: string;
  clinicalNotes: string;
  treatment: string;
  status: ConsultationStatus;
  followUpId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpdFollowUp {
  id: string; // e.g., FUP-2026-0001
  originalConsultationId: string;
  originalAppointmentId: string;
  followUpAppointmentId: string;
  patientId: string;
  doctorId: string;
  department: string;
  scheduledDate: string;
  timeSlot: string;
  instructions: string;
  status: FollowUpStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OpdDatabase {
  doctors: OpdDoctor[];
  patients: OpdPatient[];
  appointments: OpdAppointment[];
  tokens: OpdToken[];
  consultations: OpdConsultation[];
  followUps: OpdFollowUp[];
  counters: {
    patient: number;
    appointment: number;
    token: number;
    consultation: number;
    followUp: number;
  };
}
