"use client";

import React, { useMemo, useState } from "react";
import type {
  OtSurgeon,
  OtSurgery,
  OtSurgicalRecord,
} from "@/lib/ot/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  getTodayDate,
} from "./ui";

interface SurgicalRecordsSectionProps {
  surgeries: OtSurgery[];
  surgeons: OtSurgeon[];
  surgicalRecords: OtSurgicalRecord[];
  preselectedSurgeryId?: string;
  canWrite: boolean;
  onSaveRecord: (payload: {
    surgeryId: string;
    procedurePerformed: string;
    surgeryDate: string;
    actualStartTime: string;
    actualEndTime: string;
    primarySurgeon: string;
    assistingSurgeons: string;
    participatingStaff: string;
    surgicalFindings: string;
    operativeNotes: string;
    complications: string;
    outcome: string;
  }) => Promise<boolean>;
}

export function SurgicalRecordsSection({
  surgeries,
  surgeons,
  surgicalRecords,
  preselectedSurgeryId,
  canWrite,
  onSaveRecord,
}: SurgicalRecordsSectionProps) {
  const [surgeryId, setSurgeryId] = useState(
    preselectedSurgeryId || surgeries[0]?.id || ""
  );
  const [submitting, setSubmitting] = useState(false);

  const effectiveSurgeryId =
    preselectedSurgeryId && surgeries.some((s) => s.id === preselectedSurgeryId)
      ? preselectedSurgeryId
      : surgeries.some((s) => s.id === surgeryId)
        ? surgeryId
        : (surgeries[0]?.id ?? "");

  const activeSurgery =
    surgeries.find((s) => s.id === effectiveSurgeryId) ?? null;
  const existing =
    surgicalRecords.find((r) => r.surgeryId === effectiveSurgeryId) ?? null;

  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        procedurePerformed: string;
        surgeryDate: string;
        actualStartTime: string;
        actualEndTime: string;
        primarySurgeon: string;
        assistingSurgeons: string;
        participatingStaff: string;
        surgicalFindings: string;
        operativeNotes: string;
        complications: string;
        outcome: string;
      }
    >
  >({});

  const form = useMemo(() => {
    if (drafts[effectiveSurgeryId]) return drafts[effectiveSurgeryId];
    if (existing) {
      return {
        procedurePerformed: existing.procedurePerformed,
        surgeryDate: existing.surgeryDate,
        actualStartTime: existing.actualStartTime,
        actualEndTime: existing.actualEndTime,
        primarySurgeon: existing.primarySurgeon,
        assistingSurgeons: existing.assistingSurgeons,
        participatingStaff: existing.participatingStaff,
        surgicalFindings: existing.surgicalFindings,
        operativeNotes: existing.operativeNotes,
        complications: existing.complications,
        outcome: existing.outcome,
      };
    }
    return {
      procedurePerformed: activeSurgery?.procedureName ?? "",
      surgeryDate: activeSurgery?.scheduledDate ?? getTodayDate(),
      actualStartTime: activeSurgery?.startTime ?? "11:00",
      actualEndTime: activeSurgery?.endTime ?? "12:30",
      primarySurgeon: surgeons[0]?.name ?? "Dr. Sunita Kapoor",
      assistingSurgeons: "",
      participatingStaff: "OT Scrub & Circulating Nurses",
      surgicalFindings: "",
      operativeNotes: "",
      complications: "None",
      outcome: "Procedure completed successfully; patient shifted to PACU",
    };
  }, [drafts, effectiveSurgeryId, existing, activeSurgery, surgeons]);

  function updateField(field: keyof typeof form, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [effectiveSurgeryId]: { ...form, [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveSurgeryId) return;
    setSubmitting(true);
    try {
      await onSaveRecord({ surgeryId: effectiveSurgeryId, ...form });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Operative &amp; Surgical Record
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Saving the operative record marks the surgery Completed and moves
            the OT suite to Cleaning.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Surgery *</label>
            <select
              value={effectiveSurgeryId}
              onChange={(e) => setSurgeryId(e.target.value)}
              className={INPUT_CLASS}
            >
              {surgeries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.patientName} • {s.procedureName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Procedure Performed *</label>
            <input
              type="text"
              required
              disabled={!canWrite}
              value={form.procedurePerformed}
              onChange={(e) =>
                updateField("procedurePerformed", e.target.value)
              }
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL_CLASS}>Date</label>
              <input
                type="date"
                disabled={!canWrite}
                value={form.surgeryDate}
                onChange={(e) => updateField("surgeryDate", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Actual Start</label>
              <input
                type="time"
                disabled={!canWrite}
                value={form.actualStartTime}
                onChange={(e) => updateField("actualStartTime", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Actual End</label>
              <input
                type="time"
                disabled={!canWrite}
                value={form.actualEndTime}
                onChange={(e) => updateField("actualEndTime", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Primary Surgeon *</label>
              <select
                disabled={!canWrite}
                value={form.primarySurgeon}
                onChange={(e) => updateField("primarySurgeon", e.target.value)}
                className={INPUT_CLASS}
              >
                {surgeons.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Assisting Surgeons</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.assistingSurgeons}
                onChange={(e) =>
                  updateField("assistingSurgeons", e.target.value)
                }
                placeholder="Co-surgeons / residents"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Participating OT Staff</label>
            <input
              type="text"
              disabled={!canWrite}
              value={form.participatingStaff}
              onChange={(e) =>
                updateField("participatingStaff", e.target.value)
              }
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Surgical Findings *</label>
            <textarea
              rows={2}
              required
              disabled={!canWrite}
              value={form.surgicalFindings}
              onChange={(e) => updateField("surgicalFindings", e.target.value)}
              placeholder="Intra-operative anatomical & pathological findings..."
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Operative Notes *</label>
            <textarea
              rows={3}
              required
              disabled={!canWrite}
              value={form.operativeNotes}
              onChange={(e) => updateField("operativeNotes", e.target.value)}
              placeholder="Incision, technique, hemostasis, closure, sponge count..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Complications</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.complications}
                onChange={(e) => updateField("complications", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Outcome *</label>
              <input
                type="text"
                required
                disabled={!canWrite}
                value={form.outcome}
                onChange={(e) => updateField("outcome", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canWrite || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Saving..." : "Save Operative Record"}
            </button>
          </div>
        </form>
      </div>

      {/* Surgical History */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Surgical History Archive
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Completed operative reports linked to surgeries and patients.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {surgicalRecords.length} records
          </span>
        </div>

        <div className="space-y-3">
          {surgicalRecords.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No operative records documented yet.
            </p>
          ) : (
            surgicalRecords.map((rec) => (
              <article
                key={rec.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {rec.id} • {rec.surgeryId}
                  </span>
                  <span className="text-[11px] text-[#6B7A80]">
                    {rec.surgeryDate} ({rec.actualStartTime}–{rec.actualEndTime})
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {rec.procedurePerformed} ({rec.patientId})
                </p>
                <p className="text-[#546369]">
                  <strong>Surgeon:</strong> {rec.primarySurgeon}
                  {rec.assistingSurgeons
                    ? ` • Assist: ${rec.assistingSurgeons}`
                    : ""}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Findings:</strong> {rec.surgicalFindings}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Operative Notes:</strong> {rec.operativeNotes}
                </p>
                <p className="mt-1 text-[#6B7A80]">
                  <strong>Complications:</strong> {rec.complications} •{" "}
                  <strong>Outcome:</strong> {rec.outcome}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
