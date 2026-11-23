import type { PoolClient } from "pg";
import { getPool } from "../db/client.js";
import { HttpError } from "../opd/service.js";
import type { BloodBankRole } from "./permissions.js";

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

export type BloodComponent =
  | "Whole Blood"
  | "RBC"
  | "Platelets"
  | "Plasma"
  | "Cryoprecipitate";

export const VALID_BLOOD_GROUPS = new Set<BloodGroup>([
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
]);

export const COMPONENT_RULES: Record<
  BloodComponent,
  { shelfLifeDays: number; storageTemp: string; defaultVolumeMl: number }
> = {
  "Whole Blood": {
    shelfLifeDays: 35,
    storageTemp: "2°C - 6°C",
    defaultVolumeMl: 450,
  },
  RBC: { shelfLifeDays: 42, storageTemp: "2°C - 6°C", defaultVolumeMl: 350 },
  Platelets: {
    shelfLifeDays: 5,
    storageTemp: "20°C - 24°C (Agitator)",
    defaultVolumeMl: 250,
  },
  Plasma: {
    shelfLifeDays: 365,
    storageTemp: "-18°C or below",
    defaultVolumeMl: 280,
  },
  Cryoprecipitate: {
    shelfLifeDays: 365,
    storageTemp: "-18°C or below",
    defaultVolumeMl: 50,
  },
};

// Validated medical ABO/Rh compatibility matrix
const RBC_COMPATIBLE_DONORS: Record<BloodGroup, BloodGroup[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

const PLASMA_COMPATIBLE_DONORS: Record<BloodGroup, BloodGroup[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A-", "A+", "AB-", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B-", "B+", "AB-", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB-", "AB+"],
};

export function isBloodCompatible(
  recipientGroup: BloodGroup,
  donorGroup: BloodGroup,
  component: BloodComponent
): boolean {
  if (component === "Plasma" || component === "Cryoprecipitate") {
    return PLASMA_COMPATIBLE_DONORS[recipientGroup]?.includes(donorGroup) ?? false;
  }
  return RBC_COMPATIBLE_DONORS[recipientGroup]?.includes(donorGroup) ?? false;
}

function pad(n: number, size = 4): string {
  return String(n).padStart(size, "0");
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(dateIso: string, days: number): string {
  const dt = new Date(`${dateIso}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
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
  const seq = await nextCounter("blood_audit", client);
  await runner.query(
    `INSERT INTO blood_audit_logs (
      id, entity_type, entity_id, action, actor_role, actor_name, details
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      `BAUD-${new Date().getFullYear()}-${pad(seq)}`,
      entry.entityType,
      entry.entityId,
      entry.action,
      entry.actorRole,
      entry.actorName,
      entry.details,
    ]
  );
}

function mapDonor(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    fullName: r.full_name as string,
    dateOfBirth: (r.date_of_birth as string) ?? "",
    gender: (r.gender as string) ?? "",
    phone: r.phone as string,
    email: (r.email as string) ?? "",
    bloodGroup: r.blood_group as BloodGroup,
    weightKg: Number(r.weight_kg),
    hemoglobinGdl: Number(r.hemoglobin_gdl),
    medicalHistory: (r.medical_history as string) ?? "",
    eligibilityStatus: r.eligibility_status as
      | "Eligible"
      | "Deferred"
      | "Ineligible",
    deferralReason: (r.deferral_reason as string) ?? "",
    lastDonationDate: (r.last_donation_date as string) ?? "",
    totalDonations: Number(r.total_donations),
    status: r.status as "Active" | "Inactive",
    createdAt: (r.created_at as Date).toISOString(),
  };
}

function mapUnit(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    donationId: r.donation_id as string,
    donorId: r.donor_id as string,
    donorName: r.donor_name as string,
    sourceUnitId: (r.source_unit_id as string | null) ?? undefined,
    bloodGroup: r.blood_group as BloodGroup,
    component: r.component as BloodComponent,
    volumeMl: Number(r.volume_ml),
    collectionCenter: r.collection_center as string,
    storageLocation: r.storage_location as string,
    storageTemp: r.storage_temp as string,
    collectionDate: r.collection_date as string,
    expiryDate: r.expiry_date as string,
    screeningStatus: r.screening_status as "Pending" | "Cleared" | "Reactive",
    screeningNotes: (r.screening_notes as string) ?? "",
    status: r.status as
      | "Testing"
      | "Available"
      | "Reserved"
      | "Issued"
      | "Transfused"
      | "Expired"
      | "Discarded",
    reservedForRequestId:
      (r.reserved_for_request_id as string | null) ?? undefined,
    createdAt: (r.created_at as Date).toISOString(),
  };
}

