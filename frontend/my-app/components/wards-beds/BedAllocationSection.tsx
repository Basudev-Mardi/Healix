"use client";

import React, { useMemo, useState } from "react";
import type {
  BedAllocationRecord,
  BedRecord,
  WardAdmissionSummary,
} from "@/lib/wards-beds/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getBedBadgeClass,
} from "./ui";

interface BedAllocationSectionProps {
  beds: BedRecord[];
  admissions: WardAdmissionSummary[];
  allocations: BedAllocationRecord[];
  canAllocate: boolean;
  onAllocate: (payload: {
    bedId: string;
    admissionId: string;
    isolationReason?: string;
  }) => Promise<boolean>;
}

export function BedAllocationSection({
  beds,
  admissions,
  allocations,
  canAllocate,
  onAllocate,
}: BedAllocationSectionProps) {
  const activeAdmissions = useMemo(
    () => admissions.filter((a) => a.status !== "Discharged"),
    [admissions]
  );
  const availableBeds = useMemo(
    () =>
      beds.filter(
        (b) => b.status === "Available" && b.cleaningStatus === "Cleaned"
      ),
    [beds]
  );

  const [admissionId, setAdmissionId] = useState(activeAdmissions[0]?.id ?? "");
  const [bedId, setBedId] = useState("");
  const [isolationReason, setIsolationReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveAdmissionId = activeAdmissions.some(
    (a) => a.id === admissionId
  )
    ? admissionId
    : (activeAdmissions[0]?.id ?? "");

  const selectedAdmission =
    activeAdmissions.find((a) => a.id === effectiveAdmissionId) ?? null;
  const selectedBed = beds.find((b) => b.id === bedId) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canAllocate || !effectiveAdmissionId || !bedId) return;
    setSubmitting(true);
    try {
      const ok = await onAllocate({
        bedId,
        admissionId: effectiveAdmissionId,
        isolationReason: selectedBed?.isIsolation ? isolationReason : undefined,
      });
      if (ok) {
        setBedId("");
        setIsolationReason("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Allocation Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Allocate Bed to Admitted Patient
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Only cleaned, available beds can be allocated. Reallocating a
            patient automatically queues their previous bed for cleaning.
          </p>
        </div>

        {activeAdmissions.length === 0 ? (
          <p className="rounded-[18px] bg-[#F8FAFA] p-5 text-xs text-[#738288]">
            No active IPD admissions found. Admit a patient in IPD Management
            first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Admitted Patient *</label>
              <select
                required
                disabled={!canAllocate}
                value={effectiveAdmissionId}
                onChange={(e) => setAdmissionId(e.target.value)}
                className={INPUT_CLASS}
              >
                {activeAdmissions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.patientName} ({a.patientId})
                  </option>
                ))}
              </select>
            </div>

            {selectedAdmission && (
              <div className="rounded-[18px] bg-white p-3.5 text-xs text-[#546369]">
                <p className="font-semibold text-[#14191B]">
                  {selectedAdmission.patientName} • {selectedAdmission.diagnosis}
                </p>
                <p className="mt-0.5">
                  Doctor: {selectedAdmission.admittingDoctor} • Current Bed:{" "}
                  <strong>{selectedAdmission.bedLabel}</strong>
                </p>
              </div>
            )}

            <div>
              <label className={LABEL_CLASS}>
                Available Bed * ({availableBeds.length} ready)
              </label>
              <select
                required
                disabled={!canAllocate}
                value={bedId}
                onChange={(e) => setBedId(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Select available bed</option>
                {beds.map((b) => {
                  const isReady =
                    b.status === "Available" && b.cleaningStatus === "Cleaned";
                  return (
                    <option key={b.id} value={b.id} disabled={!isReady}>
                      {b.bedNumber} — {b.ward} / {b.room} ({b.bedType}
                      {b.isIsolation ? " • ISOLATION" : ""}) [{b.status}]
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedBed?.isIsolation && (
              <div>
                <label className={LABEL_CLASS}>
                  Isolation Reason * (Required for Isolation Bed)
                </label>
                <input
                  type="text"
                  required
                  disabled={!canAllocate}
                  value={isolationReason}
                  onChange={(e) => setIsolationReason(e.target.value)}
                  placeholder="e.g., Confirmed airborne precaution / MRSA"
                  className={INPUT_CLASS}
                />
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!canAllocate || !bedId || submitting}
                className={PRIMARY_BTN_CLASS}
              >
                {submitting ? "Allocating..." : "Confirm Bed Allocation"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Allocation History */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Bed Allocation History
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Audit trail of active, transferred, and released bed allocations.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {allocations.length} records
          </span>
        </div>

        <div className="space-y-3">
          {allocations.map((alloc) => (
            <div
              key={alloc.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {alloc.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBedBadgeClass(alloc.status)}`}
                  >
                    {alloc.status}
                  </span>
                  {alloc.isIsolation && (
                    <span className="rounded-full bg-[#EF5B3A] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      Isolation
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#7A898F]">
                  {formatDateTime(alloc.allocatedAt)}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {alloc.patientName} ({alloc.patientId}) → {alloc.wardName} /{" "}
                {alloc.room} / {alloc.bedNumber}
              </p>
              <p className="text-[#6B7A80]">
                Admission {alloc.admissionId} • Allocated by {alloc.allocatedBy}
                {alloc.releasedAt
                  ? ` • Released ${formatDateTime(alloc.releasedAt)}`
                  : ""}
              </p>
              {alloc.isolationReason && (
                <p className="mt-1 text-[#A32E14]">
                  <strong>Isolation Reason:</strong> {alloc.isolationReason}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
