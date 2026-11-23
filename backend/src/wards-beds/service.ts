import { getPool, nextCounter } from "../db/client.js";
import { HttpError } from "../opd/service.js";
import { hasWardBedPermission, type WardBedRole } from "./permissions.js";

function pad(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

function mapWard(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    name: r.name as string,
    wardType: r.ward_type as string,
    department: r.department as string,
    location: r.location as string,
    capacity: Number(r.capacity),
    isActive: Boolean(r.is_active),
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapBed(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    wardId: (r.ward_id as string | null) ?? undefined,
    department: r.department as string,
    ward: r.ward as string,
    room: r.room as string,
    bedNumber: r.bed_number as string,
    bedType: r.bed_type as string,
    status: r.status as string,
    currentAdmissionId: (r.current_admission_id as string | null) ?? undefined,
    isIsolation: Boolean(r.is_isolation),
    isolationType: (r.isolation_type as string) || "",
    isolationReason: (r.isolation_reason as string) || "",
    cleaningStatus: (r.cleaning_status as string) || "Cleaned",
  };
}

function mapAllocation(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    bedId: r.bed_id as string,
    admissionId: r.admission_id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    wardName: r.ward_name as string,
    room: r.room as string,
    bedNumber: r.bed_number as string,
    isIsolation: Boolean(r.is_isolation),
    isolationReason: (r.isolation_reason as string) || "",
    allocatedBy: r.allocated_by as string,
    allocatedAt: new Date(r.allocated_at as string).toISOString(),
    releasedAt: r.released_at
      ? new Date(r.released_at as string).toISOString()
      : undefined,
    status: r.status as string,
  };
}

function mapCleaningLog(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    bedId: r.bed_id as string,
    wardName: r.ward_name as string,
    bedNumber: r.bed_number as string,
    isIsolationBed: Boolean(r.is_isolation_bed),
    cleaningStatus: r.cleaning_status as string,
    sanitizationProtocol: r.sanitization_protocol as string,
    responsibleStaff: r.responsible_staff as string,
    notes: (r.notes as string) || "",
    startedAt: r.started_at
      ? new Date(r.started_at as string).toISOString()
      : undefined,
    completedAt: r.completed_at
      ? new Date(r.completed_at as string).toISOString()
      : undefined,
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

function mapTransfer(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    admissionId: r.admission_id as string,
    patientId: r.patient_id as string,
    fromDepartment: r.from_department as string,
    fromWard: r.from_ward as string,
    fromRoom: r.from_room as string,
    fromBedId: r.from_bed_id as string,
    toDepartment: r.to_department as string,
    toWard: r.to_ward as string,
    toRoom: r.to_room as string,
    toBedId: r.to_bed_id as string,
    reason: r.reason as string,
    requestingDoctor: r.requesting_doctor as string,
    responsibleStaff: r.responsible_staff as string,
    status: r.status as string,
    transferredAt: new Date(r.transferred_at as string).toISOString(),
  };
}

function mapAdmission(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    admittingDoctor: r.admitting_doctor as string,
    department: r.department as string,
    ward: r.ward as string,
    room: r.room as string,
    bedId: r.bed_id as string,
    bedLabel: r.bed_label as string,
    diagnosis: r.diagnosis as string,
    status: r.status as string,
  };
}

