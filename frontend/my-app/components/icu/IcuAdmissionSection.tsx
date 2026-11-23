"use client";

import React, { useMemo, useState } from "react";
import type {
  IcuAdmission,
  IcuBed,
  IcuDoctor,
  IcuPatient,
} from "@/lib/icu/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getIcuBadgeClass,
} from "./ui";

interface IcuAdmissionSectionProps {
  patients: IcuPatient[];
  doctors: IcuDoctor[];
  icuBeds: IcuBed[];
  admissions: IcuAdmission[];
  canAdmit: boolean;
  onAdmit: (payload: {
    mode: "existing" | "new";
    existingPatientId?: string;
    newPatient?: {
      fullName: string;
      dateOfBirth: string;
      gender: string;
      phone: string;
      bloodGroup: string;
      allergies: string;
    };
    reason: string;
    diagnosis: string;
    referringDoctor: string;
    bedId: string;
    careTeam: string;
  }) => Promise<boolean>;
  onNavigateAdmission: (
    tab: "monitoring" | "vitals" | "notes" | "ventilator" | "medications" | "disposition",
    admissionId: string
  ) => void;
}

export function IcuAdmissionSection({
  patients,
  doctors,
  icuBeds,
  admissions,
  canAdmit,
  onAdmit,
  onNavigateAdmission,
}: IcuAdmissionSectionProps) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [existingPatientId, setExistingPatientId] = useState(
    patients[0]?.id ?? ""
  );
  const [newPatient, setNewPatient] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "Male",
    phone: "",
    bloodGroup: "O+",
    allergies: "None",
  });
  const [referringDoctor, setReferringDoctor] = useState(
    doctors[0]?.name ?? "Dr. Lin Chen"
  );
  const [bedId, setBedId] = useState("");
  const [careTeam, setCareTeam] = useState(
    "Dr. Arjun Sen (Intensivist), ICU Nursing Team"
  );
  const [diagnosis, setDiagnosis] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === existingPatientId) ?? null,
    [patients, existingPatientId]
  );

  const availableIcuBeds = useMemo(
    () => icuBeds.filter((b) => b.status === "Available"),
    [icuBeds]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canAdmit || !bedId) return;
    setSubmitting(true);
    try {
      const ok = await onAdmit({
        mode,
        existingPatientId: mode === "existing" ? existingPatientId : undefined,
        newPatient: mode === "new" ? newPatient : undefined,
        reason,
        diagnosis,
        referringDoctor,
        bedId,
        careTeam,
      });
      if (ok) {
        setBedId("");
        setDiagnosis("");
        setReason("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* ICU Admission Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              ICU Patient Admission
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Admit new or existing patients to an available ICU bed and assign
              a critical care team.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-white p-1">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                mode === "existing"
                  ? "bg-[#181C1E] text-white"
                  : "text-[#5D6C72]"
              }`}
            >
              Existing Patient
            </button>
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                mode === "new" ? "bg-[#181C1E] text-white" : "text-[#5D6C72]"
              }`}
            >
              New Patient
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "existing" ? (
            <div className="space-y-2.5">
              <div>
                <label className={LABEL_CLASS}>Select Patient *</label>
                <select
                  required
                  disabled={!canAdmit}
                  value={existingPatientId}
                  onChange={(e) => setExistingPatientId(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} — {p.fullName} ({p.gender}, {p.phone})
                    </option>
                  ))}
                </select>
              </div>
              {selectedPatient && (
                <div className="rounded-[16px] bg-white px-3.5 py-2.5 text-xs text-[#546369]">
                  DOB: <strong>{selectedPatient.dateOfBirth}</strong> • Blood:{" "}
                  <strong>{selectedPatient.bloodGroup}</strong> • Allergies:{" "}
                  <strong className="text-[#EF5B3A]">
                    {selectedPatient.allergies}
                  </strong>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 rounded-[20px] bg-[#F8FAFA] p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Full Name *</label>
                <input
                  type="text"
                  required
                  disabled={!canAdmit}
                  value={newPatient.fullName}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, fullName: e.target.value })
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Date of Birth *</label>
                <input
                  type="date"
                  required
                  disabled={!canAdmit}
                  value={newPatient.dateOfBirth}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
                      dateOfBirth: e.target.value,
                    })
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Phone *</label>
                <input
                  type="tel"
                  required
                  disabled={!canAdmit}
                  value={newPatient.phone}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, phone: e.target.value })
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Gender</label>
                <select
                  disabled={!canAdmit}
                  value={newPatient.gender}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, gender: e.target.value })
                  }
                  className={INPUT_CLASS}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Allergies</label>
                <input
                  type="text"
                  disabled={!canAdmit}
                  value={newPatient.allergies}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, allergies: e.target.value })
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Referring Doctor *</label>
              <select
                disabled={!canAdmit}
                value={referringDoctor}
                onChange={(e) => setReferringDoctor(e.target.value)}
                className={INPUT_CLASS}
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Assign Available ICU Bed * ({availableIcuBeds.length} open)
              </label>
              <select
                required
                disabled={!canAdmit}
                value={bedId}
                onChange={(e) => setBedId(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Select ICU bed</option>
                {icuBeds.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                    disabled={b.status !== "Available"}
                  >
                    {b.bedNumber} — {b.room} [{b.status}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Responsible Care Team *</label>
            <input
              type="text"
              required
              disabled={!canAdmit}
              value={careTeam}
              onChange={(e) => setCareTeam(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Primary ICU Diagnosis *</label>
            <input
              type="text"
              required
              disabled={!canAdmit}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g., Septic shock, ARDS, Post-CABG critical care"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Admission Reason *</label>
            <textarea
              rows={2}
              required
              disabled={!canAdmit}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Clinical indication for ICU admission..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canAdmit || !bedId || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Admitting..." : "Admit to ICU & Generate ICU ID"}
            </button>
          </div>
        </form>
      </div>

      {/* ICU Census */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              ICU Admissions Census
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Jump directly to monitoring, vitals, notes, ventilator, MAR, or
              disposition.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {admissions.length} total
          </span>
        </div>

        <div className="space-y-3">
          {admissions.map((adm) => (
            <div
              key={adm.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {adm.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getIcuBadgeClass(adm.status)}`}
                  >
                    {adm.status}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#4A90A4]">
                  {adm.bedLabel}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {adm.patientName}{" "}
                <span className="font-normal text-[#738288]">
                  ({adm.patientId})
                </span>
              </p>
              <p className="text-[#6B7A80]">
                Referring: {adm.referringDoctor} • Team: {adm.careTeam} •{" "}
                {formatDateTime(adm.admissionDate)}
              </p>
              <p className="mt-1 text-[#4C5B61]">
                <strong>Diagnosis:</strong> {adm.diagnosis}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#E6ECEE] pt-3">
                {(
                  [
                    { tab: "monitoring", label: "Monitoring" },
                    { tab: "vitals", label: "Vitals" },
                    { tab: "notes", label: "Care Notes" },
                    { tab: "ventilator", label: "Ventilator" },
                    { tab: "medications", label: "Medications" },
                    { tab: "disposition", label: "Transfer / Discharge" },
                  ] as const
                ).map((a) => (
                  <button
                    key={a.tab}
                    type="button"
                    onClick={() => onNavigateAdmission(a.tab, adm.id)}
                    className="rounded-full bg-[#EDF2F3] px-2.5 py-1 text-[11px] font-semibold text-[#3C4A50] hover:bg-[#DCE4E7]"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
