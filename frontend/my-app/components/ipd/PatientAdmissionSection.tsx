"use client";

import React, { useMemo, useState } from "react";
import type {
  IpdAdmission,
  IpdAdmissionRequest,
  IpdBed,
  IpdDoctor,
  IpdPatient,
} from "@/lib/ipd/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getIpdBadgeClass,
} from "./ui";

interface PatientAdmissionSectionProps {
  patients: IpdPatient[];
  doctors: IpdDoctor[];
  beds: IpdBed[];
  admissions: IpdAdmission[];
  convertingRequest?: IpdAdmissionRequest | null;
  canWrite: boolean;
  onClearConvertingRequest: () => void;
  onCreateAdmission: (payload: {
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
    admissionRequestId?: string;
    admittingDoctor: string;
    bedId: string;
    reason: string;
    diagnosis: string;
  }) => Promise<boolean>;
  onNavigateAdmission: (
    tab: "transfers" | "progress" | "treatment" | "discharge" | "summary",
    admissionId: string
  ) => void;
}

export function PatientAdmissionSection({
  patients,
  doctors,
  beds,
  admissions,
  convertingRequest,
  canWrite,
  onClearConvertingRequest,
  onCreateAdmission,
  onNavigateAdmission,
}: PatientAdmissionSectionProps) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [patientLookup, setPatientLookup] = useState("");
  const [existingPatientId, setExistingPatientId] = useState(
    patients[0]?.id ?? ""
  );
  const [newPatient, setNewPatient] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "Female",
    phone: "",
    bloodGroup: "O+",
    allergies: "None",
  });
  const [admittingDoctor, setAdmittingDoctor] = useState(
    doctors[0]?.name ?? "Dr. Rajesh Mehta"
  );
  const [bedId, setBedId] = useState("");
  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveMode = convertingRequest ? "existing" : mode;
  const effectivePatientId = convertingRequest
    ? convertingRequest.patientId
    : existingPatientId;
  const effectiveReason = convertingRequest
    ? reason || convertingRequest.reason
    : reason;

  const filteredPatients = useMemo(() => {
    const q = patientLookup.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q)
    );
  }, [patients, patientLookup]);

  const availableBeds = useMemo(
    () => beds.filter((b) => b.status === "Available"),
    [beds]
  );

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === effectivePatientId) ?? null,
    [patients, effectivePatientId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !bedId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateAdmission({
        mode: effectiveMode,
        existingPatientId:
          effectiveMode === "existing" ? effectivePatientId : undefined,
        newPatient: effectiveMode === "new" ? newPatient : undefined,
        admissionRequestId: convertingRequest?.id,
        admittingDoctor,
        bedId,
        reason: effectiveReason,
        diagnosis,
      });
      if (ok) {
        setBedId("");
        setReason("");
        setDiagnosis("");
        onClearConvertingRequest();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Admission Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Inpatient Admission
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Assign department, ward, room, and available bed; occupied beds
              are locked automatically.
            </p>
          </div>
          {!convertingRequest && (
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
          )}
        </div>

        {convertingRequest && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-[18px] border border-[#4A90A4]/40 bg-[#8FC1CE]/15 px-4 py-3 text-xs text-[#174654]">
            <span>
              Converting Approved Request <strong>{convertingRequest.id}</strong>{" "}
              for <strong>{convertingRequest.patientName}</strong> (
              {convertingRequest.department} •{" "}
              {convertingRequest.requestedBedType})
            </span>
            <button
              type="button"
              onClick={onClearConvertingRequest}
              className="font-semibold underline"
            >
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {effectiveMode === "existing" ? (
            <div className="space-y-3">
              {!convertingRequest && (
                <div>
                  <label className={LABEL_CLASS}>
                    Retrieve Patient by ID, Name, or Phone
                  </label>
                  <input
                    type="search"
                    value={patientLookup}
                    onChange={(e) => setPatientLookup(e.target.value)}
                    placeholder="e.g., PAT-2026-0002 or Vikram..."
                    className={INPUT_CLASS}
                  />
                </div>
              )}
              <div>
                <label className={LABEL_CLASS}>Selected Patient *</label>
                <select
                  required
                  disabled={!canWrite || !!convertingRequest}
                  value={effectivePatientId}
                  onChange={(e) => setExistingPatientId(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {filteredPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} — {p.fullName} ({p.gender}, {p.phone})
                    </option>
                  ))}
                </select>
              </div>
              {selectedPatient && (
                <div className="rounded-[16px] bg-white px-3.5 py-2.5 text-xs text-[#546369]">
                  Blood Group: <strong>{selectedPatient.bloodGroup}</strong> •
                  Allergies:{" "}
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
                  disabled={!canWrite}
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
                  disabled={!canWrite}
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
                  disabled={!canWrite}
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
                  disabled={!canWrite}
                  value={newPatient.gender}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, gender: e.target.value })
                  }
                  className={INPUT_CLASS}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Allergies</label>
                <input
                  type="text"
                  disabled={!canWrite}
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
              <label className={LABEL_CLASS}>Admitting Doctor *</label>
              <select
                disabled={!canWrite}
                value={admittingDoctor}
                onChange={(e) => setAdmittingDoctor(e.target.value)}
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
                Assign Available Bed * ({availableBeds.length} open)
              </label>
              <select
                required
                disabled={!canWrite}
                value={bedId}
                onChange={(e) => setBedId(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Select an available bed</option>
                {beds.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                    disabled={b.status !== "Available"}
                  >
                    {b.bedNumber} — {b.ward} / {b.room} ({b.department} •{" "}
                    {b.bedType}) [{b.status}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Admission Diagnosis *</label>
            <input
              type="text"
              required
              disabled={!canWrite}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Primary inpatient diagnosis"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Admission Reason *</label>
            <textarea
              rows={2}
              required
              disabled={!canWrite}
              value={effectiveReason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Clinical indication for inpatient admission..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canWrite || !bedId || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting
                ? "Admitting..."
                : "Admit Patient & Generate Admission ID"}
            </button>
          </div>
        </form>
      </div>

      {/* Inpatient Admissions Census */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Inpatient Admissions Census
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Track admission status, assigned bed, and jump directly to
              clinical workflows.
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
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {adm.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getIpdBadgeClass(adm.status)}`}
                  >
                    {adm.status}
                  </span>
                  {adm.admissionRequestId && (
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                      From {adm.admissionRequestId}
                    </span>
                  )}
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
              <p className="text-xs text-[#6B7A80]">
                {adm.admittingDoctor} • {adm.department} • Admitted{" "}
                {formatDateTime(adm.admissionDate)}
              </p>
              <p className="mt-1 text-xs text-[#4C5B61]">
                <strong>Diagnosis:</strong> {adm.diagnosis}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#E6ECEE] pt-3">
                {(
                  [
                    { tab: "progress", label: "Progress Notes" },
                    { tab: "treatment", label: "Treatment Plan" },
                    { tab: "transfers", label: "Transfer" },
                    { tab: "discharge", label: "Discharge" },
                    { tab: "summary", label: "Summary" },
                  ] as const
                ).map((action) => (
                  <button
                    key={action.tab}
                    type="button"
                    onClick={() => onNavigateAdmission(action.tab, adm.id)}
                    className="rounded-full bg-[#EDF2F3] px-2.5 py-1 text-[11px] font-semibold text-[#3C4A50] hover:bg-[#DCE4E7]"
                  >
                    {action.label}
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