export async function getWardBedState() {
  const pool = getPool();
  const [
    wardsRes,
    bedsRes,
    admissionsRes,
    allocationsRes,
    transfersRes,
    cleaningRes,
  ] = await Promise.all([
    pool.query("SELECT * FROM wards ORDER BY id ASC"),
    pool.query("SELECT * FROM ipd_beds ORDER BY ward ASC, room ASC, bed_number ASC"),
    pool.query("SELECT * FROM ipd_admissions ORDER BY created_at DESC"),
    pool.query("SELECT * FROM bed_allocations ORDER BY allocated_at DESC"),
    pool.query("SELECT * FROM ipd_transfers ORDER BY transferred_at DESC"),
    pool.query("SELECT * FROM bed_cleaning_logs ORDER BY created_at DESC"),
  ]);

  const wards = wardsRes.rows.map(mapWard);
  const beds = bedsRes.rows.map(mapBed);

  // Compute live occupancy tracking statistics
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === "Occupied").length;
  const availableBeds = beds.filter((b) => b.status === "Available").length;
  const reservedBeds = beds.filter((b) => b.status === "Reserved").length;
  const cleaningBeds = beds.filter((b) => b.status === "Under Cleaning").length;
  const maintenanceBeds = beds.filter((b) => b.status === "Maintenance").length;
  const utilizationRate =
    totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const wardOccupancy = wards.map((w) => {
    const wBeds = beds.filter((b) => b.ward === w.name || b.wardId === w.id);
    const occ = wBeds.filter((b) => b.status === "Occupied").length;
    const avail = wBeds.filter((b) => b.status === "Available").length;
    const unavail = wBeds.length - occ - avail;
    return {
      wardId: w.id,
      wardName: w.name,
      department: w.department,
      wardType: w.wardType,
      configuredCapacity: w.capacity,
      totalBeds: wBeds.length,
      occupied: occ,
      available: avail,
      unavailable: unavail,
      utilizationPercent:
        wBeds.length > 0 ? Math.round((occ / wBeds.length) * 100) : 0,
    };
  });

  const deptNames = Array.from(new Set(beds.map((b) => b.department)));
  const departmentOccupancy = deptNames.map((dept) => {
    const dBeds = beds.filter((b) => b.department === dept);
    const occ = dBeds.filter((b) => b.status === "Occupied").length;
    const avail = dBeds.filter((b) => b.status === "Available").length;
    return {
      department: dept,
      totalBeds: dBeds.length,
      occupied: occ,
      available: avail,
      unavailable: dBeds.length - occ - avail,
      utilizationPercent:
        dBeds.length > 0 ? Math.round((occ / dBeds.length) * 100) : 0,
    };
  });

  return {
    wards,
    beds,
    admissions: admissionsRes.rows.map(mapAdmission),
    allocations: allocationsRes.rows.map(mapAllocation),
    transfers: transfersRes.rows.map(mapTransfer),
    cleaningLogs: cleaningRes.rows.map(mapCleaningLog),
    occupancy: {
      totalBeds,
      occupiedBeds,
      availableBeds,
      reservedBeds,
      cleaningBeds,
      maintenanceBeds,
      unavailableBeds: reservedBeds + cleaningBeds + maintenanceBeds,
      utilizationRate,
      wardOccupancy,
      departmentOccupancy,
    },
  };
}

// 1. Ward Configuration (Create / Update / Toggle Active)
export async function createWard(input: {
  name: string;
  wardType: string;
  department: string;
  location: string;
  capacity: number;
}) {
  if (
    !input.name?.trim() ||
    !input.wardType?.trim() ||
    !input.department?.trim() ||
    !input.location?.trim() ||
    !Number.isFinite(Number(input.capacity)) ||
    Number(input.capacity) < 1
  ) {
    throw new HttpError(
      "Ward name, type, department, location, and capacity (>= 1) are required."
    );
  }

  const pool = getPool();
  const dup = await pool.query(
    "SELECT id FROM wards WHERE LOWER(name) = LOWER($1)",
    [input.name.trim()]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(`Ward "${input.name.trim()}" already exists.`, 409);
  }

  const seq = await nextCounter("ward");
  const id = `WRD-${pad(seq, 3)}`;
  const res = await pool.query(
    `INSERT INTO wards (id, name, ward_type, department, location, capacity, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,TRUE) RETURNING *`,
    [
      id,
      input.name.trim(),
      input.wardType.trim(),
      input.department.trim(),
      input.location.trim(),
      Number(input.capacity),
    ]
  );
  return mapWard(res.rows[0]);
}

