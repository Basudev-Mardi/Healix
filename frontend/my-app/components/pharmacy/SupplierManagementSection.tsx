"use client";

import React, { useState } from "react";
import type { PharmacyBatch, PharmacySupplier } from "@/lib/pharmacy/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  getPharmacyBadgeClass,
} from "./ui";

interface SupplierManagementSectionProps {
  suppliers: PharmacySupplier[];
  batches: PharmacyBatch[];
  canManage: boolean;
  onCreateSupplier: (payload: {
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    licenseNumber: string;
    notes: string;
  }) => Promise<boolean>;
  onToggleSupplierStatus: (
    supplierId: string,
    status: "Active" | "Inactive"
  ) => Promise<void>;
}

export function SupplierManagementSection({
  suppliers,
  batches,
  canManage,
  onCreateSupplier,
  onToggleSupplierStatus,
}: SupplierManagementSectionProps) {
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    licenseNumber: "",
    notes: "",
  });
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = suppliers.filter((s) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q)
    );
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onCreateSupplier(form);
      if (ok) {
        setForm({
          name: "",
          contactPerson: "",
          phone: "",
          email: "",
          address: "",
          licenseNumber: "",
          notes: "",
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
          Add Pharmaceutical Supplier
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Register licensed vendors and link them to medicine batches and
          purchase history.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Supplier Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. GlobalMed Distributors"
              className={INPUT_CLASS}
              disabled={!canManage}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Contact Person *</label>
              <input
                type="text"
                required
                value={form.contactPerson}
                onChange={(e) =>
                  setForm({ ...form, contactPerson: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Phone *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Drug License No.</label>
              <input
                type="text"
                value={form.licenseNumber}
                onChange={(e) =>
                  setForm({ ...form, licenseNumber: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={INPUT_CLASS}
              disabled={!canManage}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Supply Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={INPUT_CLASS}
              disabled={!canManage}
            />
          </div>

          <button
            type="submit"
            disabled={!canManage || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Adding Supplier..." : "Register Supplier"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold text-[#14191B]">
            Registered Suppliers ({filtered.length})
          </h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier or contact..."
            className="rounded-full border border-[#DCE4E7] bg-white px-3.5 py-1.5 text-xs"
          />
        </div>

        <div className="mt-4 space-y-3">
          {filtered.map((sup) => {
            const suppliedBatches = batches.filter(
              (b) => b.supplierId === sup.id
            );
            return (
              <div
                key={sup.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {sup.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPharmacyBadgeClass(sup.status)}`}
                    >
                      {sup.status}
                    </span>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() =>
                        onToggleSupplierStatus(
                          sup.id,
                          sup.status === "Active" ? "Inactive" : "Active"
                        )
                      }
                      className={SECONDARY_BTN_CLASS}
                    >
                      {sup.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </div>

                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {sup.name}
                </p>
                <p className="mt-0.5 text-[#546369]">
                  Contact: <strong>{sup.contactPerson}</strong> • {sup.phone}{" "}
                  {sup.email ? `• ${sup.email}` : ""}
                </p>
                {sup.address && (
                  <p className="mt-0.5 text-[#6B7A80]">
                    {sup.address}{" "}
                    {sup.licenseNumber ? `• License: ${sup.licenseNumber}` : ""}
                  </p>
                )}
                <p className="mt-2 font-medium text-[#4A90A4]">
                  Supplied Batches: {suppliedBatches.length} (
                  {suppliedBatches
                    .slice(0, 4)
                    .map((b) => b.batchNumber)
                    .join(", ") || "None yet"}
                  )
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
