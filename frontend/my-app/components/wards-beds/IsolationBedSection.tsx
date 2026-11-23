"use client";

import React, { useMemo, useState } from "react";
import type {
  BedCleaningLog,
  BedRecord,
  WardAdmissionSummary,
} from "@/lib/wards-beds/types";
import {
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  getBedBadgeClass,
} from "./ui";

interface IsolationBedSectionProps {
  beds: BedRecord[];
  admissions: WardAdmissionSummary[];
  cleaningLogs: BedCleaningLog[];
  canManageIsolation: boolean;
  canManageCleaning: boolean;
  onAllocateIsolation: (payload: {
    bedId: string;
    admissionId: string;
    isolationReason: string;
  }) => Promise<boolean>;
  onUpdateCleaning: (payload: {
    cleaningLogId: string;
    action: "start" | "complete";
  }) => Promise<void>;
}

export function IsolationBedSection({
  beds,
  admissions,
  cleaningLogs,
  canManageIsolation,
  canManageCleaning,
  onAllocateIsolation,
  onUpdateCleaning,
}: IsolationBedSectionProps) {
  const isolationBeds = useMemo(
    () => beds.filter((b) => b.isIsolation),
    [beds]
  );
  const availableIsoBeds = useMemo(
    () =>
      isolationBeds.filter(
        (b) => b.status === "Available" && b.cleaningStatus === "Cleaned"
      ),
    [isolationBeds]
  );
  const activeAdmissions = useMemo(
    () => admissions.filter((a) => a.status !== "Discharged"),
    [admissions]
  );
  const isoCleaningLogs = useMemo(
    () => cleaningLogs.filter((l) => l.isIsolationBed),
    [cleaningLogs]
  );

  const [bedId, setBedId] = useState(availableIsoBeds[0]?.id ?? "");
  const [admissionId, setAdmissionId] = useState(activeAdmissions[0]?.id ?? "");
  const [isolationReason, setIsolationReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveBedId = availableIsoBeds.some((b) => b.id === bedId)
    ? bedId
    : (availableIsoBeds[0]?.id ?? "");
  const effectiveAdmissionId = activeAdmissions.some(
    (a) => a.id === admissionId
  )
    ? admissionId
    : (activeAdmissions[0]?.id ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canManageIsolation || !effectiveBedId || !effectiveAdmissionId) return;
    setSubmitting(true);
    try {
      const ok = await onAllocateIsolation({
        bedId: effectiveBedId,
        admissionId: effectiveAdmissionId,
        isolationReason,
      });
      if (ok) setIsolationReason("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Restricted Isolation Allocation */}
      <div className="rounded-[28px] border border-[#EF5B3A]/30 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <span className="inline-flex rounded-full bg-[#EF5B3A] px-3 py-0.5 text-[11px] font-semibold text-white">
            Restricted Access Protocol
          </span>
          <h2 className="mt-2 text-lg font-semibold text-[#14191B]">
            Allocate Dedicated Isolation Bed
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Restricted to authorized Infection Control, Ward Manager, Doctor,
            and Admin roles. Requires documented isolation reason.
          </p>
        </div>

        {!canManageIsolation ? (
          <div className="rounded-[18px] bg-white p-4 text-xs text-[#8F2710]">
            Your active role is not authorized to allocate or transfer patients
            into dedicated isolation beds.
          </div>
        ) : availableIsoBeds.length === 0 ? (
          <div className="rounded-[18px] bg-white p-4 text-xs text-[#6B7A80]">
            No cleaned isolation beds are currently available. Complete pending
            isolation sanitization first.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Available Isolation Bed *</label>
              <select
                required
                value={effectiveBedId}
                onChange={(e) => setBedId(e.target.value)}
                className={INPUT_CLASS}
              >
                {availableIsoBeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bedNumber} — {b.ward} / {b.room} ({b.isolationType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Eligible Admitted Patient *</label>
              <select
                required
                value={effectiveAdmissionId}
                onChange={(e) => setAdmissionId(e.target.value)}
                className={INPUT_CLASS}
              >
                {activeAdmissions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.patientName} ({a.diagnosis})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Isolation Reason *</label>
              <textarea
                rows={3}
                required
                value={isolationReason}
                onChange={(e) => setIsolationReason(e.target.value)}
                placeholder="e.g., Suspected airborne infection, MDR organism, immunocompromised protection"
                className={INPUT_CLASS}
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting}
                className={DANGER_BTN_CLASS}
              >
                {submitting ? "Allocating..." : "Authorize Isolation Allocation"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Isolation Inventory & Terminal Sanitization */}
      <div className="space-y-6 xl:col-span-7">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#14191B]">
                Dedicated Isolation Beds
              </h2>
              <p className="text-xs text-[#6B7A80]">
                Live status of airborne, contact, droplet, and protective
                isolation beds.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
              {isolationBeds.length} beds
            </span>
          </div>

          <div className="space-y-3">
            {isolationBeds.map((bed) => (
              <div
                key={bed.id}
                className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {bed.bedNumber}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBedBadgeClass(bed.status)}`}
                    >
                      {bed.status}
                    </span>
                    <span className="rounded-full bg-[#EF5B3A]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#A32E14]">
                      {bed.isolationType}
                    </span>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                    Cleaning: {bed.cleaningStatus}
                  </span>
                </div>
                <p className="mt-2 font-semibold text-[#14191B]">
                  {bed.ward} • {bed.room} ({bed.department})
                </p>
                {bed.currentAdmissionId && (
                  <p className="mt-1 text-[#546369]">
                    Assigned Admission: <strong>{bed.currentAdmissionId}</strong>
                    {bed.isolationReason ? ` • ${bed.isolationReason}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Isolation Bed Sanitization Queue */}
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
          <h3 className="text-base font-semibold text-[#14191B]">
            Isolation Bed Sanitization Before Reuse
          </h3>
          <p className="mt-0.5 text-xs text-[#6B7A80]">
            Isolation beds must pass terminal UV-C / sporicidal disinfection
            before becoming available.
          </p>

          <div className="mt-4 space-y-2.5">
            {isoCleaningLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col justify-between gap-3 rounded-[18px] bg-[#F8FAFA] p-3.5 text-xs sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-semibold text-[#14191B]">
                    {log.bedNumber} ({log.id}) — {log.sanitizationProtocol}
                  </p>
                  <p className="text-[#6B7A80]">
                    Status: <strong>{log.cleaningStatus}</strong> •{" "}
                    {log.notes}
                  </p>
                </div>
                {canManageCleaning && log.cleaningStatus !== "Cleaned" && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCleaning({
                        cleaningLogId: log.id,
                        action: "complete",
                      })
                    }
                    className={PRIMARY_BTN_CLASS}
                  >
                    Certify Sanitized
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