export async function updateWard(input: {
  wardId: string;
  name?: string;
  wardType?: string;
  department?: string;
  location?: string;
  capacity?: number;
  isActive?: boolean;
}) {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE wards
     SET name = COALESCE(NULLIF($2, ''), name),
         ward_type = COALESCE(NULLIF($3, ''), ward_type),
         department = COALESCE(NULLIF($4, ''), department),
         location = COALESCE(NULLIF($5, ''), location),
         capacity = COALESCE($6, capacity),
         is_active = COALESCE($7, is_active),
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      input.wardId,
      input.name?.trim() ?? "",
      input.wardType?.trim() ?? "",
      input.department?.trim() ?? "",
      input.location?.trim() ?? "",
      input.capacity !== undefined ? Number(input.capacity) : null,
      input.isActive !== undefined ? Boolean(input.isActive) : null,
    ]
  );
  if (res.rowCount === 0) {
    throw new HttpError(`Ward ${input.wardId} not found.`, 404);
  }
  return mapWard(res.rows[0]);
}

// Configure a new bed inside a ward (standard or isolation)
export async function createBed(input: {
  wardId: string;
  room: string;
  bedNumber: string;
  bedType: string;
  isIsolation?: boolean;
  isolationType?: string;
}) {
  if (!input.wardId || !input.room?.trim() || !input.bedNumber?.trim() || !input.bedType?.trim()) {
    throw new HttpError("Ward, room, bed number, and bed type are required.");
  }

  const pool = getPool();
  const wardRes = await pool.query("SELECT * FROM wards WHERE id = $1", [
    input.wardId,
  ]);
  if (wardRes.rowCount === 0) {
    throw new HttpError(`Ward ${input.wardId} not found.`, 404);
  }
  const ward = mapWard(wardRes.rows[0]);
  if (!ward.isActive) {
    throw new HttpError(`Ward "${ward.name}" is inactive. Activate it before adding beds.`);
  }

  const countRes = await pool.query(
    "SELECT COUNT(*)::int AS cnt FROM ipd_beds WHERE ward_id = $1 OR ward = $2",
    [ward.id, ward.name]
  );
  if (Number(countRes.rows[0].cnt) >= ward.capacity) {
    throw new HttpError(
      `Ward "${ward.name}" has reached its configured bed capacity (${ward.capacity}).`,
      409
    );
  }

  const dup = await pool.query(
    "SELECT id FROM ipd_beds WHERE LOWER(bed_number) = LOWER($1)",
    [input.bedNumber.trim()]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(`Bed number "${input.bedNumber.trim()}" already exists.`, 409);
  }

  const seq = await nextCounter("bed");
  const isIsolation = Boolean(input.isIsolation || ward.wardType === "Isolation");
  const id = isIsolation ? `BED-ISO${pad(seq, 2)}` : `BED-${pad(seq, 4)}`;

  const res = await pool.query(
    `INSERT INTO ipd_beds (
      id, ward_id, department, ward, room, bed_number, bed_type,
      status, is_isolation, isolation_type, cleaning_status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'Available',$8,$9,'Cleaned') RETURNING *`,
    [
      id,
      ward.id,
      ward.department,
      ward.name,
      input.room.trim(),
      input.bedNumber.trim(),
      input.bedType.trim(),
      isIsolation,
      isIsolation ? input.isolationType?.trim() || "Airborne / Negative Pressure" : "",
    ]
  );
  return mapBed(res.rows[0]);
}

