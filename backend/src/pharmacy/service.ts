import { getPool } from "../db/client.js";
import { HttpError } from "../opd/service.js";

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

export interface HistoryEntry {
  status?: string;
  action?: string;
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

async function nextCounter(key: string): Promise<number> {
  const pool = getPool();
  const res = await pool.query(
    `INSERT INTO entity_counters (counter_key, current_value)
     VALUES ($1, 1)
     ON CONFLICT (counter_key)
     DO UPDATE SET current_value = entity_counters.current_value + 1
     RETURNING current_value`,
    [key]
  );
  return Number(res.rows[0].current_value);
}

async function getAvailableStockForMedicine(medicineId: string): Promise<number> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT COALESCE(SUM(remaining_qty), 0)::int AS total
     FROM pharmacy_batches
     WHERE medicine_id = $1
       AND status = 'Active'
       AND remaining_qty > 0
       AND expiry_date > $2`,
    [medicineId, todayIso()]
  );
  return Number(res.rows[0]?.total ?? 0);
}

function mapSupplier(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    name: r.name as string,
    contactPerson: r.contact_person as string,
    phone: r.phone as string,
    email: (r.email as string) ?? "",
    address: (r.address as string) ?? "",
    licenseNumber: (r.license_number as string) ?? "",
    status: r.status as "Active" | "Inactive",
    notes: (r.notes as string) ?? "",
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

function mapBatch(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    batchNumber: r.batch_number as string,
    medicineId: r.medicine_id as string,
    supplierId: (r.supplier_id as string | null) ?? undefined,
    manufacturer: r.manufacturer as string,
    initialQty: Number(r.initial_qty),
    remainingQty: Number(r.remaining_qty),
    purchaseDate: r.purchase_date as string,
    manufacturingDate: r.manufacturing_date as string,
    expiryDate: r.expiry_date as string,
    unitCost: Number(r.unit_cost),
    status: r.status as
      | "Active"
      | "Expired"
      | "Quarantined"
      | "Disposed"
      | "Depleted",
    expiryHistory: (r.expiry_history as HistoryEntry[]) ?? [],
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

function mapMovement(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    medicineId: r.medicine_id as string,
    batchId: (r.batch_id as string | null) ?? undefined,
    movementType: r.movement_type as
      | "Received"
      | "Dispensed"
      | "Adjustment"
      | "Quarantined"
      | "Disposed",
    quantityDelta: Number(r.quantity_delta),
    balanceAfter: Number(r.balance_after),
    reason: (r.reason as string) ?? "",
    performedBy: r.performed_by as string,
    createdAt: (r.created_at as Date).toISOString(),
  };
}

function mapPrescription(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    doctorName: r.doctor_name as string,
    items: (r.items as PrescriptionItem[]) ?? [],
    status: r.status as
      | "Pending"
      | "Processing"
      | "Partially Fulfilled"
      | "Completed"
      | "Cancelled",
    validatedBy: (r.validated_by as string | null) ?? undefined,
    validatedAt: r.validated_at
      ? (r.validated_at as Date).toISOString()
      : undefined,
    processingHistory: (r.processing_history as HistoryEntry[]) ?? [],
    prescribedAt: (r.prescribed_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

function mapDispensing(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    prescriptionId: r.prescription_id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    medicineId: r.medicine_id as string,
    medicineName: r.medicine_name as string,
    batchId: r.batch_id as string,
    batchNumber: r.batch_number as string,
    expiryDate: r.expiry_date as string,
    quantityDispensed: Number(r.quantity_dispensed),
    dosageInstructions: (r.dosage_instructions as string) ?? "",
    dispensedBy: r.dispensed_by as string,
    dispensedAt: (r.dispensed_at as Date).toISOString(),
  };
}

export async function getPharmacyState() {
  const pool = getPool();
  const today = todayIso();

  const [
    docRes,
    patRes,
    supRes,
    medRes,
    bchRes,
    movRes,
    rxRes,
    dspRes,
  ] = await Promise.all([
    pool.query("SELECT id, name, department FROM opd_doctors ORDER BY name ASC"),
    pool.query(
      "SELECT id, full_name, date_of_birth, gender, phone FROM patients ORDER BY created_at DESC"
    ),
    pool.query("SELECT * FROM pharmacy_suppliers ORDER BY name ASC"),
    pool.query("SELECT * FROM pharmacy_medicines ORDER BY medicine_name ASC"),
    pool.query(
      "SELECT * FROM pharmacy_batches ORDER BY expiry_date ASC, created_at ASC"
    ),
    pool.query(
      "SELECT * FROM pharmacy_stock_movements ORDER BY created_at DESC LIMIT 100"
    ),
    pool.query(
      "SELECT * FROM pharmacy_prescriptions ORDER BY prescribed_at DESC"
    ),
    pool.query("SELECT * FROM pharmacy_dispensings ORDER BY dispensed_at DESC"),
  ]);

  const batches = bchRes.rows.map(mapBatch);
  const dispensings = dspRes.rows.map(mapDispensing);

  // Aggregate accurate available & dispensed quantities per medicine
  const availByMed = new Map<string, number>();
  for (const b of batches) {
    if (b.status === "Active" && b.remainingQty > 0 && b.expiryDate > today) {
      availByMed.set(b.medicineId, (availByMed.get(b.medicineId) ?? 0) + b.remainingQty);
    }
  }
  const dispensedByMed = new Map<string, number>();
  for (const d of dispensings) {
    dispensedByMed.set(
      d.medicineId,
      (dispensedByMed.get(d.medicineId) ?? 0) + d.quantityDispensed
    );
  }

  const medicines = medRes.rows.map((m) => {
    const id = m.id as string;
    const availableStock = availByMed.get(id) ?? 0;
    const minStockThreshold = Number(m.min_stock_threshold);
    return {
      id,
      medicineCode: m.medicine_code as string,
      medicineName: m.medicine_name as string,
      genericName: m.generic_name as string,
      brand: (m.brand as string) ?? "",
      category: m.category as string,
      strength: m.strength as string,
      dosageForm: m.dosage_form as string,
      manufacturer: m.manufacturer as string,
      unitPrice: Number(m.unit_price),
      minStockThreshold,
      availableStock,
      reservedQty: Number(m.reserved_qty ?? 0),
      dispensedQty: dispensedByMed.get(id) ?? 0,
      stockAlert:
        availableStock === 0
          ? ("Out of Stock" as const)
          : availableStock <= minStockThreshold
            ? ("Low Stock" as const)
            : ("In Stock" as const),
      isActive: Boolean(m.is_active),
      createdAt: (m.created_at as Date).toISOString(),
      updatedAt: (m.updated_at as Date).toISOString(),
    };
  });

  return {
    doctors: docRes.rows.map((d) => ({
      id: d.id as string,
      name: d.name as string,
      department: d.department as string,
    })),
    patients: patRes.rows.map((p) => ({
      id: p.id as string,
      fullName: p.full_name as string,
      dateOfBirth: (p.date_of_birth as string) ?? "",
      gender: (p.gender as string) ?? "",
      phone: (p.phone as string) ?? "",
    })),
    suppliers: supRes.rows.map(mapSupplier),
    medicines,
    batches,
    stockMovements: movRes.rows.map(mapMovement),
    prescriptions: rxRes.rows.map(mapPrescription),
    dispensings,
  };
}

// 1. Medicine Catalog
export async function createMedicine(input: {
  medicineCode: string;
  medicineName: string;
  genericName: string;
  brand?: string;
  category: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  unitPrice: number;
  minStockThreshold?: number;
}) {
  if (
    !input.medicineCode?.trim() ||
    !input.medicineName?.trim() ||
    !input.genericName?.trim() ||
    !input.category?.trim() ||
    !input.strength?.trim() ||
    !input.dosageForm?.trim() ||
    !input.manufacturer?.trim()
  ) {
    throw new HttpError(
      "Medicine code, name, generic name, category, strength, dosage form, and manufacturer are required."
    );
  }

  const code = input.medicineCode.trim().toUpperCase();
  const pool = getPool();
  const dup = await pool.query(
    `SELECT id FROM pharmacy_medicines
     WHERE UPPER(medicine_code) = $1
        OR (LOWER(medicine_name) = LOWER($2) AND LOWER(strength) = LOWER($3))`,
    [code, input.medicineName.trim(), input.strength.trim()]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Duplicate medicine prevented: "${code}" or same name+strength already exists.`,
      409
    );
  }

  const seq = await nextCounter("pharmacy_medicine");
  const id = `MED-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO pharmacy_medicines (
      id, medicine_code, medicine_name, generic_name, brand, category,
      strength, dosage_form, manufacturer, unit_price, min_stock_threshold
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      id,
      code,
      input.medicineName.trim(),
      input.genericName.trim(),
      input.brand?.trim() ?? "",
      input.category.trim(),
      input.strength.trim(),
      input.dosageForm.trim(),
      input.manufacturer.trim(),
      Math.max(0, Number(input.unitPrice ?? 0)),
      Math.max(0, Number(input.minStockThreshold ?? 20)),
    ]
  );

  return res.rows[0];
}

export async function updateMedicine(input: {
  medicineId: string;
  isActive?: boolean;
  unitPrice?: number;
  minStockThreshold?: number;
  reservedQty?: number;
}) {
  if (!input.medicineId) {
    throw new HttpError("medicineId is required.");
  }
  const pool = getPool();
  const res = await pool.query(
    `UPDATE pharmacy_medicines
     SET is_active = COALESCE($2, is_active),
         unit_price = COALESCE($3, unit_price),
         min_stock_threshold = COALESCE($4, min_stock_threshold),
         reserved_qty = COALESCE($5, reserved_qty),
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      input.medicineId,
      input.isActive !== undefined ? Boolean(input.isActive) : null,
      input.unitPrice !== undefined ? Math.max(0, Number(input.unitPrice)) : null,
      input.minStockThreshold !== undefined
        ? Math.max(0, Number(input.minStockThreshold))
        : null,
      input.reservedQty !== undefined
        ? Math.max(0, Number(input.reservedQty))
        : null,
    ]
  );
  if (res.rowCount === 0) {
    throw new HttpError(`Medicine ${input.medicineId} not found.`, 404);
  }
  return res.rows[0];
}