function mapRequest(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    department: r.department as "OPD" | "IPD" | "Emergency" | "Surgery",
    requestedBloodGroup: r.requested_blood_group as BloodGroup,
    component: r.component as BloodComponent,
    unitsRequested: Number(r.units_requested),
    unitsFulfilled: Number(r.units_fulfilled),
    urgency: r.urgency as "Routine" | "Urgent" | "Emergency",
    requestingDoctor: r.requesting_doctor as string,
    clinicalIndication: r.clinical_indication as string,
    status: r.status as
      | "Pending"
      | "Approved"
      | "Reserved"
      | "Fulfilled"
      | "Rejected"
      | "Cancelled",
    rejectionReason: (r.rejection_reason as string) ?? "",
    approvedBy: (r.approved_by as string | null) ?? undefined,
    requestedAt: (r.requested_at as Date).toISOString(),
  };
}

function mapCompatibility(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    requestId: r.request_id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    patientBloodGroup: r.patient_blood_group as BloodGroup,
    unitId: r.unit_id as string,
    donorBloodGroup: r.donor_blood_group as BloodGroup,
    component: r.component as BloodComponent,
    groupingConfirmed: Boolean(r.grouping_confirmed),
    crossmatchResult: r.crossmatch_result as "Compatible" | "Incompatible",
    antibodyScreen: r.antibody_screen as "Negative" | "Positive",
    testedBy: r.tested_by as string,
    testedAt: (r.tested_at as Date).toISOString(),
    verificationStatus: r.verification_status as
      | "Pending"
      | "Verified"
      | "Rejected",
    verifiedBy: (r.verified_by as string | null) ?? undefined,
    verifiedAt: r.verified_at
      ? (r.verified_at as Date).toISOString()
      : undefined,
    notes: (r.notes as string) ?? "",
  };
}