// 2. Bed Availability Status Update (Available / Reserved / Under Cleaning / Maintenance)
export async function updateBedStatus(input: {
  bedId: string;
  status: "Available" | "Reserved" | "Under Cleaning" | "Maintenance";
  actor: string;
  notes?: string;
}) {
  const pool = getPool();
  const bedRes = await pool.query("SELECT * FROM ipd_beds WHERE id = $1", [
    input.bedId,
  ]);
  if (bedRes.rowCount === 0) {
    throw new HttpError(`Bed ${input.bedId} not found.`, 404);
  }
  const bed = mapBed(bedRes.rows[0]);
  if (bed.status === "Occupied") {
    throw new HttpError(
      `Bed ${bed.bedNumber} is currently occupied by admission ${bed.currentAdmissionId}. Transfer or discharge the patient first.`,
      409
    );
  }
  if (input.status === "Available" && bed.cleaningStatus !== "Cleaned") {
    throw new HttpError(
      `Bed ${bed.bedNumber} cannot be marked Available until cleaning is completed (current: ${bed.cleaningStatus}).`,
      409
    );
  }

  const cleaningStatus =
    input.status === "Under Cleaning" ? "Pending Cleaning" : bed.cleaningStatus;

  const updated = await pool.query(
    `UPDATE ipd_beds SET status = $2, cleaning_status = $3 WHERE id = $1 RETURNING *`,
    [bed.id, input.status, cleaningStatus]
  );

  if (input.status === "Under Cleaning") {
    const clnSeq = await nextCounter("bed_cleaning");
    const clnId = `CLN-${new Date().getFullYear()}-${pad(clnSeq)}`;
    await pool.query(
      `INSERT INTO bed_cleaning_logs (
        id, bed_id, ward_name, bed_number, is_isolation_bed,
        cleaning_status, sanitization_protocol, responsible_staff, notes
      ) VALUES ($1,$2,$3,$4,$5,'Pending Cleaning',$6,$7,$8)`,
      [
        clnId,
        bed.id,
        bed.ward,
        bed.bedNumber,
        bed.isIsolation,
        bed.isIsolation
          ? "Isolation UV-C + Sporicidal"
          : "Standard Terminal Clean",
        input.actor || "Housekeeping Team",
        input.notes?.trim() || "Flagged for cleaning before next allocation",
      ]
    );
  }

  return mapBed(updated.rows[0]);
}

