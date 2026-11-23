import type { PoolClient } from "pg";
import { getPool } from "../db/client.js";
import { HttpError } from "../opd/service.js";
import type { AmbulanceRole } from "./permissions.js";

export interface TimelineEntry {
  status: string;
  staff: string;
  timestamp: string;
  note: string;
}

function pad(n: number, size = 4): string {
  return String(n).padStart(size, "0");
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function nextCounter(key: string, client?: PoolClient): Promise<number> {
  const runner = client ?? getPool();
  const res = await runner.query(
    `INSERT INTO entity_counters (counter_key, current_value)
     VALUES ($1, 1)
     ON CONFLICT (counter_key)
     DO UPDATE SET current_value = entity_counters.current_value + 1
     RETURNING current_value`,
    [key]
  );
  return Number(res.rows[0].current_value);
}

async function writeAudit(
  entry: {
    entityType: string;
    entityId: string;
    action: string;
    actorRole: string;
    actorName: string;
    details: string;
  },
  client?: PoolClient
) {
  const runner = client ?? getPool();
  const seq = await nextCounter("ambulance_audit", client);
  await runner.query(
    `INSERT INTO ambulance_audit_logs (
      id, entity_type, entity_id, action, actor_role, actor_name, details
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      `AAUD-${new Date().getFullYear()}-${pad(seq)}`,
      entry.entityType,
      entry.entityId,
      entry.action,
      entry.actorRole,
      entry.actorName,
      entry.details,
    ]
  );
}

function mapVehicle(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    registrationNumber: r.registration_number as string,
    vehicleType: r.vehicle_type as string,
    model: r.model as string,
    capacity: Number(r.capacity),
    equipmentDetails: (r.equipment_details as string) ?? "",
    insuranceExpiry: r.insurance_expiry as string,
    fitnessCertExpiry: r.fitness_cert_expiry as string,
    registrationValidUntil: r.registration_valid_until as string,
    maintenanceStatus: r.maintenance_status as
      | "Operational"
      | "Due Soon"
      | "Under Maintenance",
    operationalStatus: r.operational_status as
      | "Available"
      | "Assigned"
      | "Dispatched"
      | "On-Trip"
      | "Returning"
      | "Under Maintenance"
      | "Unavailable",
    assignedDriverId: (r.assigned_driver_id as string | null) ?? undefined,
    totalTrips: Number(r.total_trips),
    totalDistanceKm: Number(r.total_distance_km),
    createdAt: (r.created_at as Date).toISOString(),
  };
}

function mapDriver(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    fullName: r.full_name as string,
    phone: r.phone as string,
    email: (r.email as string) ?? "",
    licenseNumber: r.license_number as string,
    licenseValidUntil: r.license_valid_until as string,
    experienceYears: Number(r.experience_years),
    assignedVehicleId: (r.assigned_vehicle_id as string | null) ?? undefined,
    availabilityStatus: r.availability_status as
      | "Available"
      | "Assigned"
      | "On-Trip"
      | "Off-Duty",
    employmentStatus: r.employment_status as "Active" | "On Leave" | "Suspended",
    totalTrips: Number(r.total_trips),
    createdAt: (r.created_at as Date).toISOString(),
  };
}

function mapRequest(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    patientId: (r.patient_id as string | null) ?? undefined,
    patientName: r.patient_name as string,
    contactNumber: r.contact_number as string,
    sourceChannel: r.source_channel as string,
    pickupLocation: r.pickup_location as string,
    destinationHospital: r.destination_hospital as string,
    emergencyType: r.emergency_type as string,
    priority: r.priority as "Critical" | "High" | "Standard",
    status: r.status as
      | "Requested"
      | "Assigned"
      | "Dispatched"
      | "Arrived at Pickup"
      | "Patient Onboard"
      | "Arrived at Hospital"
      | "Completed"
      | "Cancelled",
    cancelReason: (r.cancel_reason as string) ?? "",
    requestedAt: (r.requested_at as Date).toISOString(),
  };
}

function mapDispatch(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    requestId: r.request_id as string,
    ambulanceId: r.ambulance_id as string,
    registrationNumber: r.registration_number as string,
    driverId: r.driver_id as string,
    driverName: r.driver_name as string,
    pickupLocation: r.pickup_location as string,
    destinationHospital: r.destination_hospital as string,
    estimatedArrivalMins: Number(r.estimated_arrival_mins),
    status: r.status as
      | "Assigned"
      | "Dispatched"
      | "Arrived at Pickup"
      | "Patient Onboard"
      | "Arrived at Hospital"
      | "Completed"
      | "Cancelled",
    assignedAt: (r.assigned_at as Date).toISOString(),
    dispatchedAt: r.dispatched_at
      ? (r.dispatched_at as Date).toISOString()
      : undefined,
    arrivedPickupAt: r.arrived_pickup_at
      ? (r.arrived_pickup_at as Date).toISOString()
      : undefined,
    patientOnboardAt: r.patient_onboard_at
      ? (r.patient_onboard_at as Date).toISOString()
      : undefined,
    arrivedHospitalAt: r.arrived_hospital_at
      ? (r.arrived_hospital_at as Date).toISOString()
      : undefined,
    completedAt: r.completed_at
      ? (r.completed_at as Date).toISOString()
      : undefined,
    statusTimeline: (r.status_timeline as TimelineEntry[]) ?? [],
  };
}

function mapTrip(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    dispatchId: r.dispatch_id as string,
    requestId: r.request_id as string,
    ambulanceId: r.ambulance_id as string,
    registrationNumber: r.registration_number as string,
    driverId: r.driver_id as string,
    driverName: r.driver_name as string,
    patientName: r.patient_name as string,
    pickupLocation: r.pickup_location as string,
    dropoffLocation: r.dropoff_location as string,
    departureTime: (r.departure_time as Date).toISOString(),
    arrivalTime: (r.arrival_time as Date).toISOString(),
    distanceKm: Number(r.distance_km),
    durationMins: Number(r.duration_mins),
    fuelUsedLiters: Number(r.fuel_used_liters),
    tripStatus: r.trip_status as "Completed" | "Cancelled",
    remarks: (r.remarks as string) ?? "",
  };
}

function mapAudit(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    entityType: r.entity_type as string,
    entityId: r.entity_id as string,
    action: r.action as string,
    actorRole: r.actor_role as string,
    actorName: r.actor_name as string,
    details: (r.details as string) ?? "",
    createdAt: (r.created_at as Date).toISOString(),
  };
}

export async function getAmbulanceState() {
  const pool = getPool();
  const [patRes, vehRes, drvRes, reqRes, dspRes, trpRes, audRes] =
    await Promise.all([
      pool.query(
        "SELECT id, full_name, phone FROM patients ORDER BY created_at DESC"
      ),
      pool.query("SELECT * FROM ambulance_vehicles ORDER BY id ASC"),
      pool.query("SELECT * FROM ambulance_drivers ORDER BY full_name ASC"),
      pool.query("SELECT * FROM ambulance_requests ORDER BY requested_at DESC"),
      pool.query("SELECT * FROM ambulance_dispatches ORDER BY assigned_at DESC"),
      pool.query("SELECT * FROM ambulance_trips ORDER BY arrival_time DESC"),
      pool.query(
        "SELECT * FROM ambulance_audit_logs ORDER BY created_at DESC LIMIT 80"
      ),
    ]);

  return {
    gpsConfigured: Boolean(process.env.AMBULANCE_GPS_API_KEY),
    patients: patRes.rows.map((p) => ({
      id: p.id as string,
      fullName: p.full_name as string,
      phone: (p.phone as string) ?? "",
    })),
    vehicles: vehRes.rows.map(mapVehicle),
    drivers: drvRes.rows.map(mapDriver),
    requests: reqRes.rows.map(mapRequest),
    dispatches: dspRes.rows.map(mapDispatch),
    trips: trpRes.rows.map(mapTrip),
    auditLogs: audRes.rows.map(mapAudit),
  };
}

// 1. Ambulance Registration & Availability Management
export async function registerVehicle(input: {
  registrationNumber: string;
  vehicleType: string;
  model: string;
  capacity?: number;
  equipmentDetails?: string;
  insuranceExpiry: string;
  fitnessCertExpiry: string;
  registrationValidUntil: string;
  actorRole: AmbulanceRole;
  actorName: string;
}) {
  if (
    !input.registrationNumber?.trim() ||
    !input.vehicleType?.trim() ||
    !input.model?.trim() ||
    !input.insuranceExpiry?.trim() ||
    !input.fitnessCertExpiry?.trim() ||
    !input.registrationValidUntil?.trim()
  ) {
    throw new HttpError(
      "Registration number, type, model, and insurance/fitness/registration validity dates are required."
    );
  }

  const reg = input.registrationNumber.trim().toUpperCase();
  const pool = getPool();
  const dup = await pool.query(
    "SELECT id FROM ambulance_vehicles WHERE UPPER(registration_number) = $1",
    [reg]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(`Ambulance ${reg} is already registered.`, 409);
  }

  const seq = await nextCounter("ambulance_vehicle");
  const id = `AMB-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO ambulance_vehicles (
      id, registration_number, vehicle_type, model, capacity, equipment_details,
      insurance_expiry, fitness_cert_expiry, registration_valid_until
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      id,
      reg,
      input.vehicleType.trim(),
      input.model.trim(),
      Math.max(1, Number(input.capacity ?? 2)),
      input.equipmentDetails?.trim() ?? "",
      input.insuranceExpiry.trim(),
      input.fitnessCertExpiry.trim(),
      input.registrationValidUntil.trim(),
    ]
  );

  await writeAudit({
    entityType: "Vehicle",
    entityId: id,
    action: "Registered",
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `Registered ${input.vehicleType} ambulance ${reg} (${input.model})`,
  });

  return mapVehicle(res.rows[0]);
}

export async function updateVehicleStatus(input: {
  ambulanceId: string;
  operationalStatus:
    | "Available"
    | "Returning"
    | "Under Maintenance"
    | "Unavailable";
  maintenanceStatus?: "Operational" | "Due Soon" | "Under Maintenance";
  actorRole: AmbulanceRole;
  actorName: string;
}) {
  const pool = getPool();
  const curRes = await pool.query(
    "SELECT * FROM ambulance_vehicles WHERE id = $1",
    [input.ambulanceId]
  );
  if (curRes.rowCount === 0) {
    throw new HttpError(`Ambulance ${input.ambulanceId} not found.`, 404);
  }
  const v = mapVehicle(curRes.rows[0]);
  if (
    v.operationalStatus === "Assigned" ||
    v.operationalStatus === "Dispatched" ||
    v.operationalStatus === "On-Trip"
  ) {
    throw new HttpError(
      `Cannot manually change status while ${v.registrationNumber} is on an active dispatch (${v.operationalStatus}).`,
      409
    );
  }

  const maintStatus =
    input.maintenanceStatus ??
    (input.operationalStatus === "Under Maintenance"
      ? "Under Maintenance"
      : "Operational");

  const res = await pool.query(
    `UPDATE ambulance_vehicles
     SET operational_status = $2, maintenance_status = $3, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [v.id, input.operationalStatus, maintStatus]
  );

  await writeAudit({
    entityType: "Vehicle",
    entityId: v.id,
    action: "Status Updated",
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `${v.registrationNumber} set to ${input.operationalStatus} (${maintStatus})`,
  });

  return mapVehicle(res.rows[0]);
}

// 2. Driver Management
export async function registerDriver(input: {
  fullName: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseValidUntil: string;
  experienceYears?: number;
  assignedVehicleId?: string;
  actorRole: AmbulanceRole;
  actorName: string;
}) {
  if (
    !input.fullName?.trim() ||
    !input.phone?.trim() ||
    !input.licenseNumber?.trim() ||
    !input.licenseValidUntil?.trim()
  ) {
    throw new HttpError(
      "Driver full name, phone, license number, and license validity date are required."
    );
  }

  if (input.licenseValidUntil <= todayIso()) {
    throw new HttpError(
      "Cannot register driver with an expired driving license.",
      400
    );
  }

  const lic = input.licenseNumber.trim().toUpperCase();
  const pool = getPool();
  const dup = await pool.query(
    "SELECT id FROM ambulance_drivers WHERE UPPER(license_number) = $1",
    [lic]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(`Driving license ${lic} is already registered.`, 409);
  }

  const seq = await nextCounter("ambulance_driver");
  const id = `DRV-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO ambulance_drivers (
      id, full_name, phone, email, license_number, license_valid_until,
      experience_years, assigned_vehicle_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      id,
      input.fullName.trim(),
      input.phone.trim(),
      input.email?.trim() ?? "",
      lic,
      input.licenseValidUntil.trim(),
      Math.max(0, Number(input.experienceYears ?? 2)),
      input.assignedVehicleId || null,
    ]
  );

  await writeAudit({
    entityType: "Driver",
    entityId: id,
    action: "Registered",
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `Registered driver ${input.fullName.trim()} (License ${lic})`,
  });

  return mapDriver(res.rows[0]);
}

export async function updateDriverStatus(input: {
  driverId: string;
  availabilityStatus?: "Available" | "Off-Duty";
  employmentStatus?: "Active" | "On Leave" | "Suspended";
  actorRole: AmbulanceRole;
  actorName: string;
}) {
  const pool = getPool();
  const curRes = await pool.query(
    "SELECT * FROM ambulance_drivers WHERE id = $1",
    [input.driverId]
  );
  if (curRes.rowCount === 0) {
    throw new HttpError(`Driver ${input.driverId} not found.`, 404);
  }
  const drv = mapDriver(curRes.rows[0]);
  if (
    drv.availabilityStatus === "Assigned" ||
    drv.availabilityStatus === "On-Trip"
  ) {
    throw new HttpError(
      `Driver ${drv.fullName} is currently on an active trip (${drv.availabilityStatus}).`,
      409
    );
  }

  const res = await pool.query(
    `UPDATE ambulance_drivers
     SET availability_status = COALESCE($2, availability_status),
         employment_status = COALESCE($3, employment_status),
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      drv.id,
      input.availabilityStatus ?? null,
      input.employmentStatus ?? null,
    ]
  );
  return mapDriver(res.rows[0]);
}

// 3. Emergency Requests
export async function createEmergencyRequest(input: {
  patientId?: string;
  patientName: string;
  contactNumber: string;
  sourceChannel?: string;
  pickupLocation: string;
  destinationHospital?: string;
  emergencyType: string;
  priority?: "Critical" | "High" | "Standard";
  actorRole: AmbulanceRole;
  actorName: string;
}) {
  if (
    !input.patientName?.trim() ||
    !input.contactNumber?.trim() ||
    !input.pickupLocation?.trim() ||
    !input.emergencyType?.trim()
  ) {
    throw new HttpError(
      "Patient name, contact number, pickup location, and emergency type are required."
    );
  }

  const pool = getPool();
  const seq = await nextCounter("ambulance_request");
  const id = `ARQ-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO ambulance_requests (
      id, patient_id, patient_name, contact_number, source_channel,
      pickup_location, destination_hospital, emergency_type, priority, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Requested') RETURNING *`,
    [
      id,
      input.patientId || null,
      input.patientName.trim(),
      input.contactNumber.trim(),
      input.sourceChannel?.trim() || "Emergency Dept",
      input.pickupLocation.trim(),
      input.destinationHospital?.trim() || "Healix Main Hospital",
      input.emergencyType.trim(),
      input.priority ?? "High",
    ]
  );

  await writeAudit({
    entityType: "Request",
    entityId: id,
    action: "Created",
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `${input.priority ?? "High"} request for ${input.patientName.trim()} (${input.emergencyType.trim()})`,
  });

  return mapRequest(res.rows[0]);
}

export async function updateEmergencyRequest(input: {
  requestId: string;
  priority?: "Critical" | "High" | "Standard";
  cancel?: boolean;
  cancelReason?: string;
  actorRole: AmbulanceRole;
  actorName: string;
}) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const curRes = await client.query(
      "SELECT * FROM ambulance_requests WHERE id = $1 FOR UPDATE",
      [input.requestId]
    );
    if (curRes.rowCount === 0) {
      throw new HttpError(`Request ${input.requestId} not found.`, 404);
    }

    if (input.cancel) {
      // Release any active dispatch vehicle & driver
      const dspRes = await client.query(
        `SELECT * FROM ambulance_dispatches
         WHERE request_id = $1 AND status NOT IN ('Completed','Cancelled')`,
        [input.requestId]
      );
      if ((dspRes.rowCount ?? 0) > 0) {
        const dsp = mapDispatch(dspRes.rows[0]);
        await client.query(
          `UPDATE ambulance_dispatches SET status = 'Cancelled', updated_at = NOW() WHERE id = $1`,
          [dsp.id]
        );
        await client.query(
          `UPDATE ambulance_vehicles SET operational_status = 'Available', updated_at = NOW() WHERE id = $1`,
          [dsp.ambulanceId]
        );
        await client.query(
          `UPDATE ambulance_drivers SET availability_status = 'Available', updated_at = NOW() WHERE id = $1`,
          [dsp.driverId]
        );
      }

      const upd = await client.query(
        `UPDATE ambulance_requests
         SET status = 'Cancelled', cancel_reason = $2, updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [input.requestId, input.cancelReason?.trim() || "Cancelled by coordinator"]
      );
      await writeAudit(
        {
          entityType: "Request",
          entityId: input.requestId,
          action: "Cancelled",
          actorRole: input.actorRole,
          actorName: input.actorName,
          details: input.cancelReason?.trim() || "Request cancelled",
        },
        client
      );
      await client.query("COMMIT");
      return mapRequest(upd.rows[0]);
    }

    const upd = await client.query(
      `UPDATE ambulance_requests
       SET priority = COALESCE($2, priority), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [input.requestId, input.priority ?? null]
    );
    await client.query("COMMIT");
    return mapRequest(upd.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// 5. Atomic Dispatch Assignment (Strict conflict & license validation)
export async function assignDispatch(input: {
  requestId: string;
  ambulanceId: string;
  driverId: string;
  estimatedArrivalMins?: number;
  actorRole: AmbulanceRole;
  actorName: string;
}) {
  if (!input.requestId || !input.ambulanceId || !input.driverId) {
    throw new HttpError("Emergency request, ambulance, and driver are required.");
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const [reqRes, vehRes, drvRes] = await Promise.all([
      client.query("SELECT * FROM ambulance_requests WHERE id = $1 FOR UPDATE", [
        input.requestId,
      ]),
      client.query("SELECT * FROM ambulance_vehicles WHERE id = $1 FOR UPDATE", [
        input.ambulanceId,
      ]),
      client.query("SELECT * FROM ambulance_drivers WHERE id = $1 FOR UPDATE", [
        input.driverId,
      ]),
    ]);

    if (reqRes.rowCount === 0) {
      throw new HttpError(`Request ${input.requestId} not found.`, 404);
    }
    if (vehRes.rowCount === 0) {
      throw new HttpError(`Ambulance ${input.ambulanceId} not found.`, 404);
    }
    if (drvRes.rowCount === 0) {
      throw new HttpError(`Driver ${input.driverId} not found.`, 404);
    }

    const req = mapRequest(reqRes.rows[0]);
    const veh = mapVehicle(vehRes.rows[0]);
    const drv = mapDriver(drvRes.rows[0]);

    if (req.status !== "Requested") {
      throw new HttpError(
        `Request ${req.id} is already "${req.status}" and cannot be newly assigned.`,
        409
      );
    }
    if (veh.operationalStatus !== "Available") {
      throw new HttpError(
        `Conflict prevented: Ambulance ${veh.registrationNumber} is currently "${veh.operationalStatus}".`,
        409
      );
    }
    if (drv.employmentStatus !== "Active" || drv.availabilityStatus !== "Available") {
      throw new HttpError(
        `Conflict prevented: Driver ${drv.fullName} is "${drv.availabilityStatus}" (${drv.employmentStatus}).`,
        409
      );
    }
    if (drv.licenseValidUntil <= todayIso()) {
      throw new HttpError(
        `Safety block: Driver ${drv.fullName}'s license expired on ${drv.licenseValidUntil}.`,
        409
      );
    }

    const seq = await nextCounter("ambulance_dispatch", client);
    const id = `DSP-AMB-${new Date().getFullYear()}-${pad(seq)}`;
    const timeline: TimelineEntry[] = [
      {
        status: "Assigned",
        staff: input.actorName,
        timestamp: new Date().toISOString(),
        note: `Assigned ${veh.registrationNumber} (${veh.vehicleType}) with driver ${drv.fullName}`,
      },
    ];

    const dspRes = await client.query(
      `INSERT INTO ambulance_dispatches (
        id, request_id, ambulance_id, registration_number, driver_id, driver_name,
        pickup_location, destination_hospital, estimated_arrival_mins, status, status_timeline
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Assigned',$10::jsonb) RETURNING *`,
      [
        id,
        req.id,
        veh.id,
        veh.registrationNumber,
        drv.id,
        drv.fullName,
        req.pickupLocation,
        req.destinationHospital,
        Math.max(1, Number(input.estimatedArrivalMins ?? 15)),
        JSON.stringify(timeline),
      ]
    );

    await Promise.all([
      client.query(
        `UPDATE ambulance_requests SET status = 'Assigned', updated_at = NOW() WHERE id = $1`,
        [req.id]
      ),
      client.query(
        `UPDATE ambulance_vehicles SET operational_status = 'Assigned', assigned_driver_id = $2, updated_at = NOW() WHERE id = $1`,
        [veh.id, drv.id]
      ),
      client.query(
        `UPDATE ambulance_drivers SET availability_status = 'Assigned', assigned_vehicle_id = $2, updated_at = NOW() WHERE id = $1`,
        [drv.id, veh.id]
      ),
    ]);

    await writeAudit(
      {
        entityType: "Dispatch",
        entityId: id,
        action: "Assigned",
        actorRole: input.actorRole,
        actorName: input.actorName,
        details: `Assigned ${veh.registrationNumber} & ${drv.fullName} to ${req.id}`,
      },
      client
    );

    await client.query("COMMIT");
    return mapDispatch(dspRes.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// 5 & 6. Progress Dispatch Status -> Automatically generates Trip Record on Completion
export async function progressDispatch(input: {
  dispatchId: string;
  nextStatus:
    | "Dispatched"
    | "Arrived at Pickup"
    | "Patient Onboard"
    | "Arrived at Hospital"
    | "Completed";
  note?: string;
  distanceKm?: number;
  fuelUsedLiters?: number;
  remarks?: string;
  actorRole: AmbulanceRole;
  actorName: string;
}) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const curRes = await client.query(
      "SELECT * FROM ambulance_dispatches WHERE id = $1 FOR UPDATE",
      [input.dispatchId]
    );
    if (curRes.rowCount === 0) {
      throw new HttpError(`Dispatch ${input.dispatchId} not found.`, 404);
    }
    const dsp = mapDispatch(curRes.rows[0]);
    if (dsp.status === "Completed" || dsp.status === "Cancelled") {
      throw new HttpError(`Dispatch ${dsp.id} is already ${dsp.status}.`, 409);
    }

    const timeline: TimelineEntry[] = [
      ...dsp.statusTimeline,
      {
        status: input.nextStatus,
        staff: input.actorName,
        timestamp: new Date().toISOString(),
        note: input.note?.trim() || `Progressed to ${input.nextStatus}`,
      },
    ];

    const colMap: Record<string, string> = {
      Dispatched: "dispatched_at",
      "Arrived at Pickup": "arrived_pickup_at",
      "Patient Onboard": "patient_onboard_at",
      "Arrived at Hospital": "arrived_hospital_at",
      Completed: "completed_at",
    };
    const tsCol = colMap[input.nextStatus];

    const updDsp = await client.query(
      `UPDATE ambulance_dispatches
       SET status = $2,
           ${tsCol} = NOW(),
           status_timeline = $3::jsonb,
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [dsp.id, input.nextStatus, JSON.stringify(timeline)]
    );

    const vehStatusMap: Record<string, string> = {
      Dispatched: "Dispatched",
      "Arrived at Pickup": "On-Trip",
      "Patient Onboard": "On-Trip",
      "Arrived at Hospital": "Returning",
      Completed: "Available",
    };
    const drvStatusMap: Record<string, string> = {
      Dispatched: "On-Trip",
      "Arrived at Pickup": "On-Trip",
      "Patient Onboard": "On-Trip",
      "Arrived at Hospital": "On-Trip",
      Completed: "Available",
    };

    await client.query(
      `UPDATE ambulance_requests SET status = $2, updated_at = NOW() WHERE id = $1`,
      [dsp.requestId, input.nextStatus]
    );

    if (input.nextStatus === "Completed") {
      const reqRes = await client.query(
        "SELECT patient_name FROM ambulance_requests WHERE id = $1",
        [dsp.requestId]
      );
      const patientName = (reqRes.rows[0]?.patient_name as string) || "Patient";
      const depTime = new Date(dsp.dispatchedAt || dsp.assignedAt);
      const arrTime = new Date();
      const durationMins = Math.max(
        1,
        Math.round((arrTime.getTime() - depTime.getTime()) / 60000)
      );
      const distanceKm = Math.max(0, Number(input.distanceKm ?? 12.5));
      const fuelLiters = Math.max(0, Number(input.fuelUsedLiters ?? 2.0));

      const trpSeq = await nextCounter("ambulance_trip", client);
      const trpId = `TRP-${new Date().getFullYear()}-${pad(trpSeq)}`;
      await client.query(
        `INSERT INTO ambulance_trips (
          id, dispatch_id, request_id, ambulance_id, registration_number,
          driver_id, driver_name, patient_name, pickup_location, dropoff_location,
          departure_time, arrival_time, distance_km, duration_mins, fuel_used_liters,
          trip_status, remarks
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'Completed',$16)`,
        [
          trpId,
          dsp.id,
          dsp.requestId,
          dsp.ambulanceId,
          dsp.registrationNumber,
          dsp.driverId,
          dsp.driverName,
          patientName,
          dsp.pickupLocation,
          dsp.destinationHospital,
          depTime,
          arrTime,
          distanceKm,
          durationMins,
          fuelLiters,
          input.remarks?.trim() || "Trip completed and patient handed over.",
        ]
      );

      await client.query(
        `UPDATE ambulance_vehicles
         SET operational_status = 'Available',
             total_trips = total_trips + 1,
             total_distance_km = total_distance_km + $2,
             updated_at = NOW()
         WHERE id = $1`,
        [dsp.ambulanceId, distanceKm]
      );
      await client.query(
        `UPDATE ambulance_drivers
         SET availability_status = 'Available',
             total_trips = total_trips + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [dsp.driverId]
      );
    } else {
      await client.query(
        `UPDATE ambulance_vehicles SET operational_status = $2, updated_at = NOW() WHERE id = $1`,
        [dsp.ambulanceId, vehStatusMap[input.nextStatus]]
      );
      await client.query(
        `UPDATE ambulance_drivers SET availability_status = $2, updated_at = NOW() WHERE id = $1`,
        [dsp.driverId, drvStatusMap[input.nextStatus]]
      );
    }

    await writeAudit(
      {
        entityType: "Dispatch",
        entityId: dsp.id,
        action: input.nextStatus,
        actorRole: input.actorRole,
        actorName: input.actorName,
        details: `Dispatch ${dsp.id} progressed to ${input.nextStatus}`,
      },
      client
    );

    await client.query("COMMIT");
    return mapDispatch(updDsp.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
