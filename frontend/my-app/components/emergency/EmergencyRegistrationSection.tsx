"use client";

import React, { useState } from "react";
import type {
  ArrivalMode,
  EmergencyPatientSummary,
  EmergencyRegistration,
  EmergencyType,
  Gender,
} from "@/lib/emergency/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatTimeShort,
  getEmergencyBadgeClass,
  getNowLocalInput,
} from "./ui";

interface EmergencyRegistrationSectionProps {
  patients: EmergencyPatientSummary[];
  registrations: EmergencyRegistration[];
  canWrite: boolean;
  onRegister: (payload: {
    mode: "existing" | "new" | "unknown";
    existingPatientId?: string;
    newPatient?: {
      fullName: string;
      ageOrDob: string;
      gender: Gender;
      phone: string;
      bloodGroup: string;
      allergies: string;
    };
    unknownPatient?: {
      alias: string;
      estimatedAge: string;
      gender: Gender;
      distinguishingMarks: string;
    };
    arrivalTime: string;
    arrivalMode: ArrivalMode;
    emergencyType: EmergencyType;
    presentingComplaints: string;
    assignedBay: string;
  }) => Promise<EmergencyRegistration | null>;
  onOpenTriage: (emergencyId: string) => void;
}

const ARRIVAL_MODES: ArrivalMode[] = [
  "Ambulance",
  "Walk-in",
  "Police / Bystander",
  "External Transfer",
];

const EMERGENCY_TYPES: EmergencyType[] = [
  "Trauma",
  "Cardiac",
  "Respiratory",
  "Neurological / Stroke",
  "Pediatric",
  "Toxicology",
  "General Emergency",
];

