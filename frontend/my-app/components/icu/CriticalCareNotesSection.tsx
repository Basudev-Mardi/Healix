"use client";

import React, { useMemo, useState } from "react";
import type { IcuAdmission, IcuCareNote } from "@/lib/icu/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getIcuBadgeClass,
} from "./ui";

interface CriticalCareNotesSectionProps {
  admissions: IcuAdmission[];
  careNotes: IcuCareNote[];
  preselectedAdmissionId?: string;
  canWrite: boolean;
  onCreateNote: (payload: {
    icuAdmissionId: string;
    authorName: string;
    patientCondition: string;
    clinicalObservations: string;
    diagnosisUpdate: string;
    treatmentUpdate: string;
  }) => Promise<boolean>;
}

export function CriticalCareNotesSection({
  admissions,
  careNotes,
  preselectedAdmissionId,
  canWrite,
  onCreateNote,
}: CriticalCareNotesSectionProps) {
  const [admissionId, setAdmissionId] = useState(
    preselectedAdmissionId || admissions[0]?.id || ""
  );
  const [authorName, setAuthorName] = useState("Dr. Arjun Sen");
  const [patientCondition, setPatientCondition] = useState("Stabilizing");
  const [clinicalObservations, setClinicalObservations] = useState("");
  const [diagnosisUpdate, setDiagnosisUpdate] = useState("");
  const [treatmentUpdate, setTreatmentUpdate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveAdmissionId =
    preselectedAdmissionId &&
    admissions.some((a) => a.id === preselectedAdmissionId)
      ? preselectedAdmissionId
      : admissions.some((a) => a.id === admissionId)
        ? admissionId
        : (admissions[0]?.id ?? "");

  const filteredNotes = useMemo(
    () =>
      careNotes.filter(
        (n) => !effectiveAdmissionId || n.icuAdmissionId === effectiveAdmissionId
      ),
    [careNotes, effectiveAdmissionId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveAdmissionId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateNote({
        icuAdmissionId: effectiveAdmissionId,
        authorName,
        patientCondition,
        clinicalObservations,
        diagnosisUpdate,
        treatmentUpdate,
      });
      if (ok) {
        setClinicalObservations("");
        setDiagnosisUpdate("");
        setTreatmentUpdate("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Add Critical Care Note
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Append-only clinical log for ICU doctors and nurses; previous notes
            are preserved immutably.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>ICU Admission *</label>
            <select
              value={effectiveAdmissionId}
              onChange={(e) => setAdmissionId(e.target.value)}
              className={INPUT_CLASS}
            >
              {admissions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.patientName} ({a.bedLabel})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Author Name *</label>
              <input
                type="text"
                required
                disabled={!canWrite}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Patient Condition *</label>
              <select
                disabled={!canWrite}
                value={patientCondition}
                onChange={(e) => setPatientCondition(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="Critical">Critical</option>
                <option value="Unstable">Unstable</option>
                <option value="Guarded">Guarded</option>
                <option value="Stabilizing">Stabilizing</option>
                <option value="Stable">Stable</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Clinical Observations *</label>
            <textarea
              rows={3}
              required
              disabled={!canWrite}
              value={clinicalObservations}
              onChange={(e) => setClinicalObservations(e.target.value)}
              placeholder="Hemodynamics, respiratory mechanics, organ function..."
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Diagnosis Update</label>
            <input
              type="text"
              disabled={!canWrite}
              value={diagnosisUpdate}
              onChange={(e) => setDiagnosisUpdate(e.target.value)}
              placeholder="Updated working diagnosis or complications"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Treatment Update</label>
            <textarea
              rows={2}
              disabled={!canWrite}
              value={treatmentUpdate}
              onChange={(e) => setTreatmentUpdate(e.target.value)}
              placeholder="Infusion titration, weaning plan, consult orders..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canWrite || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Saving..." : "Append Critical Care Note"}
            </button>
          </div>
        </form>
      </div>

      {/* Chronological Notes */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Chronological Critical Care Notes
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Immutable clinical notes for {effectiveAdmissionId || "all cases"}.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {filteredNotes.length} notes
          </span>
        </div>

        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {note.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getIcuBadgeClass(note.patientCondition)}`}
                  >
                    {note.patientCondition}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                    {note.authorName} ({note.authorRole})
                  </span>
                </div>
                <span className="text-[11px] text-[#7A898F]">
                  {formatDateTime(note.recordedAt)}
                </span>
              </div>

              <p className="mt-2 text-[#4C5B61]">
                <strong>Observations:</strong> {note.clinicalObservations}
              </p>
              {note.diagnosisUpdate && (
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Diagnosis Update:</strong> {note.diagnosisUpdate}
                </p>
              )}
              {note.treatmentUpdate && (
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Treatment Update:</strong> {note.treatmentUpdate}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
