"use client";

import React, { useMemo, useState } from "react";
import type { IpdAdmission, IpdProgressNote } from "@/lib/ipd/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getIpdBadgeClass,
} from "./ui";

interface DailyProgressNotesSectionProps {
  admissions: IpdAdmission[];
  progressNotes: IpdProgressNote[];
  preselectedAdmissionId?: string;
  canWrite: boolean;
  onCreateNote: (payload: {
    admissionId: string;
    recordedBy: string;
    vitals: {
      bloodPressure: string;
      heartRate: string;
      temperature: string;
      spo2: string;
      respiratoryRate: string;
    };
    symptoms: string;
    observations: string;
    patientCondition: "Stable" | "Improving" | "Guarded" | "Critical";
  }) => Promise<boolean>;
}

export function DailyProgressNotesSection({
  admissions,
  progressNotes,
  preselectedAdmissionId,
  canWrite,
  onCreateNote,
}: DailyProgressNotesSectionProps) {
  const activeAdmissions = useMemo(
    () => admissions.filter((a) => a.status !== "Discharged"),
    [admissions]
  );

  const [admissionId, setAdmissionId] = useState(
    preselectedAdmissionId || activeAdmissions[0]?.id || admissions[0]?.id || ""
  );
  const [recordedBy, setRecordedBy] = useState("Dr. Rajesh Mehta");
  const [vitals, setVitals] = useState({
    bloodPressure: "118/76 mmHg",
    heartRate: "78 bpm",
    temperature: "98.6 °F",
    spo2: "98%",
    respiratoryRate: "16 /min",
  });
  const [symptoms, setSymptoms] = useState("");
  const [observations, setObservations] = useState("");
  const [patientCondition, setPatientCondition] = useState<
    "Stable" | "Improving" | "Guarded" | "Critical"
  >("Stable");
  const [submitting, setSubmitting] = useState(false);

  const effectiveAdmissionId =
    preselectedAdmissionId &&
    admissions.some((a) => a.id === preselectedAdmissionId)
      ? preselectedAdmissionId
      : admissions.some((a) => a.id === admissionId)
        ? admissionId
        : (admissions[0]?.id ?? "");

  const admissionNotes = useMemo(
    () =>
      progressNotes.filter(
        (n) => !effectiveAdmissionId || n.admissionId === effectiveAdmissionId
      ),
    [progressNotes, effectiveAdmissionId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveAdmissionId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateNote({
        admissionId: effectiveAdmissionId,
        recordedBy,
        vitals,
        symptoms,
        observations,
        patientCondition,
      });
      if (ok) {
        setSymptoms("");
        setObservations("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Append-Only Progress Note Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Record Daily Progress Note
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Doctors and nurses log daily observations and vitals. Previous
            entries are preserved immutably.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Inpatient Admission *</label>
            <select
              value={effectiveAdmissionId}
              onChange={(e) => setAdmissionId(e.target.value)}
              className={INPUT_CLASS}
            >
              {admissions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.patientName} ({a.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Clinician Name *</label>
              <input
                type="text"
                required
                disabled={!canWrite}
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Patient Condition *</label>
              <select
                disabled={!canWrite}
                value={patientCondition}
                onChange={(e) =>
                  setPatientCondition(
                    e.target.value as
                      | "Stable"
                      | "Improving"
                      | "Guarded"
                      | "Critical"
                  )
                }
                className={INPUT_CLASS}
              >
                <option value="Stable">Stable</option>
                <option value="Improving">Improving</option>
                <option value="Guarded">Guarded</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className={LABEL_CLASS}>BP</label>
              <input
                type="text"
                disabled={!canWrite}
                value={vitals.bloodPressure}
                onChange={(e) =>
                  setVitals({ ...vitals, bloodPressure: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Heart Rate</label>
              <input
                type="text"
                disabled={!canWrite}
                value={vitals.heartRate}
                onChange={(e) =>
                  setVitals({ ...vitals, heartRate: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Temp</label>
              <input
                type="text"
                disabled={!canWrite}
                value={vitals.temperature}
                onChange={(e) =>
                  setVitals({ ...vitals, temperature: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>SpO2</label>
              <input
                type="text"
                disabled={!canWrite}
                value={vitals.spo2}
                onChange={(e) =>
                  setVitals({ ...vitals, spo2: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
            <div className="col-span-2">
              <label className={LABEL_CLASS}>Resp. Rate</label>
              <input
                type="text"
                disabled={!canWrite}
                value={vitals.respiratoryRate}
                onChange={(e) =>
                  setVitals({ ...vitals, respiratoryRate: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Current Symptoms *</label>
            <textarea
              rows={2}
              required
              disabled={!canWrite}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Pain level, appetite, sleep, symptom progression..."
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Clinical Observations *</label>
            <textarea
              rows={3}
              required
              disabled={!canWrite}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Physical exam, wound status, lab trend, response to therapy..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canWrite || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Recording..." : "Append Progress Note"}
            </button>
          </div>
        </form>
      </div>

      {/* Chronological Progress Notes Log */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Chronological Progress Notes
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Immutable clinical timeline for {effectiveAdmissionId || "all admissions"}.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {admissionNotes.length} entries
          </span>
        </div>

        <div className="space-y-3">
          {admissionNotes.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No progress notes recorded for this admission yet.
            </p>
          ) : (
            admissionNotes.map((note) => (
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
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getIpdBadgeClass(note.patientCondition)}`}
                    >
                      {note.patientCondition}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                      {note.recordedBy} ({note.recordedRole})
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7A898F]">
                    {formatDateTime(note.noteDate)}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-[14px] bg-white p-2.5 text-[11px] text-[#546369] sm:grid-cols-5">
                  <span>BP: {note.vitals.bloodPressure}</span>
                  <span>HR: {note.vitals.heartRate}</span>
                  <span>Temp: {note.vitals.temperature}</span>
                  <span>SpO2: {note.vitals.spo2}</span>
                  <span>RR: {note.vitals.respiratoryRate}</span>
                </div>

                <p className="mt-2 text-[#4C5B61]">
                  <strong>Symptoms:</strong> {note.symptoms}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Observations:</strong> {note.observations}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