export function EmergencyRegistrationSection({
  patients,
  registrations,
  canWrite,
  onRegister,
  onOpenTriage,
}: EmergencyRegistrationSectionProps) {
  const [mode, setMode] = useState<"existing" | "new" | "unknown">("new");
  const [existingPatientId, setExistingPatientId] = useState(
    patients[0]?.id ?? ""
  );
  const [newPatient, setNewPatient] = useState({
    fullName: "",
    ageOrDob: "",
    gender: "Male" as Gender,
    phone: "",
    bloodGroup: "Unknown",
    allergies: "None",
  });
  const [unknownPatient, setUnknownPatient] = useState({
    alias: "",
    estimatedAge: "",
    gender: "Unknown" as Gender,
    distinguishingMarks: "",
  });
  const [arrivalTime, setArrivalTime] = useState(getNowLocalInput());
  const [arrivalMode, setArrivalMode] = useState<ArrivalMode>("Ambulance");
  const [emergencyType, setEmergencyType] = useState<EmergencyType>("Trauma");
  const [assignedBay, setAssignedBay] = useState("");
  const [presentingComplaints, setPresentingComplaints] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setSubmitting(true);
    try {
      const created = await onRegister({
        mode,
        existingPatientId: mode === "existing" ? existingPatientId : undefined,
        newPatient: mode === "new" ? newPatient : undefined,
        unknownPatient: mode === "unknown" ? unknownPatient : undefined,
        arrivalTime: new Date(arrivalTime).toISOString(),
        arrivalMode,
        emergencyType,
        presentingComplaints,
        assignedBay,
      });
      if (created) {
        setPresentingComplaints("");
        setAssignedBay("");
        setNewPatient({
          fullName: "",
          ageOrDob: "",
          gender: "Male",
          phone: "",
          bloodGroup: "Unknown",
          allergies: "None",
        });
        setUnknownPatient({
          alias: "",
          estimatedAge: "",
          gender: "Unknown",
          distinguishingMarks: "",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Intake Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Immediate Emergency Registration
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Supports new, existing, or unknown/unidentified emergency
              arrivals.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-white p-1">
            {(
              [
                { id: "new", label: "New" },
                { id: "existing", label: "Existing" },
                { id: "unknown", label: "Unknown ID" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  mode === opt.id
                    ? "bg-[#181C1E] text-white"
                    : "text-[#5D6C72]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "existing" && (
            <div>
              <label className={LABEL_CLASS}>Select Existing Patient *</label>
              <select
                required
                disabled={!canWrite}
                value={existingPatientId}
                onChange={(e) => setExistingPatientId(e.target.value)}
                className={INPUT_CLASS}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.id}) — {p.phone}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "new" && (
            <div className="grid grid-cols-1 gap-3.5 rounded-[20px] bg-[#F8FAFA] p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Patient Full Name *</label>
                <input
                  type="text"
                  required
                  disabled={!canWrite}
                  value={newPatient.fullName}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, fullName: e.target.value })
                  }
                  placeholder="Full name"
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
                  placeholder="Contact number"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Age or DOB</label>
                <input
                  type="text"
                  disabled={!canWrite}
                  value={newPatient.ageOrDob}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, ageOrDob: e.target.value })
                  }
                  placeholder="e.g., 42 yrs or 1984-06-12"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Gender</label>
                <select
                  disabled={!canWrite}
                  value={newPatient.gender}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
                      gender: e.target.value as Gender,
                    })
                  }
                  className={INPUT_CLASS}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Known Allergies</label>
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

          {mode === "unknown" && (
            <div className="grid grid-cols-1 gap-3.5 rounded-[20px] border border-[#EF5B3A]/30 bg-[#EF5B3A]/6 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-[#9C2E15]">
                  Unidentified Patient Protocol — generates temporary{" "}
                  <code>PAT-UNK-XXXX</code> ID
                </p>
              </div>
              <div>
                <label className={LABEL_CLASS}>Temporary Alias</label>
                <input
                  type="text"
                  disabled={!canWrite}
                  value={unknownPatient.alias}
                  onChange={(e) =>
                    setUnknownPatient({
                      ...unknownPatient,
                      alias: e.target.value,
                    })
                  }
                  placeholder="e.g., Unknown Female #2"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Estimated Age</label>
                <input
                  type="text"
                  disabled={!canWrite}
                  value={unknownPatient.estimatedAge}
                  onChange={(e) =>
                    setUnknownPatient({
                      ...unknownPatient,
                      estimatedAge: e.target.value,
                    })
                  }
                  placeholder="e.g., Est. 30-40 yrs"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Apparent Gender</label>
                <select
                  disabled={!canWrite}
                  value={unknownPatient.gender}
                  onChange={(e) =>
                    setUnknownPatient({
                      ...unknownPatient,
                      gender: e.target.value as Gender,
                    })
                  }
                  className={INPUT_CLASS}
                >
                  <option value="Unknown">Unknown</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Distinguishing Marks</label>
                <input
                  type="text"
                  disabled={!canWrite}
                  value={unknownPatient.distinguishingMarks}
                  onChange={(e) =>
                    setUnknownPatient({
                      ...unknownPatient,
                      distinguishingMarks: e.target.value,
                    })
                  }
                  placeholder="Clothing, location found..."
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Arrival Time *</label>
              <input
                type="datetime-local"
                required
                disabled={!canWrite}
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Arrival Mode *</label>
              <select
                disabled={!canWrite}
                value={arrivalMode}
                onChange={(e) => setArrivalMode(e.target.value as ArrivalMode)}
                className={INPUT_CLASS}
              >
                {ARRIVAL_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Emergency Type *</label>
              <select
                disabled={!canWrite}
                value={emergencyType}
                onChange={(e) =>
                  setEmergencyType(e.target.value as EmergencyType)
                }
                className={INPUT_CLASS}
              >
                {EMERGENCY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Assigned Bay (Optional)</label>
              <input
                type="text"
                disabled={!canWrite}
                value={assignedBay}
                onChange={(e) => setAssignedBay(e.target.value)}
                placeholder="Auto-assigned if blank (e.g., Trauma Bay 2)"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Presenting Complaints *</label>
            <textarea
              rows={3}
              required
              disabled={!canWrite}
              value={presentingComplaints}
              onChange={(e) => setPresentingComplaints(e.target.value)}
              placeholder="Primary emergency complaint, incident summary, initial status..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canWrite || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting
                ? "Registering..."
                : "Register Emergency & Generate EMG ID"}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Emergency Registrations */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Registered Emergency Cases
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Proceed directly from registration to Triage Assessment.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {registrations.length} cases
          </span>
        </div>

        <div className="space-y-3">
          {registrations.map((reg) => (
            <div
              key={reg.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {reg.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getEmergencyBadgeClass(reg.triageLevel)}`}
                    >
                      {reg.triageLevel}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#546369]">
                      {reg.emergencyType}
                    </span>
                    {reg.isUnknownIdentity && (
                      <span className="rounded-full bg-[#EF5B3A]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#A32E14]">
                        Unknown ID
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#14191B]">
                    {reg.patientName}{" "}
                    <span className="font-normal text-[#738288]">
                      ({reg.patientId})
                    </span>
                  </p>
                  <p className="text-xs text-[#6B7A80]">
                    {reg.assignedBay} • {reg.arrivalMode} • Arrived{" "}
                    {formatTimeShort(reg.arrivalTime)}
                  </p>
                  <p className="mt-1 text-xs text-[#4C5B61]">
                    {reg.presentingComplaints}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-medium ${getEmergencyBadgeClass(reg.queueStatus)}`}
                  >
                    {reg.queueStatus}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenTriage(reg.id)}
                    className={ACCENT_BTN_CLASS}
                  >
                    {reg.triageLevel === "Unassessed"
                      ? "Start Triage"
                      : "Update Triage"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