// 3 & 7. Bed Allocation (Standard & Isolation Bed Allocation with IPD integration)
export async function allocateBed(input: {
  bedId: string;
  admissionId: string;
  isolationReason?: string;
  allocatedBy: string;
  role: WardBedRole;
}) {
  if (!input.bedId || !input.admissionId) {
    throw new HttpError("Bed and active IPD admission are required.");
  }

  const pool = getPool();
  const [bedRes, admRes] = await Promise.all([
    pool.query("SELECT * FROM ipd_beds WHERE id = $1", [input.bedId]),
    pool.query("SELECT * FROM ipd_admissions WHERE id = $1", [
      input.admissionId,
    ]),
  ]);

  if (bedRes.rowCount === 0) {
    throw new HttpError(`Bed ${input.bedId} not found.`, 404);
  }
  const bed = mapBed(bedRes.rows[0]);

  if (bed.isIsolation) {
    if (!hasWardBedPermission(input.role, "isolation:manage")) {
      throw new HttpError(
        `Access denied: role "${input.role}" is not authorized to allocate dedicated isolation beds.`,
        403
      );
    }
    if (!input.isolationReason?.trim()) {
      throw new HttpError(
        "Isolation reason is required when allocating a dedicated isolation bed."
      );
    }
  }

  if (bed.status !== "Available" || bed.cleaningStatus !== "Cleaned") {
    throw new HttpError(
      `Bed ${bed.bedNumber} is unavailable (Status: ${bed.status}, Cleaning: ${bed.cleaningStatus}).`,
      409
    );
  }

  if (admRes.rowCount === 0) {
    throw new HttpError(`Admission ${input.admissionId} not found.`, 404);
  }
  const adm = mapAdmission(admRes.rows[0]);
  if (adm.status === "Discharged") {
    throw new HttpError("Cannot allocate a bed to a discharged patient.");
  }

  // If patient already occupies another bed, release it into Under Cleaning
  if (adm.bedId && adm.bedId !== bed.id) {
    const prevBedRes = await pool.query("SELECT * FROM ipd_beds WHERE id = $1", [
      adm.bedId,
    ]);
    if ((prevBedRes.rowCount ?? 0) > 0) {
      const prevBed = mapBed(prevBedRes.rows[0]);
      await pool.query(
        `UPDATE ipd_beds
         SET status = 'Under Cleaning', current_admission_id = NULL, cleaning_status = 'Pending Cleaning', isolation_reason = ''
         WHERE id = $1`,
        [prevBed.id]
      );
      await pool.query(
        `UPDATE bed_allocations SET status = 'Released', released_at = NOW()
         WHERE bed_id = $1 AND status = 'Active'`,
        [prevBed.id]
      );
      const clnSeq = await nextCounter("bed_cleaning");
      await pool.query(
        `INSERT INTO bed_cleaning_logs (
          id, bed_id, ward_name, bed_number, is_isolation_bed,
          cleaning_status, sanitization_protocol, responsible_staff, notes
        ) VALUES ($1,$2,$3,$4,$5,'Pending Cleaning',$6,'Housekeeping Team','Auto-queued after patient reallocation')`,
        [
          `CLN-${new Date().getFullYear()}-${pad(clnSeq)}`,
          prevBed.id,
          prevBed.ward,
          prevBed.bedNumber,
          prevBed.isIsolation,
          prevBed.isIsolation
            ? "Isolation UV-C + Sporicidal"
            : "Standard Terminal Clean",
        ]
      );
    }
  }

  // Occupy target bed and update IPD admission location
  await pool.query(
    `UPDATE ipd_beds
     SET status = 'Occupied', current_admission_id = $2, isolation_reason = $3
     WHERE id = $1`,
    [bed.id, adm.id, bed.isIsolation ? input.isolationReason?.trim() ?? "" : ""]
  );

  const bedLabel = `${bed.ward} / ${bed.room} / ${bed.bedNumber}`;
  await pool.query(
    `UPDATE ipd_admissions
     SET department = $2, ward = $3, room = $4, bed_id = $5, bed_label = $6, updated_at = NOW()
     WHERE id = $1`,
    [adm.id, bed.department, bed.ward, bed.room, bed.id, bedLabel]
  );

  const allocSeq = await nextCounter("bed_allocation");
  const allocId = `BAL-${new Date().getFullYear()}-${pad(allocSeq)}`;
  const allocRes = await pool.query(
    `INSERT INTO bed_allocations (
      id, bed_id, admission_id, patient_id, patient_name, ward_name,
      room, bed_number, is_isolation, isolation_reason, allocated_by, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Active') RETURNING *`,
    [
      allocId,
      bed.id,
      adm.id,
      adm.patientId,
      adm.patientName,
      bed.ward,
      bed.room,
      bed.bedNumber,
      bed.isIsolation,
      bed.isIsolation ? input.isolationReason?.trim() ?? "" : "",
      input.allocatedBy || input.role,
    ]
  );

  return mapAllocation(allocRes.rows[0]);
}