function mapTransfusion(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    requestId: r.request_id as string,
    unitId: r.unit_id as string,
    compatibilityTestId: r.compatibility_test_id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    bloodGroup: r.blood_group as BloodGroup,
    component: r.component as BloodComponent,
    volumeMl: Number(r.volume_ml),
    administeringStaff: r.administering_staff as string,
    startedAt: (r.started_at as Date).toISOString(),
    completedAt: r.completed_at
      ? (r.completed_at as Date).toISOString()
      : undefined,
    monitoringObservations: (r.monitoring_observations as string) ?? "",
    adverseReaction: r.adverse_reaction as string,
    adverseReactionNotes: (r.adverse_reaction_notes as string) ?? "",
    status: r.status as "In Progress" | "Completed" | "Stopped - Reaction",
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

export async function getBloodBankState() {
  const pool = getPool();
  // Automatically mark past-expiry Available/Testing units as Expired
  await pool.query(
    `UPDATE blood_units
     SET status = 'Expired', updated_at = NOW()
     WHERE status IN ('Available', 'Testing') AND expiry_date <= $1`,
    [todayIso()]
  );

  const [docRes, patRes, dnrRes, untRes, reqRes, cmpRes, trnRes, audRes] =
    await Promise.all([
      pool.query("SELECT id, name, department FROM opd_doctors ORDER BY name ASC"),
      pool.query(
        "SELECT id, full_name, blood_group, phone, gender FROM patients ORDER BY created_at DESC"
      ),
      pool.query("SELECT * FROM blood_donors ORDER BY created_at DESC"),
      pool.query("SELECT * FROM blood_units ORDER BY expiry_date ASC, created_at DESC"),
      pool.query("SELECT * FROM blood_requests ORDER BY requested_at DESC"),
      pool.query("SELECT * FROM blood_compatibility_tests ORDER BY tested_at DESC"),
      pool.query("SELECT * FROM blood_transfusions ORDER BY started_at DESC"),
      pool.query("SELECT * FROM blood_audit_logs ORDER BY created_at DESC LIMIT 80"),
    ]);

  return {
    doctors: docRes.rows.map((d) => ({
      id: d.id as string,
      name: d.name as string,
      department: d.department as string,
    })),
    patients: patRes.rows.map((p) => ({
      id: p.id as string,
      fullName: p.full_name as string,
      bloodGroup: (p.blood_group as string) || "O+",
      phone: (p.phone as string) ?? "",
      gender: (p.gender as string) ?? "",
    })),
    donors: dnrRes.rows.map(mapDonor),
    units: untRes.rows.map(mapUnit),
    requests: reqRes.rows.map(mapRequest),
    compatibilityTests: cmpRes.rows.map(mapCompatibility),
    transfusions: trnRes.rows.map(mapTransfusion),
    auditLogs: audRes.rows.map(mapAudit),
  };
}

// 1. Donor Registration & Eligibility Screening
export async function registerDonor(input: {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  phone: string;
  email?: string;
  bloodGroup: BloodGroup;
  weightKg: number;
  hemoglobinGdl: number;
  medicalHistory?: string;
  actorRole: BloodBankRole;
  actorName: string;
}) {
  if (
    !input.fullName?.trim() ||
    !input.phone?.trim() ||
    !VALID_BLOOD_GROUPS.has(input.bloodGroup)
  ) {
    throw new HttpError("Donor full name, phone, and valid blood group are required.");
  }

  const weight = Number(input.weightKg);
  const hb = Number(input.hemoglobinGdl);
  let eligibilityStatus: "Eligible" | "Deferred" = "Eligible";
  let deferralReason = "";
  if (weight < 50) {
    eligibilityStatus = "Deferred";
    deferralReason = `Weight ${weight} kg below minimum 50 kg threshold`;
  } else if (hb < 12.5) {
    eligibilityStatus = "Deferred";
    deferralReason = `Hemoglobin ${hb} g/dL below minimum 12.5 g/dL threshold`;
  }

  const pool = getPool();
  const seq = await nextCounter("blood_donor");
  const id = `DNR-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO blood_donors (
      id, full_name, date_of_birth, gender, phone, email, blood_group,
      weight_kg, hemoglobin_gdl, medical_history, eligibility_status, deferral_reason
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      id,
      input.fullName.trim(),
      input.dateOfBirth?.trim() ?? "",
      input.gender?.trim() ?? "",
      input.phone.trim(),
      input.email?.trim() ?? "",
      input.bloodGroup,
      weight,
      hb,
      input.medicalHistory?.trim() || "No contraindications",
      eligibilityStatus,
      deferralReason,
    ]
  );

  await writeAudit({
    entityType: "Donor",
    entityId: id,
    action: "Registered",
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `Registered ${input.fullName.trim()} (${input.bloodGroup}) — ${eligibilityStatus}`,
  });

  return mapDonor(res.rows[0]);
}

// 2. Collect Blood Donation (creates unit in 'Testing' state until screened)
export async function collectBloodUnit(input: {
  donorId: string;
  component?: BloodComponent;
  volumeMl?: number;
  collectionCenter?: string;
  storageLocation?: string;
  collectionDate?: string;
  actorRole: BloodBankRole;
  actorName: string;
}) {
  if (!input.donorId) {
    throw new HttpError("Donor selection is required.");
  }

  const pool = getPool();
  const dnrRes = await pool.query("SELECT * FROM blood_donors WHERE id = $1", [
    input.donorId,
  ]);
  if (dnrRes.rowCount === 0) {
    throw new HttpError(`Donor ${input.donorId} not found.`, 404);
  }
  const donor = mapDonor(dnrRes.rows[0]);
  if (donor.eligibilityStatus !== "Eligible" || donor.status !== "Active") {
    throw new HttpError(
      `Donor ${donor.fullName} is ${donor.eligibilityStatus} (${donor.deferralReason || donor.status}) and cannot donate.`,
      409
    );
  }

  const component: BloodComponent = input.component ?? "Whole Blood";
  const rule = COMPONENT_RULES[component];
  const colDate = input.collectionDate?.trim() || todayIso();
  const expDate = addDaysIso(colDate, rule.shelfLifeDays);

  const donSeq = await nextCounter("blood_donation");
  const unitSeq = await nextCounter("blood_unit");
  const year = new Date().getFullYear();
  const donationId = `DON-${year}-${pad(donSeq)}`;
  const unitId = `UNT-${year}-${pad(unitSeq)}`;

  const res = await pool.query(
    `INSERT INTO blood_units (
      id, donation_id, donor_id, donor_name, blood_group, component, volume_ml,
      collection_center, storage_location, storage_temp, collection_date, expiry_date,
      screening_status, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'Pending','Testing')
    RETURNING *`,
    [
      unitId,
      donationId,
      donor.id,
      donor.fullName,
      donor.bloodGroup,
      component,
      Number(input.volumeMl || rule.defaultVolumeMl),
      input.collectionCenter?.trim() || "Main Hospital Blood Center",
      input.storageLocation?.trim() || "Quarantine Fridge Q1",
      rule.storageTemp,
      colDate,
      expDate,
    ]
  );

  await pool.query(
    `UPDATE blood_donors
     SET last_donation_date = $2, total_donations = total_donations + 1, updated_at = NOW()
     WHERE id = $1`,
    [donor.id, colDate]
  );

  await writeAudit({
    entityType: "Unit",
    entityId: unitId,
    action: "Collected",
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `Collected ${donor.bloodGroup} ${component} (${donationId}) from ${donor.fullName}; queued for infectious screening`,
  });

  return mapUnit(res.rows[0]);
}

// Screening & Component Separation (3)
export async function screenBloodUnit(input: {
  unitId: string;
  screeningStatus: "Cleared" | "Reactive";
  screeningNotes?: string;
  storageLocation?: string;
  actorRole: BloodBankRole;
  actorName: string;
}) {
  const pool = getPool();
  const curRes = await pool.query("SELECT * FROM blood_units WHERE id = $1", [
    input.unitId,
  ]);
  if (curRes.rowCount === 0) {
    throw new HttpError(`Blood unit ${input.unitId} not found.`, 404);
  }
  const unit = mapUnit(curRes.rows[0]);
  if (unit.status !== "Testing") {
    throw new HttpError(
      `Unit ${unit.id} is already in status "${unit.status}".`,
      409
    );
  }

  const nextStatus =
    input.screeningStatus === "Cleared"
      ? unit.expiryDate <= todayIso()
        ? "Expired"
        : "Available"
      : "Discarded";

  const res = await pool.query(
    `UPDATE blood_units
     SET screening_status = $2,
         screening_notes = $3,
         storage_location = COALESCE(NULLIF($4,''), storage_location),
         status = $5,
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      unit.id,
      input.screeningStatus,
      input.screeningNotes?.trim() ||
        (input.screeningStatus === "Cleared"
          ? "HIV/HBV/HCV/Syphilis/Malaria Non-Reactive"
          : "Reactive marker detected — unit discarded"),
      input.storageLocation?.trim() ?? "",
      nextStatus,
    ]
  );

  await writeAudit({
    entityType: "Unit",
    entityId: unit.id,
    action: `Screening ${input.screeningStatus}`,
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `Unit ${unit.id} (${unit.bloodGroup} ${unit.component}) moved to ${nextStatus}`,
  });

  return mapUnit(res.rows[0]);
}

