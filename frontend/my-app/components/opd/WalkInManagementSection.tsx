"use client";

import React, { useMemo, useState } from "react";
import type {
  Gender,
  OpdDoctor,
  OpdPatient,
  OpdToken,
  PriorityLevel,
} from "@/lib/opd/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  getStatusPillClass,
} from "./ui";

interface WalkInManagementSectionProps {
  patients: OpdPatient[];
  doctors: OpdDoctor[];
  tokens: OpdToken[];
  preselectedPatientId?: string;
  canWrite: boolean;
  onRegisterWalkIn: (payload: {
    existingPatientId?: string;
    newPatient?: {
      fullName: string;
      dateOfBirth: string;
      gender: Gender;
      phone: string;
      bloodGroup: string;
      allergies: string;
    };
    department: string;
    doctorId: string;
    priority: PriorityLevel;
    reason: string;
  }) => Promise<boolean>;
}

export function WalkInManagementSection({
  patients,
  doctors,
  tokens,
  preselectedPatientId,
  canWrite,
  onRegisterWalkIn,
}: WalkInManagementSectionProps) {
  const departments = useMemo(
    () => Array.from(new Set(doctors.map((d) => d.department))),
    [doctors]
  );

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [existingPatientId, setExistingPatientId] = useState(
    preselectedPatientId || patients[0]?.id || ""
  );
  const [newPatient, setNewPatient] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "Male" as Gender,
    phone: "",
    bloodGroup: "O+",
    allergies: "None",
  });
  const [department, setDepartment] = useState(departments[0] ?? "");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [priority, setPriority] = useState<PriorityLevel>("Normal");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const departmentDoctors = useMemo(
    () => doctors.filter((d) => d.department === department),
    [doctors, department]
  );

  const activeDoctor =
    departmentDoctors.find((d) => d.id === doctorId) ??
    departmentDoctors[0] ??
    null;

  const effectivePatientId =
    preselectedPatientId && patients.some((p) => p.id === preselectedPatientId)
      ? preselectedPatientId
      : existingPatientId;

  const walkInTokens = useMemo(
    () => tokens.filter((t) => t.visitType === "Walk-in").reverse(),
    [tokens]
  );

  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, p])),
    [patients]
  );
  const doctorMap = useMemo(
    () => new Map(doctors.map((d) => [d.id, d])),
    [doctors]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !activeDoctor) return;
    setSubmitting(true);
    try {
      const ok = await onRegisterWalkIn({
        existingPatientId: mode === "existing" ? effectivePatientId : undefined,
        newPatient: mode === "new" ? newPatient : undefined,
        department: activeDoctor.department,
        doctorId: activeDoctor.id,
        priority,
        reason,
      });
      if (ok) {
        setReason("");
        setNewPatient({
          fullName: "",
          dateOfBirth: "",
          gender: "Male",
          phone: "",
          bloodGroup: "O+",
          allergies: "None",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Walk-in Patient Intake
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Assign department &amp; doctor, generate an OPD token, and add
              directly to the live queue.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-white p-1">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
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
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                mode === "new" ? "bg-[#181C1E] text-white" : "text-[#5D6C72]"
              }`}
            >
              New Patient
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "existing" ? (
            <div>
              <label className={LABEL_CLASS}>Select Registered Patient *</label>
              <select
                required
                disabled={!canWrite}
                value={effectivePatientId}
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
          ) : (
            <div className="grid grid-cols-1 gap-4 rounded-[20px] bg-[#F8FAFA] p-4 sm:grid-cols-2">
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
                  placeholder="Patient full name"
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
                <label className={LABEL_CLASS}>Gender *</label>
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
                <label className={LABEL_CLASS}>Phone *</label>
                <input
                  type="tel"
                  required
                  disabled={!canWrite}
                  value={newPatient.phone}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, phone: e.target.value })
                  }
                  placeholder="Phone number"
                  className={INPUT_CLASS}
                />
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={LABEL_CLASS}>Department *</label>
              <select
                required
                disabled={!canWrite}
                value={department}
                onChange={(e) => {
                  const dept = e.target.value;
                  setDepartment(dept);
                  const doc = doctors.find((d) => d.department === dept);
                  if (doc) setDoctorId(doc.id);
                }}
                className={INPUT_CLASS}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Assigned Doctor *</label>
              <select
                required
                disabled={!canWrite}
                value={activeDoctor?.id ?? ""}
                onChange={(e) => setDoctorId(e.target.value)}
                className={INPUT_CLASS}
              >
                {departmentDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Queue Priority</label>
              <select
                disabled={!canWrite}
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className={INPUT_CLASS}
              >
                <option value="Normal">Normal</option>
                <option value="Priority">Priority</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Chief Complaint *</label>
            <input
              type="text"
              required
              disabled={!canWrite}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Acute ankle sprain / high fever"
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
                ? "Adding to Queue..."
                : "Register Walk-in & Issue Token"}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Walk-in Queue Entries */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Active Walk-in Visits
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Walk-ins automatically receive sequential tokens and enter the OPD
              queue.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {walkInTokens.length} walk-ins
          </span>
        </div>

        <div className="space-y-3">
          {walkInTokens.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No walk-in patients registered yet. Use the intake form to add a
              walk-in patient to the queue.
            </p>
          ) : (
            walkInTokens.map((tkn) => {
              const patient = patientMap.get(tkn.patientId);
              const doc = doctorMap.get(tkn.doctorId);
              return (
                <div
                  key={tkn.id}
                  className="flex flex-col justify-between gap-3 rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {tkn.tokenNumber}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusPillClass(tkn.priority)}`}
                      >
                        {tkn.priority}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-[#14191B]">
                      {patient?.fullName ?? tkn.patientId} ({tkn.patientId})
                    </p>
                    <p className="text-xs text-[#6B7A80]">
                      {doc?.name ?? tkn.doctorId} • {tkn.department} • Ref{" "}
                      {tkn.appointmentId}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${getStatusPillClass(tkn.status)}`}
                  >
                    {tkn.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