// 4. Bed Transfer (Integrated with ipd_transfers + Auto-queues old bed for cleaning)
export async function transferBed(input: {
  admissionId: string;
  toBedId: string;
  reason: string;
  requestingDoctor: string;
  responsibleStaff: string;
  isolationReason?: string;
  role: WardBedRole;
}) {
  if (
    !input.admissionId ||
    !input.toBedId ||
    !input.reason?.trim() ||
    !input.responsibleStaff?.trim()
  ) {
    throw new HttpError(
      "Admission, destination bed, transfer reason, and responsible staff are required."
    );
  }

  const pool = getPool();
  const [admRes, destBedRes] = await Promise.all([
    pool.query("SELECT * FROM ipd_admissions WHERE id = $1", [
      input.admissionId,
    ]),
    pool.query("SELECT * FROM ipd_beds WHERE id = $1", [input.toBedId]),
  ]);

  if (admRes.rowCount === 0) {
    throw new HttpError(`Admission ${input.admissionId} not found.`, 404);
  }
  const adm = mapAdmission(admRes.rows[0]);
  if (adm.status === "Discharged") {
    throw new HttpError("Cannot transfer a discharged patient.");
  }

  if (destBedRes.rowCount === 0) {
    throw new HttpError(`Destination bed ${input.toBedId} not found.`, 404);
  }
  const destBed = mapBed(destBedRes.rows[0]);

  if (destBed.isIsolation && !hasWardBedPermission(input.role, "isolation:manage")) {
    throw new HttpError(
      `Access denied: role "${input.role}" is not authorized to transfer patients into isolation beds.`,
      403
    );
  }
  if (destBed.status !== "Available" || destBed.cleaningStatus !== "Cleaned") {
    throw new HttpError(
      `Destination bed ${destBed.bedNumber} is unavailable (Status: ${destBed.status}, Cleaning: ${destBed.cleaningStatus}).`,
      409
    );
  }

  const prevBedRes = await pool.query("SELECT * FROM ipd_beds WHERE id = $1", [
    adm.bedId,
  ]);
  const prevBed =
    (prevBedRes.rowCount ?? 0) > 0 ? mapBed(prevBedRes.rows[0]) : null;

  // Record in ipd_transfers (full IPD integration)
  const trfSeq = await nextCounter("ipd_transfer");
  const trfId = `ITR-${new Date().getFullYear()}-${pad(trfSeq)}`;
  const trfRes = await pool.query(
    `INSERT INTO ipd_transfers (
      id, admission_id, patient_id,
      from_department, from_ward, from_room, from_bed_id,
      to_department, to_ward, to_room, to_bed_id,
      reason, requesting_doctor, responsible_staff, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'Completed')
    RETURNING *`,
    [
      trfId,
      adm.id,
      adm.patientId,
      adm.department,
      adm.ward,
      adm.room,
      adm.bedId,
      destBed.department,
      destBed.ward,
      destBed.room,
      destBed.id,
      input.reason.trim(),
      input.requestingDoctor?.trim() || adm.admittingDoctor,
      input.responsibleStaff.trim(),
    ]
  );

  // Move previous bed to Under Cleaning & close previous allocation
  if (prevBed) {
    await pool.query(
      `UPDATE ipd_beds
       SET status = 'Under Cleaning', current_admission_id = NULL, cleaning_status = 'Pending Cleaning', isolation_reason = ''
       WHERE id = $1`,
      [prevBed.id]
    );
    await pool.query(
      `UPDATE bed_allocations SET status = 'Transferred', released_at = NOW()
       WHERE bed_id = $1 AND status = 'Active'`,
      [prevBed.id]
    );
    const clnSeq = await nextCounter("bed_cleaning");
    await pool.query(
      `INSERT INTO bed_cleaning_logs (
        id, bed_id, ward_name, bed_number, is_isolation_bed,
        cleaning_status, sanitization_protocol, responsible_staff, notes
      ) VALUES ($1,$2,$3,$4,$5,'Pending Cleaning',$6,'Housekeeping Team',$7)`,
      [
        `CLN-${new Date().getFullYear()}-${pad(clnSeq)}`,
        prevBed.id,
        prevBed.ward,
        prevBed.bedNumber,
        prevBed.isIsolation,
        prevBed.isIsolation
          ? "Isolation UV-C + Sporicidal"
          : "Standard Terminal Clean",
        `Post-transfer sanitization required (Transfer ${trfId})`,
      ]
    );
  }

  // Occupy destination bed & update IPD admission + new allocation record
  await pool.query(
    `UPDATE ipd_beds
     SET status = 'Occupied', current_admission_id = $2, isolation_reason = $3
     WHERE id = $1`,
    [
      destBed.id,
      adm.id,
      destBed.isIsolation
        ? input.isolationReason?.trim() || input.reason.trim()
        : "",
    ]
  );

  const newBedLabel = `${destBed.ward} / ${destBed.room} / ${destBed.bedNumber}`;
  await pool.query(
    `UPDATE ipd_admissions
     SET department = $2, ward = $3, room = $4, bed_id = $5, bed_label = $6, updated_at = NOW()
     WHERE id = $1`,
    [
      adm.id,
      destBed.department,
      destBed.ward,
      destBed.room,
      destBed.id,
      newBedLabel,
    ]
  );

  const allocSeq = await nextCounter("bed_allocation");
  await pool.query(
    `INSERT INTO bed_allocations (
      id, bed_id, admission_id, patient_id, patient_name, ward_name,
      room, bed_number, is_isolation, isolation_reason, allocated_by, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Active')`,
    [
      `BAL-${new Date().getFullYear()}-${pad(allocSeq)}`,
      destBed.id,
      adm.id,
      adm.patientId,
      adm.patientName,
      destBed.ward,
      destBed.room,
      destBed.bedNumber,
      destBed.isIsolation,
      destBed.isIsolation
        ? input.isolationReason?.trim() || input.reason.trim()
        : "",
      input.responsibleStaff.trim(),
    ]
  );

  return mapTransfer(trfRes.rows[0]);
}

