"use client";

import React, { useState } from "react";
import type {
  EmergencyRegistration,
  TraumaInjuryType,
  TraumaProgressStatus,
  TraumaRecord,
  TraumaSeverity,
} from "@/lib/emergency/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatTimeShort,
  getEmergencyBadgeClass,
} from "./ui";

interface TraumaManagementSectionProps {
  registrations: EmergencyRegistration[];
  traumas: TraumaRecord[];
  preselectedEmergencyId?: string;
  canWrite: boolean;
  onSaveTrauma: (payload: {
    emergencyId: string;
    injuryType: TraumaInjuryType;
    severity: TraumaSeverity;
    mechanismOfInjury: string;
    affectedBodyAreas: string[];
    airwayStatus: string;
    bleedingControl: string;
    assessmentNotes: string;
    treatmentProgress: TraumaProgressStatus;
  }) => Promise<boolean>;
  onUpdateProgress: (
    traumaId: string,
    treatmentProgress: TraumaProgressStatus
  ) => Promise<void>;
}

const INJURY_TYPES: TraumaInjuryType[] = [
  "Blunt Trauma",
  "Penetrating Trauma",
  "Fracture / Orthopedic",
  "Burns",
  "Head / TBI",
  "Spinal Injury",
  "Polytrauma",
  "Crush Injury",
];

const SEVERITIES: TraumaSeverity[] = ["Critical", "Severe", "Moderate", "Minor"];

const BODY_AREAS = [
  "Head / Neck",
  "Chest",
  "Abdomen",
  "Pelvis",
  "Spine",
  "Upper Limbs",
  "Lower Limbs",
];

const PROGRESS_STATUSES: TraumaProgressStatus[] = [
  "Active Resuscitation",
  "Stabilized",
  "In Surgery",
  "Post-Op Monitoring",
  "Resolved",
];