export async function separateComponent(input: {
  sourceUnitId: string;
  targetComponent: Exclude<BloodComponent, "Whole Blood">;
  storageLocation?: string;
  actorRole: BloodBankRole;
  actorName: string;
}) {
  const pool = getPool();
  const srcRes = await pool.query("SELECT * FROM blood_units WHERE id = $1", [
    input.sourceUnitId,
  ]);
  if (srcRes.rowCount === 0) {
    throw new HttpError(`Source unit ${input.sourceUnitId} not found.`, 404);
  }
  const src = mapUnit(srcRes.rows[0]);
  if (src.screeningStatus !== "Cleared" || src.status !== "Available") {
    throw new HttpError(
      `Source unit ${src.id} must be Cleared and Available before component separation.`,
      409
    );
  }

  const rule = COMPONENT_RULES[input.targetComponent];
  const expDate = addDaysIso(src.collectionDate, rule.shelfLifeDays);
  const unitSeq = await nextCounter("blood_unit");
  const newId = `UNT-${new Date().getFullYear()}-${pad(unitSeq)}`;

  const res = await pool.query(
    `INSERT INTO blood_units (
      id, donation_id, donor_id, donor_name, source_unit_id, blood_group, component,
      volume_ml, collection_center, storage_location, storage_temp,
      collection_date, expiry_date, screening_status, screening_notes, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'Cleared',$14,$15)
    RETURNING *`,
    [
      newId,
      src.donationId,
      src.donorId,
      src.donorName,
      src.id,
      src.bloodGroup,
      input.targetComponent,
      rule.defaultVolumeMl,
      src.collectionCenter,
      input.storageLocation?.trim() || src.storageLocation,
      rule.storageTemp,
      src.collectionDate,
      expDate,
      `Separated from cleared unit ${src.id}`,
      expDate <= todayIso() ? "Expired" : "Available",
    ]
  );

  await writeAudit({
    entityType: "Component",
    entityId: newId,
    action: "Separated",
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `Separated ${src.bloodGroup} ${input.targetComponent} from source ${src.id} (Exp: ${expDate})`,
  });

  return mapUnit(res.rows[0]);
}

