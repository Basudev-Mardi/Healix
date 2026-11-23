"use client";

import React, { useMemo, useState } from "react";
import type { LabRequest, LabSample } from "@/lib/lab/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getLabBadgeClass,
} from "./ui";

interface SampleCollectionSectionProps {
  requests: LabRequest[];
  samples: LabSample[];
  preselectedRequestId?: string;
  canCollect: boolean;
  onCollect: (payload: {
    requestId: string;
    specimenType: string;
    collectedBy: string;
    status: "Collected" | "Rejected";
    rejectionReason: string;
    notes: string;
  }) => Promise<boolean>;
}

export function SampleCollectionSection({
  requests,
  samples,
  preselectedRequestId,
  canCollect,
  onCollect,
}: SampleCollectionSectionProps) {
  const collectedRequestIds = useMemo(
    () => new Set(samples.map((s) => s.requestId)),
    [samples]
  );

  const pendingRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.status !== "Cancelled" &&
          r.status !== "Completed" &&
          !collectedRequestIds.has(r.id)
      ),
    [requests, collectedRequestIds]
  );

  const [requestId, setRequestId] = useState(
    preselectedRequestId || pendingRequests[0]?.id || ""
  );
  const [specimenType, setSpecimenType] = useState("Whole Blood (EDTA)");
  const [collectedBy, setCollectedBy] = useState("Phlebotomist Priya");
  const [status, setStatus] = useState<"Collected" | "Rejected">("Collected");
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveRequestId =
    preselectedRequestId &&
    pendingRequests.some((r) => r.id === preselectedRequestId)
      ? preselectedRequestId
      : pendingRequests.some((r) => r.id === requestId)
        ? requestId
        : (pendingRequests[0]?.id ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCollect || !effectiveRequestId) return;
    setSubmitting(true);
    try {
      const ok = await onCollect({
        requestId: effectiveRequestId,
        specimenType,
        collectedBy,
        status,
        rejectionReason,
        notes,
      });
      if (ok) {
        setRejectionReason("");
        setNotes("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Sample Collection Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Sample Collection
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Generates unique Sample IDs (`SMP-YYYY-XXXX`), prevents duplicates,
            and records rejected/insufficient specimens.
          </p>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="rounded-[18px] bg-[#F8FAFA] p-5 text-xs text-[#738288]">
            All active lab requests already have collected samples.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Pending Lab Request *</label>
              <select
                required
                disabled={!canCollect}
                value={effectiveRequestId}
                onChange={(e) => setRequestId(e.target.value)}
                className={INPUT_CLASS}
              >
                {pendingRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.patientName} ({r.priority})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Specimen Type *</label>
                <select
                  disabled={!canCollect}
                  value={specimenType}
                  onChange={(e) => setSpecimenType(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="Whole Blood (EDTA)">Whole Blood (EDTA)</option>
                  <option value="Serum">Serum</option>
                  <option value="Whole Blood (EDTA) + Serum">
                    Whole Blood (EDTA) + Serum
                  </option>
                  <option value="Plasma">Plasma</option>
                  <option value="Urine">Urine</option>
                  <option value="Swab">Swab</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Collecting Staff *</label>
                <input
                  type="text"
                  required
                  disabled={!canCollect}
                  value={collectedBy}
                  onChange={(e) => setCollectedBy(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Collection Outcome</label>
              <select
                disabled={!canCollect}
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "Collected" | "Rejected")
                }
                className={INPUT_CLASS}
              >
                <option value="Collected">Collected (Valid Specimen)</option>
                <option value="Rejected">
                  Rejected (Hemolyzed / Insufficient)
                </option>
              </select>
            </div>

            {status === "Rejected" && (
              <div>
                <label className={LABEL_CLASS}>Rejection Reason *</label>
                <input
                  type="text"
                  required
                  disabled={!canCollect}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Insufficient volume / clotted EDTA tube"
                  className={INPUT_CLASS}
                />
              </div>
            )}

            <div>
              <label className={LABEL_CLASS}>Collection Notes</label>
              <input
                type="text"
                disabled={!canCollect}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Fasting verified, draw site, cold-chain..."
                className={INPUT_CLASS}
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!canCollect || submitting}
                className={PRIMARY_BTN_CLASS}
              >
                {submitting ? "Recording..." : "Generate Sample ID"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Collected Samples List */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Collected &amp; Logged Samples
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Unique specimen records linked to laboratory requests.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {samples.length} samples
          </span>
        </div>

        <div className="space-y-3">
          {samples.map((smp) => (
            <div
              key={smp.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {smp.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getLabBadgeClass(smp.status)}`}
                  >
                    {smp.status}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                    {smp.requestId} • {smp.patientId}
                  </span>
                </div>
                <span className="text-[11px] text-[#7A898F]">
                  {formatDateTime(smp.collectedAt)}
                </span>
              </div>
              <p className="mt-2 font-semibold text-[#14191B]">
                {smp.specimenType} — Collected by {smp.collectedBy}
              </p>
              {smp.notes && <p className="mt-0.5 text-[#6B7A80]">{smp.notes}</p>}
              {smp.rejectionReason && (
                <p className="mt-1 font-semibold text-[#A32E14]">
                  Rejection Reason: {smp.rejectionReason}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
