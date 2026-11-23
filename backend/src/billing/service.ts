import type { PoolClient } from "pg";
import { getPool } from "../db/client.js";
import { HttpError } from "../opd/service.js";
import type { BillingRole } from "./permissions.js";

export type BillingCategory =
  | "OPD"
  | "IPD"
  | "Surgery"
  | "Laboratory"
  | "Pharmacy";

export type PaymentMethod =
  | "Cash"
  | "Card"
  | "UPI"
  | "Bank Transfer"
  | "Insurance";

export interface BillingLineItem {
  description: string;
  code?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ClaimHistoryEntry {
  status: string;
  staff: string;
  timestamp: string;
  note: string;
}

const VALID_CATEGORIES = new Set<BillingCategory>([
  "OPD",
  "IPD",
  "Surgery",
  "Laboratory",
  "Pharmacy",
]);

const VALID_METHODS = new Set<PaymentMethod>([
  "Cash",
  "Card",
  "UPI",
  "Bank Transfer",
  "Insurance",
]);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pad(n: number, size = 4): string {
  return String(n).padStart(size, "0");
}

async function nextCounter(
  key: string,
  client?: PoolClient
): Promise<number> {
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

async function writeAuditLog(
  entry: {
    entityType: "Invoice" | "Payment" | "Claim" | "Refund";
    entityId: string;
    action: string;
    actorRole: string;
    actorName: string;
    details: string;
  },
  client?: PoolClient
) {
  const runner = client ?? getPool();
  const seq = await nextCounter("billing_audit", client);
  const id = `AUD-${new Date().getFullYear()}-${pad(seq)}`;
  await runner.query(
    `INSERT INTO billing_audit_logs (
      id, entity_type, entity_id, action, actor_role, actor_name, details
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      id,
      entry.entityType,
      entry.entityId,
      entry.action,
      entry.actorRole,
      entry.actorName,
      entry.details,
    ]
  );
}

function mapInvoice(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    billNumber: r.bill_number as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    category: r.category as BillingCategory,
    sourceReferenceId: (r.source_reference_id as string) ?? "",
    items: (r.items as BillingLineItem[]) ?? [],
    subtotal: Number(r.subtotal),
    discountPercent: Number(r.discount_percent),
    discountAmount: Number(r.discount_amount),
    taxPercent: Number(r.tax_percent),
    taxAmount: Number(r.tax_amount),
    totalAmount: Number(r.total_amount),
    depositApplied: Number(r.deposit_applied),
    paidAmount: Number(r.paid_amount),
    refundedAmount: Number(r.refunded_amount),
    outstandingBalance: Number(r.outstanding_balance),
    status: r.status as
      | "Unpaid"
      | "Pending"
      | "Partially Paid"
      | "Paid"
      | "Overdue"
      | "Cancelled"
      | "Refunded",
    dueDate: (r.due_date as string) ?? "",
    notes: (r.notes as string) ?? "",
    createdBy: r.created_by as string,
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

function mapPayment(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    invoiceId: r.invoice_id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    amount: Number(r.amount),
    paymentType: r.payment_type as
      | "Full"
      | "Partial"
      | "Advance"
      | "Insurance Settlement",
    paymentMethod: r.payment_method as PaymentMethod,
    referenceNumber: (r.reference_number as string) ?? "",
    receivedBy: r.received_by as string,
    notes: (r.notes as string) ?? "",
    paidAt: (r.paid_at as Date).toISOString(),
  };
}

function mapProvider(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    name: r.name as string,
    tpaCode: (r.tpa_code as string) ?? "",
    contactPhone: (r.contact_phone as string) ?? "",
    contactEmail: (r.contact_email as string) ?? "",
    coverageNotes: (r.coverage_notes as string) ?? "",
    isActive: Boolean(r.is_active),
    createdAt: (r.created_at as Date).toISOString(),
  };
}

function mapClaim(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    invoiceId: r.invoice_id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    providerId: r.provider_id as string,
    providerName: r.provider_name as string,
    policyNumber: r.policy_number as string,
    coverageVerified: Boolean(r.coverage_verified),
    preAuthNumber: (r.pre_auth_number as string) ?? "",
    claimedAmount: Number(r.claimed_amount),
    approvedAmount: Number(r.approved_amount),
    settledAmount: Number(r.settled_amount),
    status: r.status as
      | "Pre-Auth Requested"
      | "Submitted"
      | "Under Review"
      | "Approved"
      | "Rejected"
      | "Settled",
    rejectionReason: (r.rejection_reason as string) ?? "",
    submittedBy: r.submitted_by as string,
    history: (r.history as ClaimHistoryEntry[]) ?? [],
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

function mapRefund(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    invoiceId: r.invoice_id as string,
    paymentId: (r.payment_id as string | null) ?? undefined,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    refundType: r.refund_type as "Full" | "Partial",
    amount: Number(r.amount),
    refundMethod: r.refund_method as Exclude<PaymentMethod, "Insurance">,
    reason: r.reason as string,
    authorizedBy: r.authorized_by as string,
    processedBy: r.processed_by as string,
    refundedAt: (r.refunded_at as Date).toISOString(),
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

export async function getBillingState() {
  const pool = getPool();
  const [
    patRes,
    invRes,
    payRes,
    provRes,
    clmRes,
    refRes,
    audRes,
    opdRes,
    ipdRes,
    otRes,
    labReqRes,
    labTestsRes,
    rxRes,
    medsRes,
  ] = await Promise.all([
    pool.query(
      "SELECT id, full_name, phone, gender FROM patients ORDER BY created_at DESC"
    ),
    pool.query("SELECT * FROM billing_invoices ORDER BY created_at DESC"),
    pool.query("SELECT * FROM billing_payments ORDER BY paid_at DESC"),
    pool.query(
      "SELECT * FROM billing_insurance_providers ORDER BY name ASC"
    ),
    pool.query(
      "SELECT * FROM billing_insurance_claims ORDER BY updated_at DESC"
    ),
    pool.query("SELECT * FROM billing_refunds ORDER BY refunded_at DESC"),
    pool.query(
      "SELECT * FROM billing_audit_logs ORDER BY created_at DESC LIMIT 80"
    ),
    pool.query(
      `SELECT a.id, a.patient_id, p.full_name AS patient_name, a.department, d.name AS doctor_name, a.appointment_date, a.status
       FROM opd_appointments a
       JOIN patients p ON p.id = a.patient_id
       LEFT JOIN opd_doctors d ON d.id = a.doctor_id
       ORDER BY a.created_at DESC LIMIT 30`
    ),
    pool.query(
      `SELECT id, patient_id, patient_name, department, ward AS ward_name, bed_label AS bed_number, admitting_doctor, status, admission_date
       FROM ipd_admissions ORDER BY admission_date DESC LIMIT 30`
    ),
    pool.query(
      `SELECT id, patient_id, patient_name, procedure_name, theatre_name, scheduled_date, status
       FROM ot_surgeries ORDER BY created_at DESC LIMIT 30`
    ),
    pool.query(
      `SELECT id, patient_id, patient_name, referring_doctor, test_ids, status, requested_at
       FROM lab_requests ORDER BY requested_at DESC LIMIT 30`
    ),
    pool.query("SELECT id, test_code, test_name, price FROM lab_tests"),
    pool.query(
      `SELECT id, patient_id, patient_name, doctor_name, items, status, prescribed_at
       FROM pharmacy_prescriptions ORDER BY prescribed_at DESC LIMIT 30`
    ),
    pool.query(
      "SELECT id, medicine_code, medicine_name, unit_price FROM pharmacy_medicines"
    ),
  ]);

  const labTestMap = new Map<
    string,
    { code: string; name: string; price: number }
  >();
  for (const t of labTestsRes.rows) {
    labTestMap.set(t.id as string, {
      code: t.test_code as string,
      name: t.test_name as string,
      price: Number(t.price),
    });
  }

  const medPriceMap = new Map<string, number>();
  for (const m of medsRes.rows) {
    medPriceMap.set(m.id as string, Number(m.unit_price));
  }

  return {
    patients: patRes.rows.map((p) => ({
      id: p.id as string,
      fullName: p.full_name as string,
      phone: (p.phone as string) ?? "",
      gender: (p.gender as string) ?? "",
    })),
    invoices: invRes.rows.map(mapInvoice),
    payments: payRes.rows.map(mapPayment),
    providers: provRes.rows.map(mapProvider),
    claims: clmRes.rows.map(mapClaim),
    refunds: refRes.rows.map(mapRefund),
    auditLogs: audRes.rows.map(mapAudit),
    sources: {
      opd: opdRes.rows.map((r) => ({
        id: r.id as string,
        patientId: r.patient_id as string,
        patientName: r.patient_name as string,
        label: `${r.id} — ${r.patient_name} (${r.department}, ${r.doctor_name ?? "OPD"})`,
        suggestedItems: [
          {
            description: `OPD Consultation (${r.department} — ${r.doctor_name ?? "Physician"})`,
            code: "OPD-CONS",
            quantity: 1,
            unitPrice: 60,
          },
        ],
      })),
      ipd: ipdRes.rows.map((r) => ({
        id: r.id as string,
        patientId: r.patient_id as string,
        patientName: r.patient_name as string,
        label: `${r.id} — ${r.patient_name} (${r.ward_name} / Bed ${r.bed_number})`,
        suggestedItems: [
          {
            description: `IPD Admission & Nursing Care (${r.ward_name})`,
            code: "IPD-ADM",
            quantity: 1,
            unitPrice: 150,
          },
          {
            description: `Ward / Bed Daily Charge (Bed ${r.bed_number})`,
            code: "IPD-BED",
            quantity: 3,
            unitPrice: 120,
          },
          {
            description: "Inpatient Treatment & Medication Administration",
            code: "IPD-TRT",
            quantity: 1,
            unitPrice: 220,
          },
        ],
      })),
      surgery: otRes.rows.map((r) => ({
        id: r.id as string,
        patientId: r.patient_id as string,
        patientName: r.patient_name as string,
        label: `${r.id} — ${r.patient_name} (${r.procedure_name})`,
        suggestedItems: [
          {
            description: `Surgical Procedure — ${r.procedure_name}`,
            code: "SRG-PROC",
            quantity: 1,
            unitPrice: 1100,
          },
          {
            description: `Operation Theatre Charges (${r.theatre_name})`,
            code: "OT-SUITE",
            quantity: 1,
            unitPrice: 400,
          },
          {
            description: "Anesthesia & Monitoring Charges",
            code: "OT-ANES",
            quantity: 1,
            unitPrice: 320,
          },
          {
            description: "Surgical Equipment & Consumables",
            code: "OT-CONS",
            quantity: 1,
            unitPrice: 240,
          },
        ],
      })),
      laboratory: labReqRes.rows.map((r) => {
        const testIds = (r.test_ids as string[]) ?? [];
        const suggestedItems = testIds.map((tid) => {
          const t = labTestMap.get(tid);
          return {
            description: t ? t.name : `Lab Test ${tid}`,
            code: t ? t.code : tid,
            quantity: 1,
            unitPrice: t ? t.price : 30,
          };
        });
        return {
          id: r.id as string,
          patientId: r.patient_id as string,
          patientName: r.patient_name as string,
          label: `${r.id} — ${r.patient_name} (${testIds.length} test(s), ${r.status})`,
          suggestedItems,
        };
      }),
      pharmacy: rxRes.rows.map((r) => {
        const items =
          (r.items as {
            medicineId: string;
            medicineCode: string;
            medicineName: string;
            prescribedQty: number;
          }[]) ?? [];
        const suggestedItems = items.map((it) => ({
          description: it.medicineName,
          code: it.medicineCode,
          quantity: Number(it.prescribedQty) || 1,
          unitPrice: medPriceMap.get(it.medicineId) ?? 1.5,
        }));
        return {
          id: r.id as string,
          patientId: r.patient_id as string,
          patientName: r.patient_name as string,
          label: `${r.id} — ${r.patient_name} (${items.length} medicine(s), ${r.status})`,
          suggestedItems,
        };
      }),
    },
  };
}

// 1-5 & 8. Create Invoice / Bill (Atomic, server-side calculations, duplicate prevention)
export async function createInvoice(input: {
  patientId: string;
  category: BillingCategory;
  sourceReferenceId?: string;
  items: {
    description: string;
    code?: string;
    quantity: number;
    unitPrice: number;
  }[];
  discountPercent?: number;
  taxPercent?: number;
  depositApplied?: number;
  dueDate?: string;
  notes?: string;
  createdBy: string;
  actorRole: BillingRole;
}) {
  if (
    !input.patientId ||
    !VALID_CATEGORIES.has(input.category) ||
    !Array.isArray(input.items) ||
    input.items.length === 0
  ) {
    throw new HttpError(
      "Patient, valid billing category, and at least one billable item are required."
    );
  }

  const normalizedItems: BillingLineItem[] = input.items.map((it) => {
    const qty = Number(it.quantity);
    const price = Number(it.unitPrice);
    if (!it.description?.trim() || qty <= 0 || price < 0) {
      throw new HttpError(
        "Each billing line item requires a description, positive quantity, and non-negative unit price."
      );
    }
    return {
      description: it.description.trim(),
      code: it.code?.trim() ?? "",
      quantity: qty,
      unitPrice: round2(price),
      lineTotal: round2(qty * price),
    };
  });

  const discountPercent = Math.min(
    100,
    Math.max(0, Number(input.discountPercent ?? 0))
  );
  const taxPercent = Math.min(50, Math.max(0, Number(input.taxPercent ?? 5)));
  const subtotal = round2(
    normalizedItems.reduce((sum, i) => sum + i.lineTotal, 0)
  );
  const discountAmount = round2((subtotal * discountPercent) / 100);
  const taxable = Math.max(0, round2(subtotal - discountAmount));
  const taxAmount = round2((taxable * taxPercent) / 100);
  const totalAmount = round2(taxable + taxAmount);
  const depositApplied = Math.min(
    totalAmount,
    Math.max(0, round2(Number(input.depositApplied ?? 0)))
  );
  const outstandingBalance = round2(totalAmount - depositApplied);
  const initialStatus =
    outstandingBalance <= 0
      ? "Paid"
      : depositApplied > 0
        ? "Partially Paid"
        : "Unpaid";

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const patRes = await client.query(
      "SELECT id, full_name FROM patients WHERE id = $1",
      [input.patientId]
    );
    if (patRes.rowCount === 0) {
      throw new HttpError(`Patient ${input.patientId} not found.`, 404);
    }

    const srcRef = input.sourceReferenceId?.trim() ?? "";
    if (srcRef) {
      const dup = await client.query(
        `SELECT id, bill_number FROM billing_invoices
         WHERE category = $1 AND source_reference_id = $2 AND status <> 'Cancelled'`,
        [input.category, srcRef]
      );
      if ((dup.rowCount ?? 0) > 0) {
        throw new HttpError(
          `Duplicate invoice prevented: ${dup.rows[0].id} (${dup.rows[0].bill_number}) already exists for ${input.category} reference ${srcRef}.`,
          409
        );
      }
    }

    const seq = await nextCounter("billing_invoice", client);
    const year = new Date().getFullYear();
    const id = `INV-${year}-${pad(seq)}`;
    const billNumber = `BILL-${year}-${pad(seq)}`;
    const dueDate =
      input.dueDate?.trim() ||
      new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const invRes = await client.query(
      `INSERT INTO billing_invoices (
        id, bill_number, patient_id, patient_name, category, source_reference_id,
        items, subtotal, discount_percent, discount_amount, tax_percent, tax_amount,
        total_amount, deposit_applied, paid_amount, refunded_amount, outstanding_balance,
        status, due_date, notes, created_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$14,0,$15,$16,$17,$18,$19
      ) RETURNING *`,
      [
        id,
        billNumber,
        patRes.rows[0].id,
        patRes.rows[0].full_name,
        input.category,
        srcRef,
        JSON.stringify(normalizedItems),
        subtotal,
        discountPercent,
        discountAmount,
        taxPercent,
        taxAmount,
        totalAmount,
        depositApplied,
        outstandingBalance,
        initialStatus,
        dueDate,
        input.notes?.trim() ?? "",
        input.createdBy || input.actorRole,
      ]
    );

    if (depositApplied > 0) {
      const paySeq = await nextCounter("billing_payment", client);
      await client.query(
        `INSERT INTO billing_payments (
          id, invoice_id, patient_id, patient_name, amount, payment_type,
          payment_method, reference_number, received_by, notes
        ) VALUES ($1,$2,$3,$4,$5,'Advance','Cash',$6,$7,'Deposit applied at invoice creation')`,
        [
          `PAY-${year}-${pad(paySeq)}`,
          id,
          patRes.rows[0].id,
          patRes.rows[0].full_name,
          depositApplied,
          `DEP-${id}`,
          input.createdBy || input.actorRole,
        ]
      );
    }

    await writeAuditLog(
      {
        entityType: "Invoice",
        entityId: id,
        action: "Created",
        actorRole: input.actorRole,
        actorName: input.createdBy || input.actorRole,
        details: `${input.category} invoice ${billNumber} created for $${totalAmount.toFixed(2)} (ref: ${srcRef || "Direct"})`,
      },
      client
    );

    await client.query("COMMIT");
    return mapInvoice(invRes.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function cancelInvoice(input: {
  invoiceId: string;
  reason: string;
  actorRole: BillingRole;
  actorName: string;
}) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const curRes = await client.query(
      "SELECT * FROM billing_invoices WHERE id = $1 FOR UPDATE",
      [input.invoiceId]
    );
    if (curRes.rowCount === 0) {
      throw new HttpError(`Invoice ${input.invoiceId} not found.`, 404);
    }
    const inv = mapInvoice(curRes.rows[0]);
    if (inv.paidAmount - inv.refundedAmount > 0) {
      throw new HttpError(
        `Cannot cancel invoice ${inv.id}: net collected amount is $${(inv.paidAmount - inv.refundedAmount).toFixed(2)}. Process a refund first.`,
        409
      );
    }
    const upd = await client.query(
      `UPDATE billing_invoices
       SET status = 'Cancelled',
           outstanding_balance = 0,
           notes = CASE WHEN notes = '' THEN $2 ELSE notes || ' | Cancelled: ' || $2 END,
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [inv.id, input.reason?.trim() || "Cancelled by authorized staff"]
    );
    await writeAuditLog(
      {
        entityType: "Invoice",
        entityId: inv.id,
        action: "Cancelled",
        actorRole: input.actorRole,
        actorName: input.actorName,
        details: input.reason?.trim() || "Invoice cancelled",
      },
      client
    );
    await client.query("COMMIT");
    return mapInvoice(upd.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Atomic Payment Collection (Full, Partial, Advance, Insurance Settlement)
export async function collectPayment(input: {
  invoiceId: string;
  amount: number;
  paymentType?: "Full" | "Partial" | "Advance" | "Insurance Settlement";
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  receivedBy: string;
  notes?: string;
  actorRole: BillingRole;
}) {
  const amount = round2(Number(input.amount));
  if (!input.invoiceId || amount <= 0 || !VALID_METHODS.has(input.paymentMethod)) {
    throw new HttpError(
      "Invoice, positive payment amount, and valid payment method are required."
    );
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const invRes = await client.query(
      "SELECT * FROM billing_invoices WHERE id = $1 FOR UPDATE",
      [input.invoiceId]
    );
    if (invRes.rowCount === 0) {
      throw new HttpError(`Invoice ${input.invoiceId} not found.`, 404);
    }
    const inv = mapInvoice(invRes.rows[0]);
    if (inv.status === "Cancelled" || inv.status === "Refunded") {
      throw new HttpError(
        `Cannot collect payment for a ${inv.status} invoice.`,
        409
      );
    }
    if (inv.outstandingBalance <= 0) {
      throw new HttpError(
        `Duplicate payment prevented: invoice ${inv.id} is already Paid in full.`,
        409
      );
    }
    if (amount > inv.outstandingBalance + 0.01) {
      throw new HttpError(
        `Payment amount ($${amount.toFixed(2)}) exceeds outstanding balance ($${inv.outstandingBalance.toFixed(2)}).`,
        400
      );
    }

    const refNum = input.referenceNumber?.trim() ?? "";
    if (refNum) {
      const dupRef = await client.query(
        `SELECT id FROM billing_payments
         WHERE invoice_id = $1 AND LOWER(reference_number) = LOWER($2)`,
        [inv.id, refNum]
      );
      if ((dupRef.rowCount ?? 0) > 0) {
        throw new HttpError(
          `Duplicate payment reference "${refNum}" already recorded on ${inv.id}.`,
          409
        );
      }
    }

    const paySeq = await nextCounter("billing_payment", client);
    const payId = `PAY-${new Date().getFullYear()}-${pad(paySeq)}`;
    const payType =
      input.paymentType ??
      (amount >= inv.outstandingBalance - 0.01 ? "Full" : "Partial");

    const payRes = await client.query(
      `INSERT INTO billing_payments (
        id, invoice_id, patient_id, patient_name, amount, payment_type,
        payment_method, reference_number, received_by, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        payId,
        inv.id,
        inv.patientId,
        inv.patientName,
        amount,
        payType,
        input.paymentMethod,
        refNum,
        input.receivedBy || input.actorRole,
        input.notes?.trim() ?? "",
      ]
    );

    const newPaid = round2(inv.paidAmount + amount);
    const newOutstanding = Math.max(
      0,
      round2(inv.totalAmount - (newPaid - inv.refundedAmount))
    );
    const nextStatus = newOutstanding <= 0.01 ? "Paid" : "Partially Paid";

    await client.query(
      `UPDATE billing_invoices
       SET paid_amount = $2,
           outstanding_balance = $3,
           status = $4,
           updated_at = NOW()
       WHERE id = $1`,
      [inv.id, newPaid, newOutstanding, nextStatus]
    );

    await writeAuditLog(
      {
        entityType: "Payment",
        entityId: payId,
        action: "Collected",
        actorRole: input.actorRole,
        actorName: input.receivedBy || input.actorRole,
        details: `Collected $${amount.toFixed(2)} (${payType} via ${input.paymentMethod}) for ${inv.id}. New status: ${nextStatus}`,
      },
      client
    );

    await client.query("COMMIT");
    return mapPayment(payRes.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// 6. Insurance Providers & Claims
export async function createInsuranceProvider(input: {
  name: string;
  tpaCode?: string;
  contactPhone?: string;
  contactEmail?: string;
  coverageNotes?: string;
}) {
  if (!input.name?.trim()) {
    throw new HttpError("Insurance provider name is required.");
  }
  const pool = getPool();
  const dup = await pool.query(
    "SELECT id FROM billing_insurance_providers WHERE LOWER(name) = LOWER($1)",
    [input.name.trim()]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Insurance provider "${input.name.trim()}" already exists.`,
      409
    );
  }
  const seq = await nextCounter("billing_provider");
  const id = `INS-${new Date().getFullYear()}-${pad(seq)}`;
  const res = await pool.query(
    `INSERT INTO billing_insurance_providers (
      id, name, tpa_code, contact_phone, contact_email, coverage_notes
    ) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      id,
      input.name.trim(),
      input.tpaCode?.trim() ?? "",
      input.contactPhone?.trim() ?? "",
      input.contactEmail?.trim() ?? "",
      input.coverageNotes?.trim() ?? "",
    ]
  );
  return mapProvider(res.rows[0]);
}

export async function createInsuranceClaim(input: {
  invoiceId: string;
  providerId: string;
  policyNumber: string;
  coverageVerified?: boolean;
  preAuthNumber?: string;
  claimedAmount: number;
  submittedBy: string;
  actorRole: BillingRole;
}) {
  const claimedAmount = round2(Number(input.claimedAmount));
  if (
    !input.invoiceId ||
    !input.providerId ||
    !input.policyNumber?.trim() ||
    claimedAmount <= 0
  ) {
    throw new HttpError(
      "Invoice, insurance provider, policy number, and positive claimed amount are required."
    );
  }

  const pool = getPool();
  const [invRes, provRes] = await Promise.all([
    pool.query("SELECT * FROM billing_invoices WHERE id = $1", [
      input.invoiceId,
    ]),
    pool.query("SELECT * FROM billing_insurance_providers WHERE id = $1", [
      input.providerId,
    ]),
  ]);

  if (invRes.rowCount === 0) {
    throw new HttpError(`Invoice ${input.invoiceId} not found.`, 404);
  }
  if (provRes.rowCount === 0) {
    throw new HttpError(`Provider ${input.providerId} not found.`, 404);
  }

  const inv = mapInvoice(invRes.rows[0]);
  const prov = mapProvider(provRes.rows[0]);
  if (claimedAmount > inv.totalAmount) {
    throw new HttpError(
      `Claimed amount ($${claimedAmount.toFixed(2)}) cannot exceed invoice total ($${inv.totalAmount.toFixed(2)}).`,
      400
    );
  }

  const seq = await nextCounter("billing_claim");
  const id = `CLM-${new Date().getFullYear()}-${pad(seq)}`;
  const initialStatus = input.preAuthNumber?.trim()
    ? "Submitted"
    : "Pre-Auth Requested";
  const history: ClaimHistoryEntry[] = [
    {
      status: initialStatus,
      staff: input.submittedBy || input.actorRole,
      timestamp: new Date().toISOString(),
      note: `Claim created for policy ${input.policyNumber.trim()} ($${claimedAmount.toFixed(2)})`,
    },
  ];

  const res = await pool.query(
    `INSERT INTO billing_insurance_claims (
      id, invoice_id, patient_id, patient_name, provider_id, provider_name,
      policy_number, coverage_verified, pre_auth_number, claimed_amount,
      status, submitted_by, history
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb) RETURNING *`,
    [
      id,
      inv.id,
      inv.patientId,
      inv.patientName,
      prov.id,
      prov.name,
      input.policyNumber.trim(),
      Boolean(input.coverageVerified),
      input.preAuthNumber?.trim() ?? "",
      claimedAmount,
      initialStatus,
      input.submittedBy || input.actorRole,
      JSON.stringify(history),
    ]
  );

  await writeAuditLog({
    entityType: "Claim",
    entityId: id,
    action: "Submitted",
    actorRole: input.actorRole,
    actorName: input.submittedBy || input.actorRole,
    details: `Submitted claim for ${inv.id} via ${prov.name} ($${claimedAmount.toFixed(2)})`,
  });

  return mapClaim(res.rows[0]);
}

export async function updateInsuranceClaim(input: {
  claimId: string;
  status: "Submitted" | "Under Review" | "Approved" | "Rejected" | "Settled";
  approvedAmount?: number;
  settledAmount?: number;
  preAuthNumber?: string;
  coverageVerified?: boolean;
  rejectionReason?: string;
  staff: string;
  actorRole: BillingRole;
}) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const curRes = await client.query(
      "SELECT * FROM billing_insurance_claims WHERE id = $1 FOR UPDATE",
      [input.claimId]
    );
    if (curRes.rowCount === 0) {
      throw new HttpError(`Claim ${input.claimId} not found.`, 404);
    }
    const claim = mapClaim(curRes.rows[0]);
    if (claim.status === "Settled") {
      throw new HttpError(
        `Claim ${claim.id} is already Settled and cannot be modified.`,
        409
      );
    }
    if (input.status === "Rejected" && !input.rejectionReason?.trim()) {
      throw new HttpError(
        "Rejection reason is required when rejecting an insurance claim."
      );
    }

    const approvedAmt =
      input.approvedAmount !== undefined
        ? round2(Number(input.approvedAmount))
        : input.status === "Approved" && claim.approvedAmount === 0
          ? claim.claimedAmount
          : claim.approvedAmount;

    const settledAmt =
      input.status === "Settled"
        ? round2(
            Number(
              input.settledAmount ?? (approvedAmt > 0 ? approvedAmt : claim.claimedAmount)
            )
          )
        : claim.settledAmount;

    const history: ClaimHistoryEntry[] = [
      ...claim.history,
      {
        status: input.status,
        staff: input.staff || input.actorRole,
        timestamp: new Date().toISOString(),
        note:
          input.status === "Rejected"
            ? `Rejected: ${input.rejectionReason?.trim()}`
            : input.status === "Settled"
              ? `Settled $${settledAmt.toFixed(2)} onto invoice ${claim.invoiceId}`
              : `Moved to ${input.status}${approvedAmt > 0 ? ` (Approved $${approvedAmt.toFixed(2)})` : ""}`,
      },
    ];

    const upd = await client.query(
      `UPDATE billing_insurance_claims
       SET status = $2,
           approved_amount = $3,
           settled_amount = $4,
           pre_auth_number = COALESCE(NULLIF($5,''), pre_auth_number),
           coverage_verified = COALESCE($6, coverage_verified),
           rejection_reason = CASE WHEN $2 = 'Rejected' THEN $7 ELSE rejection_reason END,
           history = $8::jsonb,
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        claim.id,
        input.status,
        approvedAmt,
        settledAmt,
        input.preAuthNumber?.trim() ?? "",
        input.coverageVerified !== undefined ? input.coverageVerified : null,
        input.rejectionReason?.trim() ?? "",
        JSON.stringify(history),
      ]
    );

    // On Settlement, atomically apply Insurance Settlement payment to the linked invoice!
    if (input.status === "Settled" && settledAmt > 0) {
      const invRes = await client.query(
        "SELECT * FROM billing_invoices WHERE id = $1 FOR UPDATE",
        [claim.invoiceId]
      );
      if ((invRes.rowCount ?? 0) > 0) {
        const inv = mapInvoice(invRes.rows[0]);
        const applyAmt = Math.min(settledAmt, inv.outstandingBalance);
        if (applyAmt > 0) {
          const paySeq = await nextCounter("billing_payment", client);
          const payId = `PAY-${new Date().getFullYear()}-${pad(paySeq)}`;
          await client.query(
            `INSERT INTO billing_payments (
              id, invoice_id, patient_id, patient_name, amount, payment_type,
              payment_method, reference_number, received_by, notes
            ) VALUES ($1,$2,$3,$4,$5,'Insurance Settlement','Insurance',$6,$7,$8)`,
            [
              payId,
              inv.id,
              inv.patientId,
              inv.patientName,
              applyAmt,
              claim.id,
              input.staff || input.actorRole,
              `Settled via ${claim.providerName} (${claim.policyNumber})`,
            ]
          );
          const newPaid = round2(inv.paidAmount + applyAmt);
          const newOut = Math.max(
            0,
            round2(inv.totalAmount - (newPaid - inv.refundedAmount))
          );
          await client.query(
            `UPDATE billing_invoices
             SET paid_amount = $2,
                 outstanding_balance = $3,
                 status = $4,
                 updated_at = NOW()
             WHERE id = $1`,
            [inv.id, newPaid, newOut, newOut <= 0.01 ? "Paid" : "Partially Paid"]
          );
        }
      }
    }

    await writeAuditLog(
      {
        entityType: "Claim",
        entityId: claim.id,
        action: input.status,
        actorRole: input.actorRole,
        actorName: input.staff || input.actorRole,
        details: `Claim ${claim.id} updated to ${input.status}`,
      },
      client
    );

    await client.query("COMMIT");
    return mapClaim(upd.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// 7. Atomic Refunds (Full & Partial, authorized only, never overwrites original payment)
export async function processRefund(input: {
  invoiceId: string;
  paymentId?: string;
  refundType: "Full" | "Partial";
  amount: number;
  refundMethod: Exclude<PaymentMethod, "Insurance">;
  reason: string;
  authorizedBy: string;
  processedBy: string;
  actorRole: BillingRole;
}) {
  const amount = round2(Number(input.amount));
  if (!input.invoiceId || amount <= 0 || !input.reason?.trim()) {
    throw new HttpError(
      "Invoice, positive refund amount, and refund reason are required."
    );
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const invRes = await client.query(
      "SELECT * FROM billing_invoices WHERE id = $1 FOR UPDATE",
      [input.invoiceId]
    );
    if (invRes.rowCount === 0) {
      throw new HttpError(`Invoice ${input.invoiceId} not found.`, 404);
    }
    const inv = mapInvoice(invRes.rows[0]);
    const netCollected = round2(inv.paidAmount - inv.refundedAmount);
    if (netCollected <= 0) {
      throw new HttpError(
        `No refundable collected balance remaining on invoice ${inv.id}.`,
        409
      );
    }

    const finalRefundAmount =
      input.refundType === "Full" ? netCollected : amount;
    if (finalRefundAmount > netCollected + 0.01) {
      throw new HttpError(
        `Refund amount ($${finalRefundAmount.toFixed(2)}) exceeds net collected amount ($${netCollected.toFixed(2)}).`,
        400
      );
    }

    const refSeq = await nextCounter("billing_refund", client);
    const refId = `REF-${new Date().getFullYear()}-${pad(refSeq)}`;

    const refRes = await client.query(
      `INSERT INTO billing_refunds (
        id, invoice_id, payment_id, patient_id, patient_name, refund_type,
        amount, refund_method, reason, authorized_by, processed_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        refId,
        inv.id,
        input.paymentId || null,
        inv.patientId,
        inv.patientName,
        input.refundType,
        finalRefundAmount,
        input.refundMethod,
        input.reason.trim(),
        input.authorizedBy || input.actorRole,
        input.processedBy || input.actorRole,
      ]
    );

    const newRefunded = round2(inv.refundedAmount + finalRefundAmount);
    const remainingNetPaid = Math.max(0, round2(inv.paidAmount - newRefunded));
    const newStatus =
      remainingNetPaid <= 0.01
        ? "Refunded"
        : remainingNetPaid < inv.totalAmount
          ? "Partially Paid"
          : inv.status;
    const newOutstanding =
      newStatus === "Refunded"
        ? 0
        : Math.max(0, round2(inv.totalAmount - remainingNetPaid));

    await client.query(
      `UPDATE billing_invoices
       SET refunded_amount = $2,
           outstanding_balance = $3,
           status = $4,
           updated_at = NOW()
       WHERE id = $1`,
      [inv.id, newRefunded, newOutstanding, newStatus]
    );

    await writeAuditLog(
      {
        entityType: "Refund",
        entityId: refId,
        action: `${input.refundType} Refund`,
        actorRole: input.actorRole,
        actorName: input.authorizedBy || input.actorRole,
        details: `Refunded $${finalRefundAmount.toFixed(2)} via ${input.refundMethod} for ${inv.id}. Reason: ${input.reason.trim()}`,
      },
      client
    );

    await client.query("COMMIT");
    return mapRefund(refRes.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
