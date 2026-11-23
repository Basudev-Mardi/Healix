"use client";

import React, { useMemo, useState } from "react";
import type {
  BedRecord,
  BedTransferRecord,
  WardAdmissionSummary,
} from "@/lib/wards-beds/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
} from "./ui";

interface BedTransferSectionProps {
  beds: BedRecord[];
  admissions: WardAdmissionSummary[];
  transfers: BedTransferRecord[];
  canTransfer: boolean;
  onTransfer: (payload: {
    admissionId: string;
    toBedId: string;
    reason: string;
    requestingDoctor: string;
    responsibleStaff: string;
    isolationReason?: string;
  }) => Promise<boolean>;
}

export function BedTransferSection({
  beds,
  admissions,
  transfers,
  canTransfer,
  onTransfer,
}: BedTransferSectionProps) {
  const activeAdmissions = useMemo(
    () => admissions.filter((a) => a.status !== "Discharged"),
    [admissions]
  );

  const [admissionId, setAdmissionId] = useState(activeAdmissions[0]?.id ?? "");
  const [toBedId, setToBedId] = useState("");
  const [requestingDoctor, setRequestingDoctor] = useState("Dr. Rajesh Mehta");
  const [responsibleStaff, setResponsibleStaff] = useState("Ward Manager");
  const [reason, setReason] = useState("");
  const [isolationReason, setIsolationReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveAdmissionId = activeAdmissions.some(
    (a) => a.id === admissionId
  )
    ? admissionId
    : (activeAdmissions[0]?.id ?? "");

  const currentAdmission =
    activeAdmissions.find((a) => a.id === effectiveAdmissionId) ?? null;
  const targetBed = beds.find((b) => b.id === toBedId) ?? null;

  const availableDestBeds = useMemo(
    () =>
      beds.filter(
        (b) =>
          b.status === "Available" &&
          b.cleaningStatus === "Cleaned" &&
          b.id !== currentAdmission?.bedId
      ),
    [beds, currentAdmission]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canTransfer || !effectiveAdmissionId || !toBedId) return;
    setSubmitting(true);
    try {
      const ok = await onTransfer({
        admissionId: effectiveAdmissionId,
        toBedId,
        reason,
        requestingDoctor,
        responsibleStaff,
        isolationReason: targetBed?.isIsolation ? isolationReason : undefined,
      });
      if (ok) {
        setToBedId("");
        setReason("");
        setIsolationReason("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Transfer Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Transfer Patient Bed / Room / Ward
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Syncs with IPD transfer records and automatically queues the vacated
            bed for cleaning before reuse.
          </p>
        </div>

        {activeAdmissions.length === 0 ? (
          <p className="rounded-[18px] bg-[#F8FAFA] p-5 text-xs text-[#738288]">
            No active admitted patients to transfer.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Admitted Patient *</label>
              <select
                required
                disabled={!canTransfer}
                value={effectiveAdmissionId}
                onChange={(e) => {
                  setAdmissionId(e.target.value);
                  setToBedId("");
                }}
                className={INPUT_CLASS}
              >
                {activeAdmissions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.patientName} ({a.bedLabel})
                  </option>
                ))}
              </select>
            </div>

            {currentAdmission && (
              <div className="rounded-[18px] bg-white p-3.5 text-xs text-[#546369]">
                <p className="font-semibold text-[#14191B]">
                  Current Bed: {currentAdmission.bedLabel}
                </p>
                <p className="mt-0.5">
                  Department: {currentAdmission.department}
                </p>
              </div>
            )}

            <div>
              <label className={LABEL_CLASS}>
                Destination Bed * ({availableDestBeds.length} available)
              </label>
              <select
                required
                disabled={!canTransfer}
                value={toBedId}
                onChange={(e) => setToBedId(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Select destination bed</option>
                {beds.map((b) => {
                  const isReady =
                    b.status === "Available" &&
                    b.cleaningStatus === "Cleaned" &&
                    b.id !== currentAdmission?.bedId;
                  return (
                    <option key={b.id} value={b.id} disabled={!isReady}>
                      {b.bedNumber} — {b.ward} / {b.room} ({b.department}
                      {b.isIsolation ? " • ISOLATION" : ""}) [{b.status}]
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Requesting Doctor</label>
                <input
                  type="text"
                  disabled={!canTransfer}
                  value={requestingDoctor}
                  onChange={(e) => setRequestingDoctor(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Responsible Staff *</label>
                <input
                  type="text"
                  required
                  disabled={!canTransfer}
                  value={responsibleStaff}
                  onChange={(e) => setResponsibleStaff(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Transfer Reason *</label>
              <textarea
                rows={2}
                required
                disabled={!canTransfer}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Clinical reason or bed accommodation upgrade..."
                className={INPUT_CLASS}
              />
            </div>

            {targetBed?.isIsolation && (
              <div>
                <label className={LABEL_CLASS}>Isolation Reason *</label>
                <input
                  type="text"
                  required
                  disabled={!canTransfer}
                  value={isolationReason}
                  onChange={(e) => setIsolationReason(e.target.value)}
                  placeholder="Required for transfer into isolation bed"
                  className={INPUT_CLASS}
                />
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!canTransfer || !toBedId || submitting}
                className={PRIMARY_BTN_CLASS}
              >
                {submitting ? "Transferring..." : "Complete Bed Transfer"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Transfer History */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Bed Transfer History
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Synchronized directly with IPD transfer records.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {transfers.length} transfers
          </span>
        </div>

        <div className="space-y-3">
          {transfers.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No bed transfers recorded yet.
            </p>
          ) : (
            transfers.map((trf) => (
              <div
                key={trf.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {trf.id}
                    </span>
                    <span className="rounded-full bg-[#6AB4A4] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {trf.status}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                      {trf.admissionId} • {trf.patientId}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7A898F]">
                    {formatDateTime(trf.transferredAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {trf.fromWard} / {trf.fromRoom} ({trf.fromBedId}) →{" "}
                  {trf.toWard} / {trf.toRoom} ({trf.toBedId})
                </p>
                <p className="mt-0.5 text-[#4C5B61]">
                  <strong>Reason:</strong> {trf.reason}
                </p>
                <p className="mt-1 text-[11px] text-[#7D8C92]">
                  Doctor: {trf.requestingDoctor} • Responsible:{" "}
                  {trf.responsibleStaff}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
