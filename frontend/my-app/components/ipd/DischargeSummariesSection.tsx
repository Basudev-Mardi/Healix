"use client";

import React, { useMemo, useState } from "react";
import type {
  IpdAdmission,
  IpdDischargeSummary,
  IpdDoctor,
} from "@/lib/ipd/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
} from "./ui";

interface DischargeSummariesSectionProps {
  admissions: IpdAdmission[];
  doctors: IpdDoctor[];
  summaries: IpdDischargeSummary[];
  preselectedAdmissionId?: string;
  canWrite: boolean;
  onSaveSummary: (payload: {
    admissionId: string;
    finalDiagnosis: string;
    treatmentReceived: string;
    proceduresPerformed: string;
    clinicalProgress: string;
    dischargeMedications: string;
    followUpInstructions: string;
    recommendations: string;
    responsibleDoctor: string;
  }) => Promise<boolean>;
}

export function DischargeSummariesSection({
  admissions,
  doctors,
  summaries,
  preselectedAdmissionId,
  canWrite,
  onSaveSummary,
}: DischargeSummariesSectionProps) {
  const [admissionId, setAdmissionId] = useState(
    preselectedAdmissionId || admissions[0]?.id || ""
  );
  const [submitting, setSubmitting] = useState(false);

  const effectiveAdmissionId =
    preselectedAdmissionId &&
    admissions.some((a) => a.id === preselectedAdmissionId)
      ? preselectedAdmissionId
      : admissions.some((a) => a.id === admissionId)
        ? admissionId
        : (admissions[0]?.id ?? "");

  const activeAdmission =
    admissions.find((a) => a.id === effectiveAdmissionId) ?? null;
  const existingSummary =
    summaries.find((s) => s.admissionId === effectiveAdmissionId) ?? null;

  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        finalDiagnosis: string;
        treatmentReceived: string;
        proceduresPerformed: string;
        clinicalProgress: string;
        dischargeMedications: string;
        followUpInstructions: string;
        recommendations: string;
        responsibleDoctor: string;
      }
    >
  >({});

  const form = useMemo(() => {
    if (drafts[effectiveAdmissionId]) return drafts[effectiveAdmissionId];
    if (existingSummary) {
      return {
        finalDiagnosis: existingSummary.finalDiagnosis,
        treatmentReceived: existingSummary.treatmentReceived,
        proceduresPerformed: existingSummary.proceduresPerformed,
        clinicalProgress: existingSummary.clinicalProgress,
        dischargeMedications: existingSummary.dischargeMedications,
        followUpInstructions: existingSummary.followUpInstructions,
        recommendations: existingSummary.recommendations,
        responsibleDoctor: existingSummary.responsibleDoctor,
      };
    }
    return {
      finalDiagnosis: activeAdmission?.diagnosis ?? "",
      treatmentReceived: "",
      proceduresPerformed: "None",
      clinicalProgress: "",
      dischargeMedications: "",
      followUpInstructions: "",
      recommendations: "",
      responsibleDoctor:
        activeAdmission?.admittingDoctor ?? doctors[0]?.name ?? "Dr. Rajesh Mehta",
    };
  }, [drafts, effectiveAdmissionId, existingSummary, activeAdmission, doctors]);

  function updateField(field: keyof typeof form, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [effectiveAdmissionId]: { ...form, [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveAdmissionId) return;
    setSubmitting(true);
    try {
      await onSaveSummary({
        admissionId: effectiveAdmissionId,
        ...form,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Generate / Update Discharge Summary */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Generate Discharge Summary
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Complete clinical discharge summary with diagnosis, hospital course,
            medications, follow-up, and doctor authorization.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Inpatient Admission *</label>
              <select
                value={effectiveAdmissionId}
                onChange={(e) => setAdmissionId(e.target.value)}
                className={INPUT_CLASS}
              >
                {admissions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.patientName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Responsible Doctor *</label>
              <select
                disabled={!canWrite}
                value={form.responsibleDoctor}
                onChange={(e) =>
                  updateField("responsibleDoctor", e.target.value)
                }
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

          <div>
            <label className={LABEL_CLASS}>Final Diagnosis *</label>
            <input
              type="text"
              required
              disabled={!canWrite}
              value={form.finalDiagnosis}
              onChange={(e) => updateField("finalDiagnosis", e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Treatment Received *</label>
              <textarea
                rows={3}
                required
                disabled={!canWrite}
                value={form.treatmentReceived}
                onChange={(e) =>
                  updateField("treatmentReceived", e.target.value)
                }
                placeholder="IV therapies, inpatient course, consultations..."
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Clinical Progress *</label>
              <textarea
                rows={3}
                required
                disabled={!canWrite}
                value={form.clinicalProgress}
                onChange={(e) =>
                  updateField("clinicalProgress", e.target.value)
                }
                placeholder="Recovery milestones and condition at discharge..."
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Procedures Performed</label>
            <input
              type="text"
              disabled={!canWrite}
              value={form.proceduresPerformed}
              onChange={(e) =>
                updateField("proceduresPerformed", e.target.value)
              }
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Discharge Medications *</label>
            <textarea
              rows={2}
              required
              disabled={!canWrite}
              value={form.dischargeMedications}
              onChange={(e) =>
                updateField("dischargeMedications", e.target.value)
              }
              placeholder="Take-home prescriptions with dosage and duration..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Follow-up Instructions *</label>
              <textarea
                rows={2}
                required
                disabled={!canWrite}
                value={form.followUpInstructions}
                onChange={(e) =>
                  updateField("followUpInstructions", e.target.value)
                }
                placeholder="OPD follow-up date, warning signs..."
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Recommendations</label>
              <textarea
                rows={2}
                disabled={!canWrite}
                value={form.recommendations}
                onChange={(e) => updateField("recommendations", e.target.value)}
                placeholder="Diet, activity restrictions, wound care..."
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
                : existingSummary
                  ? "Update & Authorize Summary"
                  : "Save & Authorize Discharge Summary"}
            </button>
          </div>
        </form>
      </div>

      {/* Saved Discharge Summaries Archive */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Saved Discharge Summaries
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Retrieved directly from patient admission records.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {summaries.length} saved
          </span>
        </div>

        <div className="space-y-3">
          {summaries.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No discharge summaries generated yet.
            </p>
          ) : (
            summaries.map((sum) => (
              <article
                key={sum.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {sum.id}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                      {sum.admissionId} • {sum.patientId}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B7A80]">
                    {sum.admissionDate} → {sum.dischargeDate}
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  Final Diagnosis: {sum.finalDiagnosis}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Treatment:</strong> {sum.treatmentReceived}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Clinical Progress:</strong> {sum.clinicalProgress}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Discharge Medications:</strong>{" "}
                  {sum.dischargeMedications}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Follow-up:</strong> {sum.followUpInstructions}
                </p>
                {sum.recommendations && (
                  <p className="mt-1 text-[#6B7A80]">
                    <strong>Recommendations:</strong> {sum.recommendations}
                  </p>
                )}
                <p className="mt-2 border-t border-[#E6ECEE] pt-2 text-[11px] text-[#7A898F]">
                  Doctor: {sum.responsibleDoctor} • Authorized by{" "}
                  {sum.authorizedBy} • {formatDateTime(sum.createdAt)}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
