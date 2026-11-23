"use client";

import React, { useMemo, useState } from "react";
import type {
  IpdAdmission,
  IpdBed,
  IpdDoctor,
  IpdTransfer,
} from "@/lib/ipd/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
} from "./ui";

interface PatientTransfersSectionProps {
  admissions: IpdAdmission[];
  beds: IpdBed[];
  doctors: IpdDoctor[];
  transfers: IpdTransfer[];
  preselectedAdmissionId?: string;
  canWrite: boolean;
  onCreateTransfer: (payload: {
    admissionId: string;
    toBedId: string;
    reason: string;
    requestingDoctor: string;
    responsibleStaff: string;
  }) => Promise<boolean>;
}

export function PatientTransfersSection({
  admissions,
  beds,
  doctors,
  transfers,
  preselectedAdmissionId,
  canWrite,
  onCreateTransfer,
}: PatientTransfersSectionProps) {
  const activeAdmissions = useMemo(
    () => admissions.filter((a) => a.status !== "Discharged"),
    [admissions]
  );

  const [admissionId, setAdmissionId] = useState(
    preselectedAdmissionId || activeAdmissions[0]?.id || ""
  );
  const [toBedId, setToBedId] = useState("");
  const [requestingDoctor, setRequestingDoctor] = useState(
    doctors[0]?.name ?? "Dr. Rajesh Mehta"
  );
  const [responsibleStaff, setResponsibleStaff] = useState("Ward Charge Nurse");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveAdmissionId =
    preselectedAdmissionId &&
    activeAdmissions.some((a) => a.id === preselectedAdmissionId)
      ? preselectedAdmissionId
      : activeAdmissions.some((a) => a.id === admissionId)
        ? admissionId
        : (activeAdmissions[0]?.id ?? "");

  const currentAdmission =
    activeAdmissions.find((a) => a.id === effectiveAdmissionId) ?? null;

  const availableBeds = useMemo(
    () =>
      beds.filter(
        (b) => b.status === "Available" && b.id !== currentAdmission?.bedId
      ),
    [beds, currentAdmission]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveAdmissionId || !toBedId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateTransfer({
        admissionId: effectiveAdmissionId,
        toBedId,
        reason,
        requestingDoctor,
        responsibleStaff,
      });
      if (ok) {
        setToBedId("");
        setReason("");
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
            Transfer Inpatient Bed / Ward
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Checks destination bed availability, releases current bed, and
            updates patient location automatically.
          </p>
        </div>

        {activeAdmissions.length === 0 ? (
          <p className="rounded-[18px] bg-[#F8FAFA] p-5 text-xs text-[#738288]">
            No active inpatients available to transfer.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Active Inpatient *</label>
              <select
                required
                disabled={!canWrite}
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
                  Current Location: {currentAdmission.department}
                </p>
                <p className="mt-0.5">{currentAdmission.bedLabel}</p>
              </div>
            )}

            <div>
              <label className={LABEL_CLASS}>
                Destination Available Bed * ({availableBeds.length} open)
              </label>
              <select
                required
                disabled={!canWrite}
                value={toBedId}
                onChange={(e) => setToBedId(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Select destination bed</option>
                {beds.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                    disabled={
                      b.status !== "Available" ||
                      b.id === currentAdmission?.bedId
                    }
                  >
                    {b.bedNumber} — {b.ward} / {b.room} ({b.department} •{" "}
                    {b.bedType}) [{b.status}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Requesting Doctor *</label>
                <select
                  disabled={!canWrite}
                  value={requestingDoctor}
                  onChange={(e) => setRequestingDoctor(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Responsible Staff *</label>
                <input
                  type="text"
                  required
                  disabled={!canWrite}
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
                disabled={!canWrite}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Step-down from ICU, telemetry monitoring, room upgrade"
                className={INPUT_CLASS}
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!canWrite || !toBedId || submitting}
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
              Inpatient Transfer History
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Chronological record of ward, room, bed, and department transfers.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {transfers.length} transfers
          </span>
        </div>

        <div className="space-y-3">
          {transfers.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No inpatient transfers recorded yet.
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
                <p className="text-[#6B7A80]">
                  {trf.fromDepartment} → {trf.toDepartment}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Reason:</strong> {trf.reason}
                </p>
                <p className="mt-1 text-[11px] text-[#7D8C92]">
                  Requested by {trf.requestingDoctor} • Responsible:{" "}
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