// 4. Blood Requests (OPD, IPD, Emergency, Surgery)
export async function createBloodRequest(input: {
  patientId: string;
  department: "OPD" | "IPD" | "Emergency" | "Surgery";
  requestedBloodGroup: BloodGroup;
  component: BloodComponent;
  unitsRequested: number;
  urgency: "Routine" | "Urgent" | "Emergency";
  requestingDoctor: string;
  clinicalIndication: string;
  actorRole: BloodBankRole;
  actorName: string;
}) {
  if (
    !input.patientId ||
    !VALID_BLOOD_GROUPS.has(input.requestedBloodGroup) ||
    !input.requestingDoctor?.trim() ||
    !input.clinicalIndication?.trim() ||
    Number(input.unitsRequested) <= 0
  ) {
    throw new HttpError(
      "Patient, blood group, component, positive quantity, doctor, and clinical indication are required."
    );
  }

  const pool = getPool();
  const patRes = await pool.query(
    "SELECT id, full_name FROM patients WHERE id = $1",
    [input.patientId]
  );
  if (patRes.rowCount === 0) {
    throw new HttpError(`Patient ${input.patientId} not found.`, 404);
  }

  const seq = await nextCounter("blood_request");
  const id = `BRQ-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO blood_requests (
      id, patient_id, patient_name, department, requested_blood_group, component,
      units_requested, urgency, requesting_doctor, clinical_indication, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Pending') RETURNING *`,
    [
      id,
      patRes.rows[0].id,
      patRes.rows[0].full_name,
      input.department,
      input.requestedBloodGroup,
      input.component,
      Number(input.unitsRequested),
      input.urgency,
      input.requestingDoctor.trim(),
      input.clinicalIndication.trim(),
    ]
  );

  await writeAudit({
    entityType: "Request",
    entityId: id,
    action: "Created",
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `${input.urgency} ${input.department} request for ${input.unitsRequested}x ${input.requestedBloodGroup} ${input.component}`,
  });

  return mapRequest(res.rows[0]);
}