// 2. Prescription Processing
export async function createPrescription(input: {
  patientId: string;
  doctorName: string;
  items: {
    medicineId: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    prescribedQty: number;
  }[];
}) {
  if (
    !input.patientId ||
    !input.doctorName?.trim() ||
    !Array.isArray(input.items) ||
    input.items.length === 0
  ) {
    throw new HttpError(
      "Patient, doctor, and at least one prescribed medicine are required."
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

  const normalizedItems: PrescriptionItem[] = [];
  for (const item of input.items) {
    if (!item.medicineId || Number(item.prescribedQty) <= 0) {
      throw new HttpError(
        "Each prescription line must select a medicine and positive quantity."
      );
    }
    const medRes = await pool.query(
      "SELECT id, medicine_code, medicine_name, is_active FROM pharmacy_medicines WHERE id = $1",
      [item.medicineId]
    );
    if (medRes.rowCount === 0) {
      throw new HttpError(`Medicine ${item.medicineId} not found.`, 404);
    }
    if (!medRes.rows[0].is_active) {
      throw new HttpError(
        `Medicine ${medRes.rows[0].medicine_name} is inactive and cannot be prescribed.`
      );
    }
    normalizedItems.push({
      medicineId: medRes.rows[0].id as string,
      medicineCode: medRes.rows[0].medicine_code as string,
      medicineName: medRes.rows[0].medicine_name as string,
      dosage: item.dosage?.trim() || "1 dose",
      frequency: item.frequency?.trim() || "BD",
      duration: item.duration?.trim() || "5 days",
      instructions: item.instructions?.trim() ?? "",
      prescribedQty: Number(item.prescribedQty),
      dispensedQty: 0,
    });
  }

  const seq = await nextCounter("pharmacy_prescription");
  const id = `RX-${new Date().getFullYear()}-${pad(seq)}`;
  const history: HistoryEntry[] = [
    {
      status: "Pending",
      staff: input.doctorName.trim(),
      timestamp: new Date().toISOString(),
      note: `Prescription issued with ${normalizedItems.length} medicine line(s)`,
    },
  ];

  const res = await pool.query(
    `INSERT INTO pharmacy_prescriptions (
      id, patient_id, patient_name, doctor_name, items, status, processing_history
    ) VALUES ($1,$2,$3,$4,$5::jsonb,'Pending',$6::jsonb)
    RETURNING *`,
    [
      id,
      patRes.rows[0].id,
      patRes.rows[0].full_name,
      input.doctorName.trim(),
      JSON.stringify(normalizedItems),
      JSON.stringify(history),
    ]
  );

  return mapPrescription(res.rows[0]);
}

export async function processPrescription(input: {
  prescriptionId: string;
  status: "Processing" | "Cancelled";
  staff: string;
  note?: string;
}) {
  const pool = getPool();
  const curRes = await pool.query(
    "SELECT * FROM pharmacy_prescriptions WHERE id = $1",
    [input.prescriptionId]
  );
  if (curRes.rowCount === 0) {
    throw new HttpError(`Prescription ${input.prescriptionId} not found.`, 404);
  }
  const cur = mapPrescription(curRes.rows[0]);
  if (cur.status === "Completed") {
    throw new HttpError("Completed prescriptions cannot be modified.", 409);
  }

  const history: HistoryEntry[] = [
    ...cur.processingHistory,
    {
      status: input.status,
      staff: input.staff || "Pharmacist",
      timestamp: new Date().toISOString(),
      note:
        input.note?.trim() ||
        (input.status === "Processing"
          ? "Prescription reviewed & validated for dispensing"
          : "Prescription cancelled"),
    },
  ];

  const res = await pool.query(
    `UPDATE pharmacy_prescriptions
     SET status = $2,
         validated_by = CASE WHEN $2 = 'Processing' THEN $3 ELSE validated_by END,
         validated_at = CASE WHEN $2 = 'Processing' THEN NOW() ELSE validated_at END,
         processing_history = $4::jsonb,
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [cur.id, input.status, input.staff || "Pharmacist", JSON.stringify(history)]
  );

  return mapPrescription(res.rows[0]);
}

// 3. Medicine Dispensing (Strict FEFO + Expiry Block + Partial Dispensing + Auto Stock Update)
export async function dispenseMedicine(input: {
  prescriptionId: string;
  medicineId: string;
  quantity: number;
  dosageInstructions?: string;
  dispensedBy: string;
  allowPartial?: boolean;
}) {
  if (
    !input.prescriptionId ||
    !input.medicineId ||
    Number(input.quantity) <= 0
  ) {
    throw new HttpError(
      "Prescription, medicine, and positive dispensing quantity are required."
    );
  }

  const pool = getPool();
  const today = todayIso();

  const rxRes = await pool.query(
    "SELECT * FROM pharmacy_prescriptions WHERE id = $1",
    [input.prescriptionId]
  );
  if (rxRes.rowCount === 0) {
    throw new HttpError(`Prescription ${input.prescriptionId} not found.`, 404);
  }
  const rx = mapPrescription(rxRes.rows[0]);
  if (rx.status === "Cancelled" || rx.status === "Completed") {
    throw new HttpError(
      `Cannot dispense: prescription ${rx.id} is already ${rx.status}.`,
      409
    );
  }

  const itemIdx = rx.items.findIndex((i) => i.medicineId === input.medicineId);
  if (itemIdx === -1) {
    throw new HttpError(
      `Medicine ${input.medicineId} is not listed on prescription ${rx.id}.`,
      400
    );
  }

  const item = rx.items[itemIdx];
  const remainingNeeded = item.prescribedQty - item.dispensedQty;
  if (remainingNeeded <= 0) {
    throw new HttpError(
      `${item.medicineName} on ${rx.id} has already been fully dispensed.`,
      409
    );
  }

  const requestedQty = Math.min(Number(input.quantity), remainingNeeded);

  // FEFO: First Expiry, First Out — strictly exclude expired, quarantined, disposed, or empty batches
  const batchRes = await pool.query(
    `SELECT * FROM pharmacy_batches
     WHERE medicine_id = $1
       AND status = 'Active'
       AND remaining_qty > 0
       AND expiry_date > $2
     ORDER BY expiry_date ASC, created_at ASC`,
    [input.medicineId, today]
  );

  const eligibleBatches = batchRes.rows.map(mapBatch);
  const totalAvailable = eligibleBatches.reduce(
    (sum, b) => sum + b.remainingQty,
    0
  );

  if (totalAvailable <= 0) {
    throw new HttpError(
      `Cannot dispense ${item.medicineName}: no non-expired active stock available.`,
      409
    );
  }

  if (requestedQty > totalAvailable && !input.allowPartial) {
    throw new HttpError(
      `Insufficient stock for ${item.medicineName}: requested ${requestedQty}, available ${totalAvailable}. Enable Partial Dispensing to issue ${totalAvailable}.`,
      409
    );
  }

  let toDispense = Math.min(requestedQty, totalAvailable);
  const actualDispensedTotal = toDispense;
  const createdDispensings = [];
  const usedBatchLabels: string[] = [];

  for (const batch of eligibleBatches) {
    if (toDispense <= 0) break;
    const take = Math.min(toDispense, batch.remainingQty);
    const newRemaining = batch.remainingQty - take;
    const newStatus = newRemaining === 0 ? "Depleted" : "Active";

    await pool.query(
      `UPDATE pharmacy_batches
       SET remaining_qty = $2, status = $3, updated_at = NOW()
       WHERE id = $1`,
      [batch.id, newRemaining, newStatus]
    );

    const dspSeq = await nextCounter("pharmacy_dispensing");
    const dspId = `DSP-${new Date().getFullYear()}-${pad(dspSeq)}`;
    const dspRes = await pool.query(
      `INSERT INTO pharmacy_dispensings (
        id, prescription_id, patient_id, patient_name, medicine_id, medicine_name,
        batch_id, batch_number, expiry_date, quantity_dispensed, dosage_instructions, dispensed_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        dspId,
        rx.id,
        rx.patientId,
        rx.patientName,
        item.medicineId,
        item.medicineName,
        batch.id,
        batch.batchNumber,
        batch.expiryDate,
        take,
        input.dosageInstructions?.trim() ||
          `${item.dosage} ${item.frequency} x ${item.duration} ${item.instructions}`.trim(),
        input.dispensedBy || "Pharmacist",
      ]
    );
    createdDispensings.push(mapDispensing(dspRes.rows[0]));
    usedBatchLabels.push(`${batch.batchNumber} (x${take}, exp ${batch.expiryDate})`);

    const balanceAfter = await getAvailableStockForMedicine(item.medicineId);
    const stkSeq = await nextCounter("pharmacy_stock_movement");
    await pool.query(
      `INSERT INTO pharmacy_stock_movements (
        id, medicine_id, batch_id, movement_type, quantity_delta, balance_after, reason, performed_by
      ) VALUES ($1,$2,$3,'Dispensed',$4,$5,$6,$7)`,
      [
        `STK-${new Date().getFullYear()}-${pad(stkSeq)}`,
        item.medicineId,
        batch.id,
        -take,
        balanceAfter,
        `FEFO dispensing for ${rx.id} (${rx.patientName})`,
        input.dispensedBy || "Pharmacist",
      ]
    );

    toDispense -= take;
  }

  // Update prescription item dispensedQty and overall status
  const updatedItems = rx.items.map((it, idx) =>
    idx === itemIdx
      ? { ...it, dispensedQty: it.dispensedQty + actualDispensedTotal }
      : it
  );
  const allFulfilled = updatedItems.every(
    (it) => it.dispensedQty >= it.prescribedQty
  );
  const nextStatus = allFulfilled ? "Completed" : "Partially Fulfilled";

  const history: HistoryEntry[] = [
    ...rx.processingHistory,
    {
      status: nextStatus,
      staff: input.dispensedBy || "Pharmacist",
      timestamp: new Date().toISOString(),
      note: `Dispensed ${actualDispensedTotal}x ${item.medicineName} via FEFO: ${usedBatchLabels.join(", ")}`,
    },
  ];

  await pool.query(
    `UPDATE pharmacy_prescriptions
     SET items = $2::jsonb,
         status = $3,
         validated_by = COALESCE(validated_by, $4),
         validated_at = COALESCE(validated_at, NOW()),
         processing_history = $5::jsonb,
         updated_at = NOW()
     WHERE id = $1`,
    [
      rx.id,
      JSON.stringify(updatedItems),
      nextStatus,
      input.dispensedBy || "Pharmacist",
      JSON.stringify(history),
    ]
  );

  return { dispensings: createdDispensings, prescriptionStatus: nextStatus };
}

// 4 & 5. Batch Creation (Stock Receiving) + Stock Adjustments
export async function createBatch(input: {
  medicineId: string;
  supplierId?: string;
  batchNumber: string;
  manufacturer: string;
  quantity: number;
  purchaseDate: string;
  manufacturingDate: string;
  expiryDate: string;
  unitCost?: number;
  performedBy: string;
}) {
  if (
    !input.medicineId ||
    !input.batchNumber?.trim() ||
    !input.manufacturer?.trim() ||
    Number(input.quantity) <= 0 ||
    !input.purchaseDate?.trim() ||
    !input.manufacturingDate?.trim() ||
    !input.expiryDate?.trim()
  ) {
    throw new HttpError(
      "Medicine, batch number, manufacturer, positive quantity, purchase date, manufacturing date, and expiry date are required."
    );
  }

  const pool = getPool();
  const medRes = await pool.query(
    "SELECT id, medicine_name FROM pharmacy_medicines WHERE id = $1",
    [input.medicineId]
  );
  if (medRes.rowCount === 0) {
    throw new HttpError(`Medicine ${input.medicineId} not found.`, 404);
  }

  const batchNum = input.batchNumber.trim().toUpperCase();
  const dup = await pool.query(
    `SELECT id FROM pharmacy_batches
     WHERE medicine_id = $1 AND UPPER(batch_number) = $2`,
    [input.medicineId, batchNum]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Batch ${batchNum} already exists for this medicine.`,
      409
    );
  }

  const today = todayIso();
  const initialStatus = input.expiryDate <= today ? "Expired" : "Active";
  const seq = await nextCounter("pharmacy_batch");
  const id = `BCH-${new Date().getFullYear()}-${pad(seq)}`;
  const qty = Number(input.quantity);

  const res = await pool.query(
    `INSERT INTO pharmacy_batches (
      id, batch_number, medicine_id, supplier_id, manufacturer, initial_qty, remaining_qty,
      purchase_date, manufacturing_date, expiry_date, unit_cost, status, expiry_history
    ) VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12::jsonb)
    RETURNING *`,
    [
      id,
      batchNum,
      input.medicineId,
      input.supplierId || null,
      input.manufacturer.trim(),
      qty,
      input.purchaseDate.trim(),
      input.manufacturingDate.trim(),
      input.expiryDate.trim(),
      Math.max(0, Number(input.unitCost ?? 0)),
      initialStatus,
      JSON.stringify(
        initialStatus === "Expired"
          ? [
              {
                action: "Expired",
                staff: input.performedBy || "Pharmacist",
                timestamp: new Date().toISOString(),
                note: "Received with past expiry date — automatically blocked",
              },
            ]
          : []
      ),
    ]
  );

  const balanceAfter = await getAvailableStockForMedicine(input.medicineId);
  const stkSeq = await nextCounter("pharmacy_stock_movement");
  await pool.query(
    `INSERT INTO pharmacy_stock_movements (
      id, medicine_id, batch_id, movement_type, quantity_delta, balance_after, reason, performed_by
    ) VALUES ($1,$2,$3,'Received',$4,$5,$6,$7)`,
    [
      `STK-${new Date().getFullYear()}-${pad(stkSeq)}`,
      input.medicineId,
      id,
      qty,
      balanceAfter,
      `Batch ${batchNum} received${input.supplierId ? ` from ${input.supplierId}` : ""}`,
      input.performedBy || "Pharmacist",
    ]
  );

  return mapBatch(res.rows[0]);
}

export async function adjustBatchStock(input: {
  batchId: string;
  quantityDelta: number;
  reason: string;
  performedBy: string;
}) {
  if (!input.batchId || !input.reason?.trim() || Number(input.quantityDelta) === 0) {
    throw new HttpError(
      "Batch, non-zero adjustment quantity, and reason are required."
    );
  }

  const pool = getPool();
  const curRes = await pool.query(
    "SELECT * FROM pharmacy_batches WHERE id = $1",
    [input.batchId]
  );
  if (curRes.rowCount === 0) {
    throw new HttpError(`Batch ${input.batchId} not found.`, 404);
  }
  const batch = mapBatch(curRes.rows[0]);
  const nextQty = batch.remainingQty + Number(input.quantityDelta);
  if (nextQty < 0) {
    throw new HttpError(
      `Invalid adjustment: batch ${batch.batchNumber} only has ${batch.remainingQty} unit(s) remaining.`,
      400
    );
  }

  const nextStatus =
    batch.status === "Active" || batch.status === "Depleted"
      ? nextQty === 0
        ? "Depleted"
        : "Active"
      : batch.status;

  const res = await pool.query(
    `UPDATE pharmacy_batches
     SET remaining_qty = $2, status = $3, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [batch.id, nextQty, nextStatus]
  );

  const balanceAfter = await getAvailableStockForMedicine(batch.medicineId);
  const stkSeq = await nextCounter("pharmacy_stock_movement");
  await pool.query(
    `INSERT INTO pharmacy_stock_movements (
      id, medicine_id, batch_id, movement_type, quantity_delta, balance_after, reason, performed_by
    ) VALUES ($1,$2,$3,'Adjustment',$4,$5,$6,$7)`,
    [
      `STK-${new Date().getFullYear()}-${pad(stkSeq)}`,
      batch.medicineId,
      batch.id,
      Number(input.quantityDelta),
      balanceAfter,
      input.reason.trim(),
      input.performedBy || "Pharmacist",
    ]
  );

  return mapBatch(res.rows[0]);
}

