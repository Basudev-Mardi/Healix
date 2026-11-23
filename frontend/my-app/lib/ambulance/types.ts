export type AmbulanceRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Ambulance Coordinator"
  | "Driver"
  | "Emergency Staff"
  | "Doctor";

export interface AmbulancePatient {
  id: string;
  fullName: string;
  phone: string;
}

export interface AmbulanceVehicle {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  model: string;
  capacity: number;
  equipmentDetails: string;
  insuranceExpiry: string;
  fitnessCertExpiry: string;
  registrationValidUntil: string;
  maintenanceStatus: "Operational" | "Due Soon" | "Under Maintenance";
  operationalStatus:
    | "Available"
    | "Assigned"
    | "Dispatched"
    | "On-Trip"
    | "Returning"
    | "Under Maintenance"
    | "Unavailable";
  assignedDriverId?: string;
  totalTrips: number;
  totalDistanceKm: number;
  createdAt: string;
}

export interface AmbulanceDriver {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseValidUntil: string;
  experienceYears: number;
  assignedVehicleId?: string;
  availabilityStatus: "Available" | "Assigned" | "On-Trip" | "Off-Duty";
  employmentStatus: "Active" | "On Leave" | "Suspended";
  totalTrips: number;
  createdAt: string;
}

export interface AmbulanceRequest {
  id: string;
  patientId?: string;
  patientName: string;
  contactNumber: string;
  sourceChannel: string;
  pickupLocation: string;
  destinationHospital: string;
  emergencyType: string;
  priority: "Critical" | "High" | "Standard";
  status:
    | "Requested"
    | "Assigned"
    | "Dispatched"
    | "Arrived at Pickup"
    | "Patient Onboard"
    | "Arrived at Hospital"
    | "Completed"
    | "Cancelled";
  cancelReason: string;
  requestedAt: string;
}

export interface DispatchTimelineEntry {
  status: string;
  staff: string;
  timestamp: string;
  note: string;
}

export interface AmbulanceDispatch {
  id: string;
  requestId: string;
  ambulanceId: string;
  registrationNumber: string;
  driverId: string;
  driverName: string;
  pickupLocation: string;
  destinationHospital: string;
  estimatedArrivalMins: number;
  status:
    | "Assigned"
    | "Dispatched"
    | "Arrived at Pickup"
    | "Patient Onboard"
    | "Arrived at Hospital"
    | "Completed"
    | "Cancelled";
  assignedAt: string;
  dispatchedAt?: string;
  arrivedPickupAt?: string;
  patientOnboardAt?: string;
  arrivedHospitalAt?: string;
  completedAt?: string;
  statusTimeline: DispatchTimelineEntry[];
}

export interface AmbulanceTrip {
  id: string;
  dispatchId: string;
  requestId: string;
  ambulanceId: string;
  registrationNumber: string;
  driverId: string;
  driverName: string;
  patientName: string;
  pickupLocation: string;
  dropoffLocation: string;
  departureTime: string;
  arrivalTime: string;
  distanceKm: number;
  durationMins: number;
  fuelUsedLiters: number;
  tripStatus: "Completed" | "Cancelled";
  remarks: string;
}

export interface AmbulanceAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorRole: string;
  actorName: string;
  details: string;
  createdAt: string;
}

export interface AmbulanceState {
  gpsConfigured: boolean;
  patients: AmbulancePatient[];
  vehicles: AmbulanceVehicle[];
  drivers: AmbulanceDriver[];
  requests: AmbulanceRequest[];
  dispatches: AmbulanceDispatch[];
  trips: AmbulanceTrip[];
  auditLogs: AmbulanceAuditLog[];
}