export async function updateBloodRequestStatus(input: {
  requestId: string;
  status: "Approved" | "Rejected" | "Cancelled";
  rejectionReason?: string;
  actorRole: BloodBankRole;
  actorName: string;
}) {
  if (input.status === "Rejected" && !input.rejectionReason?.trim()) {
    throw new HttpError("Rejection reason is required.");
  }
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const curRes = await client.query(
      "SELECT * FROM blood_requests WHERE id = $1 FOR UPDATE",
      [input.requestId]
    );
    if (curRes.rowCount === 0) {
      throw new HttpError(`Blood request ${input.requestId} not found.`, 404);
    }

    // Release any reserved units if cancelled/rejected
    if (input.status === "Cancelled" || input.status === "Rejected") {
      await client.query(
        `UPDATE blood_units
         SET status = 'Available', reserved_for_request_id = NULL, updated_at = NOW()
         WHERE reserved_for_request_id = $1 AND status = 'Reserved'`,
        [input.requestId]
      );
    }

    const res = await client.query(
      `UPDATE blood_requests
       SET status = $2,
           rejection_reason = CASE WHEN $2 = 'Rejected' THEN $3 ELSE rejection_reason END,
           approved_by = CASE WHEN $2 = 'Approved' THEN $4 ELSE approved_by END,
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        input.requestId,
        input.status,
        input.rejectionReason?.trim() ?? "",
        input.actorName,
      ]
    );

    await writeAudit(
      {
        entityType: "Request",
        entityId: input.requestId,
        action: input.status,
        actorRole: input.actorRole,
        actorName: input.actorName,
        details: input.rejectionReason?.trim() || `Request marked ${input.status}`,
      },
      client
    );

    await client.query("COMMIT");
    return mapRequest(res.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// 5. Compatibility Testing & Verification (Enforces ABO/Rh medical compatibility)
export async function recordCompatibilityTest(input: {
  requestId: string;
  unitId: string;
  antibodyScreen?: "Negative" | "Positive";
  testedBy: string;
  notes?: string;
  actorRole: BloodBankRole;
}) {
  const pool = getPool();
  const [reqRes, untRes] = await Promise.all([
    pool.query("SELECT * FROM blood_requests WHERE id = $1", [input.requestId]),
    pool.query("SELECT * FROM blood_units WHERE id = $1", [input.unitId]),
  ]);

  if (reqRes.rowCount === 0) {
    throw new HttpError(`Request ${input.requestId} not found.`, 404);
  }
  if (untRes.rowCount === 0) {
    throw new HttpError(`Unit ${input.unitId} not found.`, 404);
  }

  const req = mapRequest(reqRes.rows[0]);
  const unit = mapUnit(untRes.rows[0]);

  if (unit.screeningStatus !== "Cleared") {
    throw new HttpError(
      `Unit ${unit.id} has screening status "${unit.screeningStatus}" and cannot be crossmatched.`,
      409
    );
  }
  if (unit.expiryDate <= todayIso() || unit.status === "Expired") {
    throw new HttpError(`Unit ${unit.id} is expired and cannot be crossmatched.`, 409);
  }
  if (unit.component !== req.component) {
    throw new HttpError(
      `Component mismatch: request needs ${req.component}, unit ${unit.id} is ${unit.component}.`,
      400
    );
  }

  const aboCompatible = isBloodCompatible(
    req.requestedBloodGroup,
    unit.bloodGroup,
    req.component
  );
  const abScreen = input.antibodyScreen ?? "Negative";
  const crossmatchResult =
    aboCompatible && abScreen === "Negative" ? "Compatible" : "Incompatible";

  const seq = await nextCounter("blood_compatibility");
  const id = `CMP-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO blood_compatibility_tests (
      id, request_id, patient_id, patient_name, patient_blood_group, unit_id,
      donor_blood_group, component, grouping_confirmed, crossmatch_result,
      antibody_screen, tested_by, verification_status, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,$9,$10,$11,'Pending',$12)
    RETURNING *`,
    [
      id,
      req.id,
      req.patientId,
      req.patientName,
      req.requestedBloodGroup,
      unit.id,
      unit.bloodGroup,
      req.component,
      crossmatchResult,
      abScreen,
      input.testedBy || input.actorRole,
      input.notes?.trim() ||
        (aboCompatible
          ? `${unit.bloodGroup} donor unit compatible with ${req.requestedBloodGroup} recipient (${req.component})`
          : `ABO/Rh INCOMPATIBLE: ${unit.bloodGroup} cannot be transfused to ${req.requestedBloodGroup}`),
    ]
  );

  await writeAudit({
    entityType: "Compatibility",
    entityId: id,
    action: crossmatchResult,
    actorRole: input.actorRole,
    actorName: input.testedBy || input.actorRole,
    details: `Crossmatch ${crossmatchResult} for ${req.id} (${req.requestedBloodGroup}) with ${unit.id} (${unit.bloodGroup})`,
  });

  return mapCompatibility(res.rows[0]);
}

export async function verifyCompatibilityTest(input: {
  testId: string;
  verificationStatus: "Verified" | "Rejected";
  verifiedBy: string;
  actorRole: BloodBankRole;
}) {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE blood_compatibility_tests
     SET verification_status = $2, verified_by = $3, verified_at = NOW()
     WHERE id = $1 RETURNING *`,
    [input.testId, input.verificationStatus, input.verifiedBy || input.actorRole]
  );
  if (res.rowCount === 0) {
    throw new HttpError(`Compatibility test ${input.testId} not found.`, 404);
  }
  await writeAudit({
    entityType: "Compatibility",
    entityId: input.testId,
    action: input.verificationStatus,
    actorRole: input.actorRole,
    actorName: input.verifiedBy || input.actorRole,
    details: `Compatibility record ${input.testId} marked ${input.verificationStatus}`,
  });
  return mapCompatibility(res.rows[0]);
}

