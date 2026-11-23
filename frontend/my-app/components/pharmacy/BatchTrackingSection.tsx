"use client";

import React, { useState } from "react";
import type {
  PharmacyBatch,
  PharmacyMedicine,
  PharmacySupplier,
} from "@/lib/pharmacy/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  getPharmacyBadgeClass,
} from "./ui";

interface BatchTrackingSectionProps {
  medicines: PharmacyMedicine[];
  suppliers: PharmacySupplier[];
  batches: PharmacyBatch[];
  canManageBatch: boolean;
  onCreateBatch: (payload: {
    medicineId: string;
    supplierId: string;
    batchNumber: string;
    manufacturer: string;
    quantity: number;
    purchaseDate: string;
    manufacturingDate: string;
    expiryDate: string;
    unitCost: number;
  }) => Promise<boolean>;
}

export function BatchTrackingSection({
  medicines,
  suppliers,
  batches,
  canManageBatch,
  onCreateBatch,
}: BatchTrackingSectionProps) {
  const medById = new Map(medicines.map((m) => [m.id, m]));
  const supById = new Map(suppliers.map((s) => [s.id, s]));

  const [form, setForm] = useState({
    medicineId: medicines[0]?.id ?? "",
    supplierId: suppliers[0]?.id ?? "",
    batchNumber: "",
    manufacturer: "MedCore Pharma",
    quantity: "100",
    purchaseDate: new Date().toISOString().slice(0, 10),
    manufacturingDate: new Date().toISOString().slice(0, 10),
    expiryDate: "2028-06-30",
    unitCost: "0.90",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onCreateBatch({
        medicineId: form.medicineId || medicines[0]?.id || "",
        supplierId: form.supplierId || suppliers[0]?.id || "",
        batchNumber: form.batchNumber,
        manufacturer: form.manufacturer,
        quantity: Number(form.quantity) || 1,
        purchaseDate: form.purchaseDate,
        manufacturingDate: form.manufacturingDate,
        expiryDate: form.expiryDate,
        unitCost: Number(form.unitCost) || 0,
      });
      if (ok) {
        setForm({ ...form, batchNumber: "" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
      >
        <h2 className="text-lg font-semibold text-[#14191B]">
          Receive New Medicine Batch
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Links supplier purchase to batch inventory and automatically updates
          FEFO dispensing stock.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Medicine *</label>
            <select
              value={form.medicineId || medicines[0]?.id || ""}
              onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
              className={INPUT_CLASS}
              disabled={!canManageBatch}
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.medicineCode} — {m.medicineName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Batch Number *</label>
              <input
                type="text"
                required
                value={form.batchNumber}
                onChange={(e) =>
                  setForm({ ...form, batchNumber: e.target.value })
                }
                placeholder="e.g. AMX-26D"
                className={INPUT_CLASS}
                disabled={!canManageBatch}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Supplier *</label>
              <select
                value={form.supplierId || suppliers[0]?.id || ""}
                onChange={(e) =>
                  setForm({ ...form, supplierId: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManageBatch}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className={LABEL_CLASS}>Manufacturer *</label>
              <input
                type="text"
                required
                value={form.manufacturer}
                onChange={(e) =>
                  setForm({ ...form, manufacturer: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManageBatch}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManageBatch}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.unitCost}
                onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManageBatch}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className={LABEL_CLASS}>Purchase Date *</label>
              <input
                type="date"
                required
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm({ ...form, purchaseDate: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManageBatch}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Mfg Date *</label>
              <input
                type="date"
                required
                value={form.manufacturingDate}
                onChange={(e) =>
                  setForm({ ...form, manufacturingDate: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManageBatch}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Expiry Date *</label>
              <input
                type="date"
                required
                value={form.expiryDate}
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManageBatch}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canManageBatch || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Receiving Batch..." : "Receive Batch into Inventory"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Batch Inventory — Ordered by FEFO ({batches.length})
        </h3>
        <div className="mt-4 space-y-2.5">
          {batches.map((b) => {
            const med = medById.get(b.medicineId);
            const sup = b.supplierId ? supById.get(b.supplierId) : undefined;
            return (
              <div
                key={b.id}
                className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {b.batchNumber}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPharmacyBadgeClass(b.status)}`}
                    >
                      {b.status}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#47565C]">
                      {b.id}
                    </span>
                  </div>
                  <span className="font-bold text-[#14191B]">
                    {b.remainingQty} / {b.initialQty} units
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {med?.medicineName ?? b.medicineId} ({med?.medicineCode})
                </p>
                <p className="mt-0.5 text-[#546369]">
                  Mfg: {b.manufacturingDate} •{" "}
                  <strong>Exp: {b.expiryDate}</strong> • Purchased:{" "}
                  {b.purchaseDate} • Supplier: {sup?.name ?? "Direct"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
