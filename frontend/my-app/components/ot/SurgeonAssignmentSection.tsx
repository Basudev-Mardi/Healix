"use client";

import React, { useMemo, useState } from "react";
import type {
  OtSurgeon,
  OtSurgeonAssignment,
  OtSurgery,
} from "@/lib/ot/types";
import {
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
} from "./ui";

interface SurgeonAssignmentSectionProps {
  surgeries: OtSurgery[];
  surgeons: OtSurgeon[];
  assignments: OtSurgeonAssignment[];
  preselectedSurgeryId?: string;
  canAssign: boolean;
  onAssign: (payload: {
    surgeryId: string;
    surgeonId: string;
    assignedRole: string;
  }) => Promise<boolean>;
  onRemove: (assignmentId: string) => Promise<void>;
}

export function SurgeonAssignmentSection({
  surgeries,
  surgeons,
  assignments,
  preselectedSurgeryId,
  canAssign,
  onAssign,
  onRemove,
}: SurgeonAssignmentSectionProps) {
  const [surgeryId, setSurgeryId] = useState(
    preselectedSurgeryId || surgeries[0]?.id || ""
  );
  const [surgeonId, setSurgeonId] = useState(surgeons[0]?.id ?? "");
  const [assignedRole, setAssignedRole] = useState("Primary Surgeon");
  const [submitting, setSubmitting] = useState(false);

  const effectiveSurgeryId =
    preselectedSurgeryId && surgeries.some((s) => s.id === preselectedSurgeryId)
      ? preselectedSurgeryId
      : surgeries.some((s) => s.id === surgeryId)
        ? surgeryId
        : (surgeries[0]?.id ?? "");

  const filteredAssignments = useMemo(
    () =>
      assignments.filter(
        (a) => !effectiveSurgeryId || a.surgeryId === effectiveSurgeryId
      ),
    [assignments, effectiveSurgeryId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canAssign || !effectiveSurgeryId || !surgeonId) return;
    setSubmitting(true);
    try {
      await onAssign({
        surgeryId: effectiveSurgeryId,
        surgeonId,
        assignedRole,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Assign Surgical Team
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Assign primary surgeons, assisting surgeons, and anesthesiologists
            with automatic conflict checks.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Scheduled Surgery *</label>
            <select
              value={effectiveSurgeryId}
              onChange={(e) => setSurgeryId(e.target.value)}
              className={INPUT_CLASS}
            >
              {surgeries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.procedureName} ({s.scheduledDate} {s.startTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Surgeon / Anesthesiologist *</label>
            <select
              disabled={!canAssign}
              value={surgeonId}
              onChange={(e) => setSurgeonId(e.target.value)}
              className={INPUT_CLASS}
            >
              {surgeons.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} — {doc.specialty} ({doc.roleType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Assigned Role *</label>
            <select
              disabled={!canAssign}
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="Primary Surgeon">Primary Surgeon</option>
              <option value="Assisting Surgeon">Assisting Surgeon</option>
              <option value="Anesthesiologist">Anesthesiologist</option>
              <option value="Scrub Lead">Scrub Lead</option>
            </select>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canAssign || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Assigning..." : "Assign to Surgery"}
            </button>
          </div>
        </form>
      </div>

      {/* Assigned Team Roster */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Assigned Surgical Team
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Current assignments for {effectiveSurgeryId || "all surgeries"}.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {filteredAssignments.length} assigned
          </span>
        </div>

        <div className="space-y-3">
          {filteredAssignments.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No surgeons assigned to this surgery yet.
            </p>
          ) : (
            filteredAssignments.map((asn) => (
              <div
                key={asn.id}
                className="flex flex-col justify-between gap-3 rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {asn.assignedRole}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                      {asn.surgeryId}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-[#14191B]">
                    {asn.surgeonName} ({asn.specialty})
                  </p>
                  <p className="text-[11px] text-[#7A898F]">
                    Assigned by {asn.assignedBy} •{" "}
                    {formatDateTime(asn.assignedAt)}
                  </p>
                </div>

                {canAssign && (
                  <button
                    type="button"
                    onClick={() => onRemove(asn.id)}
                    className={DANGER_BTN_CLASS}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
