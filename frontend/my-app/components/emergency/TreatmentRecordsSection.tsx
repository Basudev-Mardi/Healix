"use client";

import React, { useState } from "react";
import type {
  EmergencyRegistration,
  EmergencyStaffMember,
  EmergencyTreatmentRecord,
  TreatmentStatus,
} from "@/lib/emergency/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatTimeShort,
  getEmergencyBadgeClass,
} from "./ui";

interface TreatmentRecordsSectionProps {
  registrations: EmergencyRegistration[];
  staff: EmergencyStaffMember[];
  treatments: EmergencyTreatmentRecord[];
  preselectedEmergencyId?: string;
  canWrite: boolean;
  onCreateTreatment: (payload: {
    emergencyId: string;
    attendingDoctor: string;
    emergencyStaffInvolved: string;
    vitals: {
      bloodPressure: string;
      heartRate: string;
      spo2: string;
      temperature: string;
    };
    diagnosis: string;
    observations: string;
    treatmentsAndProcedures: string;
    medicationsAdministered: string;
    status: TreatmentStatus;
    outcome: string;
  }) => Promise<boolean>;
}

const TREATMENT_STATUSES: TreatmentStatus[] = [
  "Ongoing",
  "Stabilized",
  "Admitted / Transferred",
  "Discharged",
  "Deceased",
];

export function TreatmentRecordsSection({
  registrations,
  staff,
  treatments,
  preselectedEmergencyId,
  canWrite,
  onCreateTreatment,
}: TreatmentRecordsSectionProps) {
  const [emergencyId, setEmergencyId] = useState(
    preselectedEmergencyId || registrations[0]?.id || ""
  );
  const [attendingDoctor, setAttendingDoctor] = useState(
    staff[0]?.name ?? "Dr. Arjun Sen"
  );
  const [emergencyStaffInvolved, setEmergencyStaffInvolved] = useState(
    "Nurse Rohan Das"
  );
  const [vitals, setVitals] = useState({
    bloodPressure: "118/76 mmHg",
    heartRate: "86 bpm",
    spo2: "97%",
    temperature: "98.6 °F",
  });
  const [diagnosis, setDiagnosis] = useState("");
  const [observations, setObservations] = useState("");
  const [treatmentsAndProcedures, setTreatmentsAndProcedures] = useState("");
  const [medicationsAdministered, setMedicationsAdministered] = useState("");
  const [status, setStatus] = useState<TreatmentStatus>("Ongoing");
  const [outcome, setOutcome] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveEmergencyId =
    preselectedEmergencyId &&
    registrations.some((r) => r.id === preselectedEmergencyId)
      ? preselectedEmergencyId
      : registrations.some((r) => r.id === emergencyId)
        ? emergencyId
        : (registrations[0]?.id ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveEmergencyId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateTreatment({
        emergencyId: effectiveEmergencyId,
        attendingDoctor,
        emergencyStaffInvolved,
        vitals,
        diagnosis,
        observations,
        treatmentsAndProcedures,
        medicationsAdministered,
        status,
        outcome,
      });
      if (ok) {
        setDiagnosis("");
        setObservations("");
        setTreatmentsAndProcedures("");
        setMedicationsAdministered("");
        setOutcome("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Record Treatment Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Record Emergency Treatment
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Document diagnosis, procedures, medications, attending staff, and
            treatment outcome.
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Attending Doctor *</label>
              <select
                disabled={!canWrite}
                value={attendingDoctor}
                onChange={(e) => setAttendingDoctor(e.target.value)}
                className={INPUT_CLASS}
              >
                {staff
                  .filter((s) => s.role.toLowerCase().includes("doctor") || s.role.toLowerCase().includes("physician") || s.role.toLowerCase().includes("surgeon"))
                  .map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.specialty})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Emergency Staff Involved</label>
              <input
                type="text"
                disabled={!canWrite}
                value={emergencyStaffInvolved}
                onChange={(e) => setEmergencyStaffInvolved(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              <label className={LABEL_CLASS}>SpO2</label>
              <input
                type="text"
                disabled={!canWrite}
                value={vitals.spo2}
                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
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
          </div>

          <div>
            <label className={LABEL_CLASS}>Emergency Diagnosis *</label>
            <input
              type="text"
              required
              disabled={!canWrite}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Working or confirmed emergency diagnosis"
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>
                Treatments &amp; Procedures *
              </label>
              <textarea
                rows={3}
                required
                disabled={!canWrite}
                value={treatmentsAndProcedures}
                onChange={(e) => setTreatmentsAndProcedures(e.target.value)}
                placeholder="IV access, intubation, splinting, fluid resuscitation..."
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Medications Administered</label>
              <textarea
                rows={3}
                disabled={!canWrite}
                value={medicationsAdministered}
                onChange={(e) => setMedicationsAdministered(e.target.value)}
                placeholder="Drug name, dose, route, time..."
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Clinical Observations</label>
            <textarea
              rows={2}
              disabled={!canWrite}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Response to treatment, serial exam updates..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Treatment Status</label>
              <select
                disabled={!canWrite}
                value={status}
                onChange={(e) => setStatus(e.target.value as TreatmentStatus)}
                className={INPUT_CLASS}
              >
                {TREATMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Outcome / Disposition</label>
              <input
                type="text"
                disabled={!canWrite}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="e.g., Stabilized for ICU transfer / Discharged"
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
              {submitting ? "Saving..." : "Save Treatment Record"}
            </button>
          </div>
        </form>
      </div>

      {/* Chronological Treatment History */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Emergency Treatment History
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Timestamped procedures, medications, vitals, and outcomes.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {treatments.length} entries
          </span>
        </div>

        <div className="space-y-3">
          {treatments.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No treatment records documented yet.
            </p>
          ) : (
            treatments.map((rec) => (
              <div
                key={rec.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {rec.id}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#546369]">
                      {rec.emergencyId} • {rec.patientId}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getEmergencyBadgeClass(rec.status)}`}
                  >
                    {rec.status}
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {rec.diagnosis}
                </p>
                <p className="text-[#546369]">
                  <strong>Doctor:</strong> {rec.attendingDoctor} •{" "}
                  <strong>Staff:</strong> {rec.emergencyStaffInvolved}
                </p>

                <div className="mt-2 grid grid-cols-2 gap-2 rounded-[14px] bg-white p-2.5 text-[11px] text-[#546369] sm:grid-cols-4">
                  <span>BP: {rec.vitals.bloodPressure}</span>
                  <span>HR: {rec.vitals.heartRate}</span>
                  <span>SpO2: {rec.vitals.spo2}</span>
                  <span>Temp: {rec.vitals.temperature}</span>
                </div>

                <p className="mt-2 text-[#4C5B61]">
                  <strong>Procedures:</strong> {rec.treatmentsAndProcedures}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Medications:</strong> {rec.medicationsAdministered}
                </p>
                {rec.observations && (
                  <p className="mt-1 text-[#6B7A80]">
                    <strong>Observations:</strong> {rec.observations}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6ECEE] pt-2 text-[11px] text-[#7D8C92]">
                  <span>Outcome: {rec.outcome}</span>
                  <span>{formatTimeShort(rec.recordedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