// 6. Expiry Tracking Actions (Expired / Quarantined / Disposed)
export async function updateBatchExpiryStatus(input: {
  batchId: string;
  status: "Expired" | "Quarantined" | "Disposed";
  reason: string;
  staff: string;
}) {
  if (!input.batchId || !input.reason?.trim()) {
    throw new HttpError("Batch ID and action reason are required.");
  }

  const pool = getPool();
  const curRes = await pool.query(
    "SELECT * FROM pharmacy_batches WHERE id = $1",
    [input.batchId]
  );
  if (curRes.rowCount === 0) {
    throw new HttpError(`Batch ${input.batchId} not found.`, 404);
  }
  const batch = mapBatch(curRes.rows[0]);
  const prevQty = batch.remainingQty;
  const nextQty = input.status === "Disposed" ? 0 : batch.remainingQty;

  const history: HistoryEntry[] = [
    ...batch.expiryHistory,
    {
      action: input.status,
      staff: input.staff || "Pharmacist",
      timestamp: new Date().toISOString(),
      note: input.reason.trim(),
    },
  ];

  const res = await pool.query(
    `UPDATE pharmacy_batches
     SET status = $2,
         remaining_qty = $3,
         expiry_history = $4::jsonb,
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [batch.id, input.status, nextQty, JSON.stringify(history)]
  );

  const balanceAfter = await getAvailableStockForMedicine(batch.medicineId);
  const stkSeq = await nextCounter("pharmacy_stock_movement");
  await pool.query(
    `INSERT INTO pharmacy_stock_movements (
      id, medicine_id, batch_id, movement_type, quantity_delta, balance_after, reason, performed_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      `STK-${new Date().getFullYear()}-${pad(stkSeq)}`,
      batch.medicineId,
      batch.id,
      input.status === "Disposed" ? "Disposed" : "Quarantined",
      input.status === "Disposed" ? -prevQty : 0,
      balanceAfter,
      `${input.status}: ${input.reason.trim()}`,
      input.staff || "Pharmacist",
    ]
  );

  return mapBatch(res.rows[0]);
}