// Reserve & Issue Blood Unit (Atomic! Requires Verified & Compatible crossmatch)
export async function reserveOrIssueUnit(input: {
  requestId: string;
  unitId: string;
  action: "reserve" | "issue";
  actorRole: BloodBankRole;
  actorName: string;
}) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const [reqRes, untRes, cmpRes] = await Promise.all([
      client.query("SELECT * FROM blood_requests WHERE id = $1 FOR UPDATE", [
        input.requestId,
      ]),
      client.query("SELECT * FROM blood_units WHERE id = $1 FOR UPDATE", [
        input.unitId,
      ]),
      client.query(
        `SELECT * FROM blood_compatibility_tests
         WHERE request_id = $1 AND unit_id = $2
         ORDER BY tested_at DESC LIMIT 1`,
        [input.requestId, input.unitId]
      ),
    ]);

    if (reqRes.rowCount === 0) {
      throw new HttpError(`Blood request ${input.requestId} not found.`, 404);
    }
    if (untRes.rowCount === 0) {
      throw new HttpError(`Blood unit ${input.unitId} not found.`, 404);
    }

    const req = mapRequest(reqRes.rows[0]);
    const unit = mapUnit(untRes.rows[0]);

    if (req.status === "Rejected" || req.status === "Cancelled") {
      throw new HttpError(`Cannot allocate to a ${req.status} request.`, 409);
    }
    if (unit.screeningStatus !== "Cleared") {
      throw new HttpError("Cannot issue/reserve unscreened or reactive blood unit.", 409);
    }
    if (unit.expiryDate <= todayIso() || unit.status === "Expired") {
      throw new HttpError("Cannot issue/reserve an expired blood unit.", 409);
    }
    if (!isBloodCompatible(req.requestedBloodGroup, unit.bloodGroup, req.component)) {
      throw new HttpError(
        `Safety block: ${unit.bloodGroup} ${unit.component} is NOT compatible with ${req.requestedBloodGroup}.`,
        409
      );
    }

    if (cmpRes.rowCount === 0) {
      throw new HttpError(
        "Safety block: Perform and verify compatibility crossmatching before reserving or issuing this unit.",
        409
      );
    }
    const cmp = mapCompatibility(cmpRes.rows[0]);
    if (
      cmp.crossmatchResult !== "Compatible" ||
      cmp.verificationStatus !== "Verified"
    ) {
      throw new HttpError(
        `Safety block: Crossmatch ${cmp.id} must be Compatible AND Verified before allocation (currently ${cmp.crossmatchResult} / ${cmp.verificationStatus}).`,
        409
      );
    }

    if (input.action === "reserve") {
      if (unit.status !== "Available") {
        throw new HttpError(
          `Duplicate allocation prevented: unit ${unit.id} is currently ${unit.status}.`,
          409
        );
      }
      await client.query(
        `UPDATE blood_units SET status = 'Reserved', reserved_for_request_id = $2, updated_at = NOW() WHERE id = $1`,
        [unit.id, req.id]
      );
      await client.query(
        `UPDATE blood_requests SET status = 'Reserved', updated_at = NOW() WHERE id = $1`,
        [req.id]
      );
    } else {
      // Issue
      if (
        unit.status !== "Available" &&
        !(unit.status === "Reserved" && unit.reservedForRequestId === req.id)
      ) {
        throw new HttpError(
          `Duplicate issue prevented: unit ${unit.id} is currently ${unit.status}.`,
          409
        );
      }
      await client.query(
        `UPDATE blood_units SET status = 'Issued', reserved_for_request_id = $2, updated_at = NOW() WHERE id = $1`,
        [unit.id, req.id]
      );
      const nextFulfilled = req.unitsFulfilled + 1;
      const nextReqStatus =
        nextFulfilled >= req.unitsRequested ? "Fulfilled" : "Reserved";
      await client.query(
        `UPDATE blood_requests SET units_fulfilled = $2, status = $3, updated_at = NOW() WHERE id = $1`,
        [req.id, nextFulfilled, nextReqStatus]
      );
    }

    await writeAudit(
      {
        entityType: "Unit",
        entityId: unit.id,
        action: input.action === "reserve" ? "Reserved" : "Issued",
        actorRole: input.actorRole,
        actorName: input.actorName,
        details: `${input.action === "reserve" ? "Reserved" : "Issued"} ${unit.bloodGroup} ${unit.component} (${unit.id}) for ${req.id} (${req.patientName})`,
      },
      client
    );

    await client.query("COMMIT");
    return { unitId: unit.id, requestId: req.id, action: input.action };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// 6. Transfusion Records
