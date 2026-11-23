"use client";

import React, { useState } from "react";
import type {
  EmergencyRegistration,
  TransferDestination,
  TransferRecord,
  TransferStatus,
} from "@/lib/emergency/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  formatTimeShort,
  getEmergencyBadgeClass,
} from "./ui";

interface TransferManagementSectionProps {
  registrations: EmergencyRegistration[];
  transfers: TransferRecord[];
  preselectedEmergencyId?: string;
  canRequest: boolean;
  canApprove: boolean;
  onCreateTransfer: (payload: {
    emergencyId: string;
    destination: TransferDestination;
    targetBedOrUnit: string;
    reason: string;
    responsibleStaff: string;
    handoverDetails: string;
  }) => Promise<boolean>;
  onUpdateTransfer: (payload: {
    transferId: string;
    status: TransferStatus;
  }) => Promise<void>;
}

const DESTINATIONS: TransferDestination[] = [
  "ICU",
  "General Ward",
  "Operating Theatre (OT)",
  "Cardiac Care Unit (CCU)",
  "Radiology / Cath Lab",
  "External Hospital",
];

export function TransferManagementSection({
  registrations,
  transfers,
  preselectedEmergencyId,
  canRequest,
  canApprove,
  onCreateTransfer,
  onUpdateTransfer,
}: TransferManagementSectionProps) {
  const [emergencyId, setEmergencyId] = useState(
    preselectedEmergencyId || registrations[0]?.id || ""
  );
  const [destination, setDestination] = useState<TransferDestination>("ICU");
  const [targetBedOrUnit, setTargetBedOrUnit] = useState("");
  const [reason, setReason] = useState("");
  const [responsibleStaff, setResponsibleStaff] = useState("Dr. Arjun Sen");
  const [handoverDetails, setHandoverDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveEmergencyId =
    preselectedEmergencyId &&
    registrations.some((r) => r.id === preselectedEmergencyId)
      ? preselectedEmergencyId
      : registrations.some((r) => r.id === emergencyId)
        ? emergencyId
        : (registrations[0]?.id ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canRequest || !effectiveEmergencyId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateTransfer({
        emergencyId: effectiveEmergencyId,
        destination,
        targetBedOrUnit,
        reason,
        responsibleStaff,
        handoverDetails,
      });
      if (ok) {
        setTargetBedOrUnit("");
        setReason("");
        setHandoverDetails("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Request Transfer Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Request Patient Transfer
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Coordinate handover from Emergency to ICU, OT, Wards, or external
            facilities.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Emergency Case *</label>
            <select
              value={effectiveEmergencyId}
              onChange={(e) => setEmergencyId(e.target.value)}
              disabled={!canRequest}
              className={INPUT_CLASS}
            >
              {registrations.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.id} — {reg.patientName} ({reg.assignedBay})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Destination Department *</label>
              <select
                disabled={!canRequest}
                value={destination}
                onChange={(e) =>
                  setDestination(e.target.value as TransferDestination)
                }
                className={INPUT_CLASS}
              >
                {DESTINATIONS.map((dest) => (
                  <option key={dest} value={dest}>
                    {dest}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Target Bed / Suite</label>
              <input
                type="text"
                disabled={!canRequest}
                value={targetBedOrUnit}
                onChange={(e) => setTargetBedOrUnit(e.target.value)}
                placeholder="e.g., ICU Bed 09 / OT-08"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Responsible Escort / Clinician *</label>
            <input
              type="text"
              required
              disabled={!canRequest}
              value={responsibleStaff}
              onChange={(e) => setResponsibleStaff(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Transfer Reason *</label>
            <input
              type="text"
              required
              disabled={!canRequest}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Requires ventilator support & hemodynamic monitoring"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Clinical Handover Details</label>
            <textarea
              rows={3}
              disabled={!canRequest}
              value={handoverDetails}
              onChange={(e) => setHandoverDetails(e.target.value)}
              placeholder="SBAR summary, IV lines, meds given, cross-matched blood..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canRequest || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Requesting..." : "Submit Transfer Request"}
            </button>
          </div>
        </form>
      </div>

      {/* Transfer Queue & History */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Transfer Requests &amp; Handover History
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Approving and completing transfers updates the patient&apos;s
              Emergency Queue status automatically.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {transfers.length} transfers
          </span>
        </div>

        <div className="space-y-3">
          {transfers.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No transfer requests logged yet.
            </p>
          ) : (
            transfers.map((trf) => (
              <div
                key={trf.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {trf.id}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getEmergencyBadgeClass(trf.status)}`}
                      >
                        {trf.status}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                        {trf.emergencyId} • {trf.patientId}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-[#14191B]">
                      {trf.fromLocation} → {trf.destination} ({trf.targetBedOrUnit})
                    </p>
                    <p className="mt-0.5 text-[#546369]">
                      <strong>Reason:</strong> {trf.reason}
                    </p>
                    <p className="mt-1 text-[#6B7A80]">
                      <strong>Handover:</strong> {trf.handoverDetails}
                    </p>
                    <p className="mt-1 text-[11px] text-[#7D8C92]">
                      Requested by {trf.requestedBy} • Escort:{" "}
                      {trf.responsibleStaff} • {formatTimeShort(trf.requestedAt)}
                      {trf.transferredAt
                        ? ` • Completed ${formatTimeShort(trf.transferredAt)}`
                        : ""}
                    </p>
                  </div>

                  {canApprove &&
                    trf.status !== "Completed" &&
                    trf.status !== "Cancelled" && (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {trf.status === "Requested" && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateTransfer({
                                transferId: trf.id,
                                status: "Approved",
                              })
                            }
                            className={ACCENT_BTN_CLASS}
                          >
                            Approve
                          </button>
                        )}
                        {trf.status === "Approved" && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateTransfer({
                                transferId: trf.id,
                                status: "In Transit",
                              })
                            }
                            className={SECONDARY_BTN_CLASS}
                          >
                            Mark In Transit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateTransfer({
                              transferId: trf.id,
                              status: "Completed",
                            })
                          }
                          className={PRIMARY_BTN_CLASS}
                        >
                          Complete Transfer
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateTransfer({
                              transferId: trf.id,
                              status: "Cancelled",
                            })
                          }
                          className={DANGER_BTN_CLASS}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