// 7. Supplier Management
export async function createSupplier(input: {
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  licenseNumber?: string;
  notes?: string;
}) {
  if (
    !input.name?.trim() ||
    !input.contactPerson?.trim() ||
    !input.phone?.trim()
  ) {
    throw new HttpError(
      "Supplier name, contact person, and phone number are required."
    );
  }

  const pool = getPool();
  const dup = await pool.query(
    "SELECT id FROM pharmacy_suppliers WHERE LOWER(name) = LOWER($1)",
    [input.name.trim()]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Supplier "${input.name.trim()}" already exists.`,
      409
    );
  }

  const seq = await nextCounter("pharmacy_supplier");
  const id = `SUP-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO pharmacy_suppliers (
      id, name, contact_person, phone, email, address, license_number, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      id,
      input.name.trim(),
      input.contactPerson.trim(),
      input.phone.trim(),
      input.email?.trim() ?? "",
      input.address?.trim() ?? "",
      input.licenseNumber?.trim() ?? "",
      input.notes?.trim() ?? "",
    ]
  );

  return mapSupplier(res.rows[0]);
}

export async function updateSupplier(input: {
  supplierId: string;
  status?: "Active" | "Inactive";
  contactPerson?: string;
  phone?: string;
  email?: string;
  notes?: string;
}) {
  if (!input.supplierId) {
    throw new HttpError("supplierId is required.");
  }
  const pool = getPool();
  const res = await pool.query(
    `UPDATE pharmacy_suppliers
     SET status = COALESCE($2, status),
         contact_person = COALESCE($3, contact_person),
         phone = COALESCE($4, phone),
         email = COALESCE($5, email),
         notes = COALESCE($6, notes),
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      input.supplierId,
      input.status ?? null,
      input.contactPerson?.trim() ?? null,
      input.phone?.trim() ?? null,
      input.email?.trim() ?? null,
      input.notes?.trim() ?? null,
    ]
  );
  if (res.rowCount === 0) {
    throw new HttpError(`Supplier ${input.supplierId} not found.`, 404);
  }
  return mapSupplier(res.rows[0]);
}
