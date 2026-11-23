"use client";

import React, { useState } from "react";
import type { PharmacyMedicine } from "@/lib/pharmacy/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  getPharmacyBadgeClass,
} from "./ui";

interface MedicineCatalogSectionProps {
  medicines: PharmacyMedicine[];
  canManage: boolean;
  onCreateMedicine: (payload: {
    medicineCode: string;
    medicineName: string;
    genericName: string;
    brand: string;
    category: string;
    strength: string;
    dosageForm: string;
    manufacturer: string;
    unitPrice: number;
    minStockThreshold: number;
  }) => Promise<boolean>;
  onToggleActive: (medicineId: string, isActive: boolean) => Promise<void>;
}

export function MedicineCatalogSection({
  medicines,
  canManage,
  onCreateMedicine,
  onToggleActive,
}: MedicineCatalogSectionProps) {
  const [form, setForm] = useState({
    medicineCode: "",
    medicineName: "",
    genericName: "",
    brand: "",
    category: "Antibiotic",
    strength: "",
    dosageForm: "Tablet",
    manufacturer: "",
    unitPrice: "1.50",
    minStockThreshold: "25",
  });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [submitting, setSubmitting] = useState(false);

  const categories = Array.from(new Set(medicines.map((m) => m.category)));
  const filtered = medicines.filter((m) => {
    if (categoryFilter !== "All" && m.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        m.medicineName.toLowerCase().includes(q) ||
        m.medicineCode.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onCreateMedicine({
        medicineCode: form.medicineCode,
        medicineName: form.medicineName,
        genericName: form.genericName,
        brand: form.brand,
        category: form.category,
        strength: form.strength,
        dosageForm: form.dosageForm,
        manufacturer: form.manufacturer,
        unitPrice: Number(form.unitPrice) || 0,
        minStockThreshold: Number(form.minStockThreshold) || 20,
      });
      if (ok) {
        setForm({
          ...form,
          medicineCode: "",
          medicineName: "",
          genericName: "",
          brand: "",
          strength: "",
        });
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
          Add Medicine to Catalog
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Duplicate medicine codes or identical name+strength records are
          automatically prevented.
        </p>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Medicine Code *</label>
              <input
                type="text"
                required
                value={form.medicineCode}
                onChange={(e) =>
                  setForm({ ...form, medicineCode: e.target.value })
                }
                placeholder="e.g. AZIT-500"
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManage}
              >
                <option value="Antibiotic">Antibiotic</option>
                <option value="Analgesic">Analgesic</option>
                <option value="Antidiabetic">Antidiabetic</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Injectable Antibiotic">
                  Injectable Antibiotic
                </option>
                <option value="Respiratory">Respiratory</option>
                <option value="Gastrointestinal">Gastrointestinal</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Medicine Name *</label>
            <input
              type="text"
              required
              value={form.medicineName}
              onChange={(e) =>
                setForm({ ...form, medicineName: e.target.value })
              }
              placeholder="e.g. Azithromycin 500mg Tablet"
              className={INPUT_CLASS}
              disabled={!canManage}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Generic Name *</label>
              <input
                type="text"
                required
                value={form.genericName}
                onChange={(e) =>
                  setForm({ ...form, genericName: e.target.value })
                }
                placeholder="e.g. Azithromycin"
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. AzithroCare"
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Strength *</label>
              <input
                type="text"
                required
                value={form.strength}
                onChange={(e) => setForm({ ...form, strength: e.target.value })}
                placeholder="e.g. 500 mg"
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Dosage Form *</label>
              <select
                value={form.dosageForm}
                onChange={(e) =>
                  setForm({ ...form, dosageForm: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="SR Tablet">SR Tablet</option>
                <option value="Syrup">Syrup</option>
                <option value="IV Vial">IV Vial</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Ointment">Ointment</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Manufacturer *</label>
            <input
              type="text"
              required
              value={form.manufacturer}
              onChange={(e) =>
                setForm({ ...form, manufacturer: e.target.value })
              }
              placeholder="e.g. MedCore Pharma"
              className={INPUT_CLASS}
              disabled={!canManage}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.unitPrice}
                onChange={(e) =>
                  setForm({ ...form, unitPrice: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Min Stock Threshold *</label>
              <input
                type="number"
                min="0"
                required
                value={form.minStockThreshold}
                onChange={(e) =>
                  setForm({ ...form, minStockThreshold: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canManage || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Adding Medicine..." : "Add Medicine to Catalog"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#14191B]">
              Medicine Formulary ({filtered.length})
            </h3>
            <p className="text-xs text-[#6B7A80]">
              Live non-expired available stock, pricing, and active status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, name, generic..."
              className="rounded-full border border-[#DCE4E7] bg-white px-3.5 py-1.5 text-xs"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {filtered.map((med) => (
            <div
              key={med.id}
              className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {med.medicineCode}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPharmacyBadgeClass(med.isActive ? "Active" : "Inactive")}`}
                  >
                    {med.isActive ? "Active" : "Inactive"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPharmacyBadgeClass(med.stockAlert)}`}
                  >
                    {med.stockAlert} ({med.availableStock})
                  </span>
                </div>
                <span className="font-bold text-[#14191B]">
                  ${med.unitPrice.toFixed(2)} / unit
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {med.medicineName}
              </p>
              <p className="mt-0.5 text-[#546369]">
                Generic: <strong>{med.genericName}</strong> • Brand:{" "}
                {med.brand || "—"} • {med.strength} {med.dosageForm} •{" "}
                {med.manufacturer}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6EDEF] pt-2.5">
                <span className="text-[11px] text-[#6B7A80]">
                  ID: {med.id} • Min Threshold: {med.minStockThreshold} •
                  Dispensed: {med.dispensedQty}
                </span>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => onToggleActive(med.id, !med.isActive)}
                    className={SECONDARY_BTN_CLASS}
                  >
                    {med.isActive ? "Deactivate" : "Activate"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
