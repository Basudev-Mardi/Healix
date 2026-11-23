"use client";

import React, { useMemo, useState } from "react";
import type {
  EmergencyRegistration,
  TriageAssessment,
  TriageLevel,
} from "@/lib/emergency/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatTimeShort,
  getEmergencyBadgeClass,
} from "./ui";

interface TriageAssessmentSectionProps {
  registrations: EmergencyRegistration[];
  triages: TriageAssessment[];
  preselectedEmergencyId?: string;
  canWrite: boolean;
  onSaveTriage: (payload: {
    emergencyId: string;
    triageLevel: TriageLevel;
    vitals: {
      bloodPressure: string;
      heartRate: string;
      respiratoryRate: string;
      spo2: string;
      temperature: string;
      gcsScore: string;
      painScore: string;
    };
    symptoms: string;
    severitySummary: string;
    assessmentNotes: string;
  }) => Promise<boolean>;
}

const TRIAGE_LEVELS: TriageLevel[] = [
  "Level 1 - Resuscitation",
  "Level 2 - Emergent",
  "Level 3 - Urgent",
  "Level 4 - Less Urgent",
  "Level 5 - Non-Urgent",
];

export function TriageAssessmentSection({
  registrations,
  triages,
  preselectedEmergencyId,
  canWrite,
  onSaveTriage,
}: TriageAssessmentSectionProps) {
  const [selectedEmergencyId, setSelectedEmergencyId] = useState(
    preselectedEmergencyId || registrations[0]?.id || ""
  );
  const [submitting, setSubmitting] = useState(false);

  const effectiveEmergencyId =
    preselectedEmergencyId &&
    registrations.some((r) => r.id === preselectedEmergencyId)
      ? preselectedEmergencyId
      : registrations.some((r) => r.id === selectedEmergencyId)
        ? selectedEmergencyId
        : (registrations[0]?.id ?? "");

  const activeReg =
    registrations.find((r) => r.id === effectiveEmergencyId) ?? null;
  const existingTriage =
    triages.find((t) => t.emergencyId === effectiveEmergencyId) ?? null;

  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        triageLevel: TriageLevel;
        bloodPressure: string;
        heartRate: string;
        respiratoryRate: string;
        spo2: string;
        temperature: string;
        gcsScore: string;
        painScore: string;
        symptoms: string;
        severitySummary: string;
        assessmentNotes: string;
      }
    >
  >({});

  const form = useMemo(() => {
    if (drafts[effectiveEmergencyId]) return drafts[effectiveEmergencyId];
    if (existingTriage) {
      return {
        triageLevel: existingTriage.triageLevel,
        bloodPressure: existingTriage.vitals.bloodPressure,
        heartRate: existingTriage.vitals.heartRate,
        respiratoryRate: existingTriage.vitals.respiratoryRate,
        spo2: existingTriage.vitals.spo2,
        temperature: existingTriage.vitals.temperature,
        gcsScore: existingTriage.vitals.gcsScore,
        painScore: existingTriage.vitals.painScore,
        symptoms: existingTriage.symptoms,
        severitySummary: existingTriage.severitySummary,
        assessmentNotes: existingTriage.assessmentNotes,
      };
    }
    return {
      triageLevel: "Level 2 - Emergent" as TriageLevel,
      bloodPressure: "120/80 mmHg",
      heartRate: "88 bpm",
      respiratoryRate: "18 /min",
      spo2: "97%",
      temperature: "98.6 °F",
      gcsScore: "15/15",
      painScore: "5/10",
      symptoms: activeReg?.presentingComplaints ?? "",
      severitySummary: "",
      assessmentNotes: "",
    };
  }, [drafts, effectiveEmergencyId, existingTriage, activeReg]);

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setDrafts((prev) => ({
      ...prev,
      [effectiveEmergencyId]: { ...form, [key]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveEmergencyId) return;
    setSubmitting(true);
    try {
      await onSaveTriage({
        emergencyId: effectiveEmergencyId,
        triageLevel: form.triageLevel,
        vitals: {
          bloodPressure: form.bloodPressure,
          heartRate: form.heartRate,
          respiratoryRate: form.respiratoryRate,
          spo2: form.spo2,
          temperature: form.temperature,
          gcsScore: form.gcsScore,
          painScore: form.painScore,
        },
        symptoms: form.symptoms,
        severitySummary: form.severitySummary,
        assessmentNotes: form.assessmentNotes,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Triage Assessment Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Triage Assessment &amp; Priority Classification
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Assigning Level 1 automatically triggers a Critical Alert and
            elevates the patient to top of the Emergency Queue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Select Emergency Case *</label>
            <select
              value={effectiveEmergencyId}
              onChange={(e) => setSelectedEmergencyId(e.target.value)}
              className={INPUT_CLASS}
            >
              {registrations.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.id} — {reg.patientName} ({reg.patientId}) •{" "}
                  {reg.triageLevel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Triage Priority Level *</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {TRIAGE_LEVELS.map((lvl) => {
                const selected = form.triageLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    disabled={!canWrite}
                    onClick={() => updateField("triageLevel", lvl)}
                    className={`rounded-[16px] px-3 py-2 text-center text-[11px] font-semibold transition ${
                      selected
                        ? `${getEmergencyBadgeClass(lvl)} ring-2 ring-[#181C1E]`
                        : "bg-white text-[#4A595F] hover:bg-[#F6F9FA]"
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={LABEL_CLASS}>Blood Pressure</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.bloodPressure}
                onChange={(e) => updateField("bloodPressure", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Heart Rate</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.heartRate}
                onChange={(e) => updateField("heartRate", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Resp. Rate</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.respiratoryRate}
                onChange={(e) => updateField("respiratoryRate", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>SpO2</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.spo2}
                onChange={(e) => updateField("spo2", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Temperature</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.temperature}
                onChange={(e) => updateField("temperature", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>GCS Score</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.gcsScore}
                onChange={(e) => updateField("gcsScore", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="col-span-2">
              <label className={LABEL_CLASS}>Pain Score</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.painScore}
                onChange={(e) => updateField("painScore", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Observed Symptoms *</label>
            <textarea
              rows={2}
              required
              disabled={!canWrite}
              value={form.symptoms}
              onChange={(e) => updateField("symptoms", e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Severity Summary</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.severitySummary}
                onChange={(e) => updateField("severitySummary", e.target.value)}
                placeholder="e.g., Immediate airway/hemodynamic risk"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Triage Assessment Notes</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.assessmentNotes}
                onChange={(e) => updateField("assessmentNotes", e.target.value)}
                placeholder="Initial nursing/triage interventions"
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
              {submitting
                ? "Saving..."
                : existingTriage
                  ? "Update Triage Assessment"
                  : "Save Triage Assessment"}
            </button>
          </div>
        </form>
      </div>

      {/* Recorded Triage Assessments */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Completed Triage Assessments
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Click any assessment to revise vitals or re-classify priority.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {triages.length} assessed
          </span>
        </div>

        <div className="space-y-3">
          {triages.map((tri) => (
            <button
              key={tri.id}
              type="button"
              onClick={() => setSelectedEmergencyId(tri.emergencyId)}
              className={`w-full rounded-[20px] border p-4 text-left transition ${
                tri.emergencyId === effectiveEmergencyId
                  ? "border-[#4A90A4] bg-white"
                  : "border-white/90 bg-[#F8FAFA] hover:bg-white"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#14191B]">
                  {tri.emergencyId} • {tri.patientId}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getEmergencyBadgeClass(tri.triageLevel)}`}
                >
                  {tri.triageLevel}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[#546369]">
                BP {tri.vitals.bloodPressure} • HR {tri.vitals.heartRate} • SpO2{" "}
                {tri.vitals.spo2} • GCS {tri.vitals.gcsScore}
              </p>
              <p className="mt-1 text-xs text-[#6B7A80]">{tri.symptoms}</p>
              <p className="mt-1 text-[11px] text-[#839298]">
                Assessed by {tri.assessedBy} • {formatTimeShort(tri.updatedAt)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