export function TraumaManagementSection({
  registrations,
  traumas,
  preselectedEmergencyId,
  canWrite,
  onSaveTrauma,
  onUpdateProgress,
}: TraumaManagementSectionProps) {
  const [emergencyId, setEmergencyId] = useState(
    preselectedEmergencyId || registrations[0]?.id || ""
  );
  const [injuryType, setInjuryType] = useState<TraumaInjuryType>("Polytrauma");
  const [severity, setSeverity] = useState<TraumaSeverity>("Severe");
  const [mechanismOfInjury, setMechanismOfInjury] = useState("");
  const [affectedBodyAreas, setAffectedBodyAreas] = useState<string[]>([
    "Chest",
  ]);
  const [airwayStatus, setAirwayStatus] = useState("Patent");
  const [bleedingControl, setBleedingControl] = useState("Pressure dressing");
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [treatmentProgress, setTreatmentProgress] =
    useState<TraumaProgressStatus>("Active Resuscitation");
  const [submitting, setSubmitting] = useState(false);

  const effectiveEmergencyId =
    preselectedEmergencyId &&
    registrations.some((r) => r.id === preselectedEmergencyId)
      ? preselectedEmergencyId
      : registrations.some((r) => r.id === emergencyId)
        ? emergencyId
        : (registrations[0]?.id ?? "");

  function toggleBodyArea(area: string) {
    setAffectedBodyAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveEmergencyId || affectedBodyAreas.length === 0)
      return;
    setSubmitting(true);
    try {
      const ok = await onSaveTrauma({
        emergencyId: effectiveEmergencyId,
        injuryType,
        severity,
        mechanismOfInjury,
        affectedBodyAreas,
        airwayStatus,
        bleedingControl,
        assessmentNotes,
        treatmentProgress,
      });
      if (ok) {
        setMechanismOfInjury("");
        setAssessmentNotes("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Trauma Intake Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Record Trauma Assessment
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Document injury type, severity, affected body areas, and trauma
            stabilization progress.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Emergency Case *</label>
            <select
              value={effectiveEmergencyId}
              onChange={(e) => setEmergencyId(e.target.value)}
              disabled={!canWrite}
              className={INPUT_CLASS}
            >
              {registrations.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.id} — {reg.patientName} ({reg.patientId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={LABEL_CLASS}>Injury Type *</label>
              <select
                disabled={!canWrite}
                value={injuryType}
                onChange={(e) =>
                  setInjuryType(e.target.value as TraumaInjuryType)
                }
                className={INPUT_CLASS}
              >
                {INJURY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Severity *</label>
              <select
                disabled={!canWrite}
                value={severity}
                onChange={(e) => setSeverity(e.target.value as TraumaSeverity)}
                className={INPUT_CLASS}
              >
                {SEVERITIES.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Treatment Progress</label>
              <select
                disabled={!canWrite}
                value={treatmentProgress}
                onChange={(e) =>
                  setTreatmentProgress(e.target.value as TraumaProgressStatus)
                }
                className={INPUT_CLASS}
              >
                {PROGRESS_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Mechanism of Injury *</label>
            <input
              type="text"
              required
              disabled={!canWrite}
              value={mechanismOfInjury}
              onChange={(e) => setMechanismOfInjury(e.target.value)}
              placeholder="e.g., High-velocity RTA, fall from 10 ft, industrial crush"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Affected Body Areas *</label>
            <div className="flex flex-wrap gap-2 rounded-[20px] bg-white p-3">
              {BODY_AREAS.map((area) => {
                const active = affectedBodyAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    disabled={!canWrite}
                    onClick={() => toggleBodyArea(area)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-[#181C1E] text-white"
                        : "bg-[#EDF2F3] text-[#4C5B61] hover:bg-[#DCE5E8]"
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Airway Status</label>
              <input
                type="text"
                disabled={!canWrite}
                value={airwayStatus}
                onChange={(e) => setAirwayStatus(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Bleeding Control</label>
              <input
                type="text"
                disabled={!canWrite}
                value={bleedingControl}
                onChange={(e) => setBleedingControl(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Trauma Assessment Notes</label>
            <textarea
              rows={3}
              disabled={!canWrite}
              value={assessmentNotes}
              onChange={(e) => setAssessmentNotes(e.target.value)}
              placeholder="FAST exam, imaging findings, orthopedic/surgical consult notes..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={
                !canWrite || affectedBodyAreas.length === 0 || submitting
              }
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Saving..." : "Save Trauma Record"}
            </button>
          </div>
        </form>
      </div>

      {/* Patient Trauma Records */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Patient Trauma Records
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Track injury details and update active trauma treatment progress.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {traumas.length} records
          </span>
        </div>

        <div className="space-y-3">
          {traumas.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No trauma cases recorded yet.
            </p>
          ) : (
            traumas.map((trm) => (
              <div
                key={trm.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {trm.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getEmergencyBadgeClass(trm.severity)}`}
                    >
                      {trm.severity}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#546369]">
                      {trm.injuryType}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getEmergencyBadgeClass(trm.treatmentProgress)}`}
                  >
                    {trm.treatmentProgress}
                  </span>
                </div>

                <p className="mt-2 text-xs font-semibold text-[#14191B]">
                  Case {trm.emergencyId} • Patient {trm.patientId}
                </p>
                <p className="mt-1 text-xs text-[#546369]">
                  <strong>Mechanism:</strong> {trm.mechanismOfInjury}
                </p>
                <p className="mt-1 text-xs text-[#546369]">
                  <strong>Body Areas:</strong> {trm.affectedBodyAreas.join(", ")}
                </p>
                <p className="mt-1 text-xs text-[#6B7A80]">
                  <strong>Airway:</strong> {trm.airwayStatus} •{" "}
                  <strong>Bleeding:</strong> {trm.bleedingControl}
                </p>
                {trm.assessmentNotes && (
                  <p className="mt-1 text-xs text-[#6B7A80]">
                    {trm.assessmentNotes}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6ECEE] pt-3">
                  <span className="text-[11px] text-[#7D8C92]">
                    {trm.recordedBy} • {formatTimeShort(trm.updatedAt)}
                  </span>
                  {canWrite && (
                    <select
                      aria-label={`Update progress for ${trm.id}`}
                      value={trm.treatmentProgress}
                      onChange={(e) =>
                        onUpdateProgress(
                          trm.id,
                          e.target.value as TraumaProgressStatus
                        )
                      }
                      className="rounded-full border border-[#D4DFE2] bg-white px-3 py-1 text-[11px] font-semibold text-[#14191B] focus:outline-none"
                    >
                      {PROGRESS_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
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