// 5. Cleaning Status Workflow (Pending Cleaning -> Cleaning in Progress -> Cleaned => Bed Available)
export async function updateCleaningWorkflow(input: {
  cleaningLogId: string;
  action: "start" | "complete";
  responsibleStaff?: string;
  notes?: string;
}) {
  const pool = getPool();
  const logRes = await pool.query(
    "SELECT * FROM bed_cleaning_logs WHERE id = $1",
    [input.cleaningLogId]
  );
  if (logRes.rowCount === 0) {
    throw new HttpError(`Cleaning log ${input.cleaningLogId} not found.`, 404);
  }
  const log = mapCleaningLog(logRes.rows[0]);

  if (input.action === "start") {
    const updated = await pool.query(
      `UPDATE bed_cleaning_logs
       SET cleaning_status = 'Cleaning in Progress',
           responsible_staff = COALESCE(NULLIF($2, ''), responsible_staff),
           notes = COALESCE(NULLIF($3, ''), notes),
           started_at = COALESCE(started_at, NOW())
       WHERE id = $1 RETURNING *`,
      [
        log.id,
        input.responsibleStaff?.trim() ?? "",
        input.notes?.trim() ?? "",
      ]
    );
    await pool.query(
      `UPDATE ipd_beds SET status = 'Under Cleaning', cleaning_status = 'Cleaning in Progress' WHERE id = $1`,
      [log.bedId]
    );
    return mapCleaningLog(updated.rows[0]);
  }

  // Complete cleaning -> makes bed Available for allocation
  const updated = await pool.query(
    `UPDATE bed_cleaning_logs
     SET cleaning_status = 'Cleaned',
         responsible_staff = COALESCE(NULLIF($2, ''), responsible_staff),
         notes = COALESCE(NULLIF($3, ''), notes),
         started_at = COALESCE(started_at, NOW()),
         completed_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      log.id,
      input.responsibleStaff?.trim() ?? "",
      input.notes?.trim() ?? "",
    ]
  );

  await pool.query(
    `UPDATE ipd_beds
     SET status = CASE WHEN status = 'Under Cleaning' THEN 'Available' ELSE status END,
         cleaning_status = 'Cleaned'
     WHERE id = $1`,
    [log.bedId]
  );

  return mapCleaningLog(updated.rows[0]);
}
