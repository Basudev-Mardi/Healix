"use client";

import React, { useState } from "react";
import type { BloodTransfusion, BloodUnit } from "@/lib/blood-bank/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getBloodBadgeClass,
} from "./ui";

interface TransfusionRecordsSectionProps {
  units: BloodUnit[];
  transfusions: BloodTransfusion[];
  canRecord: boolean;
  onRecordTransfusion: (payload: {
    unitId: string;
    administeringStaff: string;
    monitoringObservations: string;
    adverseReaction: string;
    adverseReactionNotes: string;
  }) => Promise<boolean>;
}

export function TransfusionRecordsSection({
  units,
  transfusions,
  canRecord,
  onRecordTransfusion,
}: TransfusionRecordsSectionProps) {
  const issuedUnits = units.filter((u) => u.status === "Issued");

  const [unitId, setUnitId] = useState(issuedUnits[0]?.id ?? "");
  const [staff, setStaff] = useState("Nurse Anjali");
  const [observations, setObservations] = useState(
    "Pre/post-transfusion vitals stable; patient tolerated well."
  );
  const [adverseReaction, setAdverseReaction] = useState("None");
  const [reactionNotes, setReactionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const uId = unitId || issuedUnits[0]?.id || "";
    if (!uId) return;
    setSubmitting(true);
    try {
      const ok = await onRecordTransfusion({
        unitId: uId,
        administeringStaff: staff,
        monitoringObservations: observations,
        adverseReaction,
        adverseReactionNotes: reactionNotes,
      });
      if (ok) {
        setReactionNotes("");
        setAdverseReaction("None");
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
          Record Blood Transfusion
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Links issued blood unit, verified compatibility test, and patient
          transfusion monitoring & adverse reactions.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Issued Blood Unit *</label>
            <select
              value={unitId || issuedUnits[0]?.id || ""}
              onChange={(e) => setUnitId(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canRecord || issuedUnits.length === 0}
            >
              {issuedUnits.length === 0 ? (
                <option value="">No issued units awaiting transfusion</option>
              ) : (
                issuedUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.id} — {u.bloodGroup} {u.component} (Req{" "}
                    {u.reservedForRequestId})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Administering Staff *</label>
            <input
              type="text"
              required
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canRecord}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Monitoring Observations *</label>
            <textarea
              rows={2}
              required
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canRecord}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Adverse Reaction</label>
            <select
              value={adverseReaction}
              onChange={(e) => setAdverseReaction(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canRecord}
            >
              <option value="None">None</option>
              <option value="Mild Fever/Chills">Mild Fever / Chills</option>
              <option value="Allergic/Urticaria">Allergic / Urticaria</option>
              <option value="Hemolytic">Acute Hemolytic Reaction</option>
              <option value="TACO/TRALI">TACO / TRALI</option>
            </select>
          </div>

          {adverseReaction !== "None" && (
            <div>
              <label className={LABEL_CLASS}>Adverse Reaction Action Notes</label>
              <input
                type="text"
                value={reactionNotes}
                onChange={(e) => setReactionNotes(e.target.value)}
                placeholder="Transfusion halted, physician notified..."
                className={INPUT_CLASS}
                disabled={!canRecord}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!canRecord || submitting || issuedUnits.length === 0}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Saving Transfusion..." : "Record Transfusion"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Patient Transfusion History ({transfusions.length})
        </h3>
        <div className="mt-4 space-y-3">
          {transfusions.map((tr) => (
            <div
              key={tr.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {tr.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBloodBadgeClass(tr.status)}`}
                  >
                    {tr.status}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                    Unit {tr.unitId} • Crossmatch {tr.compatibilityTestId}
                  </span>
                </div>
                <span className="text-[11px] text-[#6B7A80]">
                  {formatDateTime(tr.startedAt)}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {tr.patientName} ({tr.patientId}) — {tr.bloodGroup}{" "}
                {tr.component} ({tr.volumeMl} mL)
              </p>
              <p className="mt-0.5 text-[#546369]">
                Administered by <strong>{tr.administeringStaff}</strong> •{" "}
                {tr.monitoringObservations}
              </p>
              <p className="mt-1 font-medium text-[#4A90A4]">
                Adverse Reaction: {tr.adverseReaction}
                {tr.adverseReactionNotes ? ` — ${tr.adverseReactionNotes}` : ""}
              </p>
            </div>
          ))}

          {transfusions.length === 0 && (
            <p className="rounded-[18px] bg-[#F8FAFA] py-8 text-center text-xs text-[#7D8C92]">
              No transfusions recorded yet. Issue a crossmatched unit to record
              a transfusion.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