export async function recordTransfusion(input: {
  unitId: string;
  administeringStaff: string;
  monitoringObservations: string;
  adverseReaction?: string;
  adverseReactionNotes?: string;
  actorRole: BloodBankRole;
}) {
  if (!input.unitId || !input.administeringStaff?.trim()) {
    throw new HttpError("Issued blood unit and administering staff are required.");
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const untRes = await client.query(
      "SELECT * FROM blood_units WHERE id = $1 FOR UPDATE",
      [input.unitId]
    );
    if (untRes.rowCount === 0) {
      throw new HttpError(`Unit ${input.unitId} not found.`, 404);
    }
    const unit = mapUnit(untRes.rows[0]);
    if (unit.status !== "Issued" || !unit.reservedForRequestId) {
      throw new HttpError(
        `Unit ${unit.id} must be Issued against a blood request before recording transfusion (currently ${unit.status}).`,
        409
      );
    }

    const [reqRes, cmpRes] = await Promise.all([
      client.query("SELECT * FROM blood_requests WHERE id = $1", [
        unit.reservedForRequestId,
      ]),
      client.query(
        `SELECT * FROM blood_compatibility_tests
         WHERE request_id = $1 AND unit_id = $2 AND verification_status = 'Verified'
         ORDER BY tested_at DESC LIMIT 1`,
        [unit.reservedForRequestId, unit.id]
      ),
    ]);
    if (reqRes.rowCount === 0 || cmpRes.rowCount === 0) {
      throw new HttpError(
        "Missing verified compatibility record for this issued unit.",
        409
      );
    }

    const req = mapRequest(reqRes.rows[0]);
    const cmp = mapCompatibility(cmpRes.rows[0]);
    const reaction = input.adverseReaction?.trim() || "None";
    const status =
      reaction === "None" ? "Completed" : "Stopped - Reaction";

    const seq = await nextCounter("blood_transfusion", client);
    const id = `TRN-${new Date().getFullYear()}-${pad(seq)}`;

    const res = await client.query(
      `INSERT INTO blood_transfusions (
        id, request_id, unit_id, compatibility_test_id, patient_id, patient_name,
        blood_group, component, volume_ml, administering_staff, completed_at,
        monitoring_observations, adverse_reaction, adverse_reaction_notes, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11,$12,$13,$14) RETURNING *`,
      [
        id,
        req.id,
        unit.id,
        cmp.id,
        req.patientId,
        req.patientName,
        unit.bloodGroup,
        unit.component,
        unit.volumeMl,
        input.administeringStaff.trim(),
        input.monitoringObservations?.trim() || "Vitals stable throughout transfusion",
        reaction,
        input.adverseReactionNotes?.trim() ?? "",
        status,
      ]
    );

    await client.query(
      `UPDATE blood_units SET status = 'Transfused', updated_at = NOW() WHERE id = $1`,
      [unit.id]
    );

    await writeAudit(
      {
        entityType: "Transfusion",
        entityId: id,
        action: status,
        actorRole: input.actorRole,
        actorName: input.administeringStaff.trim(),
        details: `Transfused ${unit.id} (${unit.bloodGroup} ${unit.component}) to ${req.patientName}. Reaction: ${reaction}`,
      },
      client
    );

    await client.query("COMMIT");
    return mapTransfusion(res.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// 7. Discard Expired / Damaged Unit
export async function discardBloodUnit(input: {
  unitId: string;
  reason: string;
  actorRole: BloodBankRole;
  actorName: string;
}) {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE blood_units
     SET status = 'Discarded',
         screening_notes = CASE WHEN screening_notes = '' THEN $2 ELSE screening_notes || ' | Discarded: ' || $2 END,
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [input.unitId, input.reason?.trim() || "Expired / disposed per biomedical protocol"]
  );
  if (res.rowCount === 0) {
    throw new HttpError(`Unit ${input.unitId} not found.`, 404);
  }
  await writeAudit({
    entityType: "Unit",
    entityId: input.unitId,
    action: "Discarded",
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: input.reason?.trim() || "Unit discarded",
  });
  return mapUnit(res.rows[0]);
}
