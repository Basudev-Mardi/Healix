"use client";

import React, { useMemo, useState } from "react";
import type { IpdAdmission, IpdDischarge } from "@/lib/ipd/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getIpdBadgeClass,
  getTodayDate,
} from "./ui";

interface DischargeManagementSectionProps {
  admissions: IpdAdmission[];
  discharges: IpdDischarge[];
  preselectedAdmissionId?: string;
  canRequest: boolean;
  canApprove: boolean;
  onCreateDischarge: (payload: {
    admissionId: string;
    dischargeDate: string;
    reason: string;
  }) => Promise<boolean>;
  onUpdateDischarge: (payload: {
    dischargeId: string;
    action: "update-approvals" | "complete";
    clinicalClearance?: boolean;
    billingClearance?: boolean;
    pharmacyClearance?: boolean;
    doctorApproval?: boolean;
  }) => Promise<void>;
  onOpenSummary: (admissionId: string) => void;
}

export function DischargeManagementSection({
  admissions,
  discharges,
  preselectedAdmissionId,
  canRequest,
  canApprove,
  onCreateDischarge,
  onUpdateDischarge,
  onOpenSummary,
}: DischargeManagementSectionProps) {
  const dischargedAdmissionIds = useMemo(
    () => new Set(discharges.map((d) => d.admissionId)),
    [discharges]
  );

  const eligibleAdmissions = useMemo(
    () =>
      admissions.filter(
        (a) => a.status !== "Discharged" && !dischargedAdmissionIds.has(a.id)
      ),
    [admissions, dischargedAdmissionIds]
  );

  const [admissionId, setAdmissionId] = useState(
    preselectedAdmissionId || eligibleAdmissions[0]?.id || ""
  );
  const [dischargeDate, setDischargeDate] = useState(getTodayDate());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveAdmissionId =
    preselectedAdmissionId &&
    eligibleAdmissions.some((a) => a.id === preselectedAdmissionId)
      ? preselectedAdmissionId
      : eligibleAdmissions.some((a) => a.id === admissionId)
        ? admissionId
        : (eligibleAdmissions[0]?.id ?? "");

  const admissionMap = useMemo(
    () => new Map(admissions.map((a) => [a.id, a])),
    [admissions]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canRequest || !effectiveAdmissionId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateDischarge({
        admissionId: effectiveAdmissionId,
        dischargeDate,
        reason,
      });
      if (ok) setReason("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Initiate Discharge */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Initiate Discharge Request
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Requires Clinical, Billing, Pharmacy, and Doctor approvals before
            completing discharge and releasing the bed.
          </p>
        </div>

        {eligibleAdmissions.length === 0 ? (
          <p className="rounded-[18px] bg-[#F8FAFA] p-5 text-xs text-[#738288]">
            All active admissions either already have a discharge request or are
            discharged.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Active Admission *</label>
              <select
                required
                disabled={!canRequest}
                value={effectiveAdmissionId}
                onChange={(e) => setAdmissionId(e.target.value)}
                className={INPUT_CLASS}
              >
                {eligibleAdmissions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.patientName} ({a.bedLabel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Planned Discharge Date *</label>
              <input
                type="date"
                required
                disabled={!canRequest}
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Discharge Reason *</label>
              <textarea
                rows={3}
                required
                disabled={!canRequest}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Clinically recovered, stable on oral medication"
                className={INPUT_CLASS}
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!canRequest || submitting}
                className={PRIMARY_BTN_CLASS}
              >
                {submitting ? "Submitting..." : "Create Discharge Request"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Discharge Clearances & Completion */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Pending &amp; Completed Discharges
            </h2>
            <p className="text-xs text-[#6B7A80]">
              All 4 clearances must be verified before completing discharge.
              Completion frees the bed automatically.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {discharges.length} records
          </span>
        </div>

        <div className="space-y-3">
          {discharges.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No discharge requests initiated yet.
            </p>
          ) : (
            discharges.map((dsc) => {
              const adm = admissionMap.get(dsc.admissionId);
              const allApproved =
                dsc.clinicalClearance &&
                dsc.billingClearance &&
                dsc.pharmacyClearance &&
                dsc.doctorApproval;

              return (
                <div
                  key={dsc.id}
                  className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {dsc.id}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getIpdBadgeClass(dsc.status)}`}
                      >
                        {dsc.status}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                        {dsc.admissionId} • {dsc.patientId}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#6B7A80]">
                      Date: {dsc.dischargeDate}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-[#14191B]">
                    {adm?.patientName ?? dsc.patientId}{" "}
                    <span className="font-normal text-[#738288]">
                      ({adm?.bedLabel})
                    </span>
                  </p>
                  <p className="mt-0.5 text-[#4C5B61]">{dsc.reason}</p>

                  {/* 4 Required Approval Checkboxes */}
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-[16px] bg-white p-3 sm:grid-cols-4">
                    {(
                      [
                        {
                          key: "clinicalClearance",
                          label: "Clinical",
                          val: dsc.clinicalClearance,
                        },
                        {
                          key: "billingClearance",
                          label: "Billing",
                          val: dsc.billingClearance,
                        },
                        {
                          key: "pharmacyClearance",
                          label: "Pharmacy",
                          val: dsc.pharmacyClearance,
                        },
                        {
                          key: "doctorApproval",
                          label: "Doctor",
                          val: dsc.doctorApproval,
                        },
                      ] as const
                    ).map((chk) => (
                      <label
                        key={chk.key}
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#14191B]"
                      >
                        <input
                          type="checkbox"
                          disabled={!canApprove || dsc.status === "Completed"}
                          checked={chk.val}
                          onChange={(e) =>
                            onUpdateDischarge({
                              dischargeId: dsc.id,
                              action: "update-approvals",
                              [chk.key]: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded accent-[#181C1E]"
                        />
                        {chk.label}
                      </label>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6ECEE] pt-3">
                    <span className="text-[11px] text-[#7A898F]">
                      {dsc.completedAt
                        ? `Discharged ${formatDateTime(dsc.completedAt)} by ${dsc.approvedBy}`
                        : allApproved
                          ? "All approvals verified — ready to complete."
                          : "Awaiting remaining required clearances."}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenSummary(dsc.admissionId)}
                        className={ACCENT_BTN_CLASS}
                      >
                        {dsc.dischargeSummaryId
                          ? `View Summary (${dsc.dischargeSummaryId})`
                          : "Prepare Summary"}
                      </button>
                      {canApprove && dsc.status === "Pending" && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateDischarge({
                              dischargeId: dsc.id,
                              action: "complete",
                            })
                          }
                          className={PRIMARY_BTN_CLASS}
                        >
                          Complete Discharge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
