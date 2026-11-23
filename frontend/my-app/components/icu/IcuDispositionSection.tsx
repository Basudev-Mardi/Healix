"use client";

import React, { useMemo, useState } from "react";
import type {
  IcuAdmission,
  IcuBed,
  IcuDisposition,
  IcuDoctor,
} from "@/lib/icu/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getIcuBadgeClass,
} from "./ui";

interface IcuDispositionSectionProps {
  admissions: IcuAdmission[];
  allBeds: IcuBed[];
  doctors: IcuDoctor[];
  dispositions: IcuDisposition[];
  preselectedAdmissionId?: string;
  canRequest: boolean;
  canApprove: boolean;
  onCreateDisposition: (payload: {
    icuAdmissionId: string;
    dispositionType: "Transfer" | "Discharge";
    destination: string;
    targetBedId?: string;
    reason: string;
    responsibleDoctor: string;
    handoverDetails: string;
    dischargeCondition: string;
    dischargeInstructions: string;
  }) => Promise<boolean>;
  onUpdateDisposition: (payload: {
    dispositionId: string;
    status: "Approved" | "Completed" | "Cancelled";
  }) => Promise<void>;
}

export function IcuDispositionSection({
  admissions,
  allBeds,
  doctors,
  dispositions,
  preselectedAdmissionId,
  canRequest,
  canApprove,
  onCreateDisposition,
  onUpdateDisposition,
}: IcuDispositionSectionProps) {
  const activeAdmissions = useMemo(
    () =>
      admissions.filter(
        (a) => a.status !== "Transferred" && a.status !== "Discharged"
      ),
    [admissions]
  );

  const [admissionId, setAdmissionId] = useState(
    preselectedAdmissionId || activeAdmissions[0]?.id || ""
  );
  const [dispositionType, setDispositionType] = useState<
    "Transfer" | "Discharge"
  >("Transfer");
  const [destination, setDestination] = useState("Step-Down / General Ward");
  const [targetBedId, setTargetBedId] = useState("");
  const [responsibleDoctor, setResponsibleDoctor] = useState(
    doctors[0]?.name ?? "Dr. Lin Chen"
  );
  const [reason, setReason] = useState("");
  const [handoverDetails, setHandoverDetails] = useState("");
  const [dischargeCondition, setDischargeCondition] = useState("Stabilized");
  const [dischargeInstructions, setDischargeInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveAdmissionId =
    preselectedAdmissionId &&
    activeAdmissions.some((a) => a.id === preselectedAdmissionId)
      ? preselectedAdmissionId
      : activeAdmissions.some((a) => a.id === admissionId)
        ? admissionId
        : (activeAdmissions[0]?.id ?? "");

  const availableTargetBeds = useMemo(
    () => allBeds.filter((b) => b.status === "Available"),
    [allBeds]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canRequest || !effectiveAdmissionId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateDisposition({
        icuAdmissionId: effectiveAdmissionId,
        dispositionType,
        destination,
        targetBedId:
          dispositionType === "Transfer" && targetBedId
            ? targetBedId
            : undefined,
        reason,
        responsibleDoctor,
        handoverDetails,
        dischargeCondition,
        dischargeInstructions,
      });
      if (ok) {
        setReason("");
        setHandoverDetails("");
        setDischargeInstructions("");
        setTargetBedId("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Transfer / Discharge Request Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              ICU Transfer &amp; Discharge
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Completing transfer or discharge automatically updates ICU bed
              availability.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-white p-1">
            <button
              type="button"
              onClick={() => {
                setDispositionType("Transfer");
                setDestination("Step-Down / General Ward");
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                dispositionType === "Transfer"
                  ? "bg-[#181C1E] text-white"
                  : "text-[#5D6C72]"
              }`}
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => {
                setDispositionType("Discharge");
                setDestination("Home / Post-ICU Follow-up");
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                dispositionType === "Discharge"
                  ? "bg-[#181C1E] text-white"
                  : "text-[#5D6C72]"
              }`}
            >
              Discharge
            </button>
          </div>
        </div>

        {activeAdmissions.length === 0 ? (
          <p className="rounded-[18px] bg-[#F8FAFA] p-5 text-xs text-[#738288]">
            No active ICU patients available for transfer or discharge.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Active ICU Admission *</label>
              <select
                required
                disabled={!canRequest}
                value={effectiveAdmissionId}
                onChange={(e) => setAdmissionId(e.target.value)}
                className={INPUT_CLASS}
              >
                {activeAdmissions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.patientName} ({a.bedLabel})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Destination *</label>
                <input
                  type="text"
                  required
                  disabled={!canRequest}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Responsible Doctor *</label>
                <select
                  disabled={!canRequest}
                  value={responsibleDoctor}
                  onChange={(e) => setResponsibleDoctor(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {dispositionType === "Transfer" && (
              <div>
                <label className={LABEL_CLASS}>
                  Target Bed (Optional — {availableTargetBeds.length} open)
                </label>
                <select
                  disabled={!canRequest}
                  value={targetBedId}
                  onChange={(e) => setTargetBedId(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">No specific bed reserved yet</option>
                  {availableTargetBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} — {b.ward} / {b.room} ({b.bedType})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={LABEL_CLASS}>
                {dispositionType} Reason *
              </label>
              <input
                type="text"
                required
                disabled={!canRequest}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Off vasopressors & extubated > 24h, ready for step-down"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Handover Details</label>
              <textarea
                rows={2}
                disabled={!canRequest}
                value={handoverDetails}
                onChange={(e) => setHandoverDetails(e.target.value)}
                placeholder="Lines, current infusions, pending labs, monitoring needs..."
                className={INPUT_CLASS}
              />
            </div>

            {dispositionType === "Discharge" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLASS}>Condition at Discharge</label>
                  <input
                    type="text"
                    disabled={!canRequest}
                    value={dischargeCondition}
                    onChange={(e) => setDischargeCondition(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Discharge Instructions</label>
                  <input
                    type="text"
                    disabled={!canRequest}
                    value={dischargeInstructions}
                    onChange={(e) => setDischargeInstructions(e.target.value)}
                    placeholder="Meds, follow-up, warning signs"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!canRequest || submitting}
                className={PRIMARY_BTN_CLASS}
              >
                {submitting
                  ? "Submitting..."
                  : `Submit ICU ${dispositionType} Request`}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Disposition History & Approvals */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              ICU Transfer &amp; Discharge History
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Approve and complete requests to release the ICU bed automatically.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {dispositions.length} records
          </span>
        </div>

        <div className="space-y-3">
          {dispositions.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No ICU transfers or discharges requested yet.
            </p>
          ) : (
            dispositions.map((disp) => (
              <div
                key={disp.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {disp.id}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#4A90A4]">
                        {disp.dispositionType}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getIcuBadgeClass(disp.status)}`}
                      >
                        {disp.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-[#14191B]">
                      {disp.icuAdmissionId} ({disp.patientId}) →{" "}
                      {disp.destination}
                      {disp.targetBedId ? ` (${disp.targetBedId})` : ""}
                    </p>
                    <p className="text-[#4C5B61]">
                      <strong>Reason:</strong> {disp.reason}
                    </p>
                    {disp.handoverDetails && (
                      <p className="mt-0.5 text-[#6B7A80]">
                        <strong>Handover:</strong> {disp.handoverDetails}
                      </p>
                    )}
                    {disp.dischargeInstructions && (
                      <p className="mt-0.5 text-[#6B7A80]">
                        <strong>Instructions:</strong>{" "}
                        {disp.dischargeInstructions} ({disp.dischargeCondition})
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-[#7D8C92]">
                      Doctor: {disp.responsibleDoctor} • Requested{" "}
                      {formatDateTime(disp.requestedAt)}
                      {disp.completedAt
                        ? ` • Completed ${formatDateTime(disp.completedAt)}`
                        : ""}
                    </p>
                  </div>

                  {canApprove &&
                    disp.status !== "Completed" &&
                    disp.status !== "Cancelled" && (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {disp.status === "Requested" && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateDisposition({
                                dispositionId: disp.id,
                                status: "Approved",
                              })
                            }
                            className={ACCENT_BTN_CLASS}
                          >
                            Approve
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateDisposition({
                              dispositionId: disp.id,
                              status: "Completed",
                            })
                          }
                          className={PRIMARY_BTN_CLASS}
                        >
                          Complete &amp; Release Bed
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateDisposition({
                              dispositionId: disp.id,
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
