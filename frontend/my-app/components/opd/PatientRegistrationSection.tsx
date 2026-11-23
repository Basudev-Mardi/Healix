"use client";

import React, { useMemo, useState } from "react";
import type { Gender, OpdPatient } from "@/lib/opd/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
} from "./ui";

interface PatientRegistrationSectionProps {
  patients: OpdPatient[];
  canWrite: boolean;
  onRegister: (payload: {
    fullName: string;
    dateOfBirth: string;
    gender: Gender;
    phone: string;
    email: string;
    address: string;
    bloodGroup: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    allergies: string;
  }) => Promise<OpdPatient | null>;
  onStartAppointment: (patientId: string) => void;
  onStartWalkIn: (patientId: string) => void;
  onViewHistory: (patientId: string) => void;
}

const INITIAL_FORM = {
  fullName: "",
  dateOfBirth: "",
  gender: "Female" as Gender,
  phone: "",
  email: "",
  address: "",
  bloodGroup: "O+",
  emergencyContactName: "",
  emergencyContactPhone: "",
  allergies: "None",
};

export function PatientRegistrationSection({
  patients,
  canWrite,
  onRegister,
  onStartAppointment,
  onStartWalkIn,
  onViewHistory,
}: PatientRegistrationSectionProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    patients[0]?.id ?? ""
  );

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  const selectedPatient = useMemo(
    () =>
      patients.find((p) => p.id === selectedPatientId) ??
      filteredPatients[0] ??
      null,
    [patients, selectedPatientId, filteredPatients]
  );

  // Live duplicate preview before submission
  const potentialDuplicate = useMemo(() => {
    const cleanPhone = form.phone.replace(/\D/g, "");
    const cleanName = form.fullName.trim().toLowerCase();
    if (cleanPhone.length < 7 && (!cleanName || !form.dateOfBirth)) return null;
    return (
      patients.find(
        (p) =>
          (cleanPhone.length >= 7 &&
            p.phone.replace(/\D/g, "") === cleanPhone) ||
          (cleanName &&
            form.dateOfBirth &&
            p.fullName.trim().toLowerCase() === cleanName &&
            p.dateOfBirth === form.dateOfBirth)
      ) ?? null
    );
  }, [form.phone, form.fullName, form.dateOfBirth, patients]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setSubmitting(true);
    try {
      const created = await onRegister(form);
      if (created) {
        setForm(INITIAL_FORM);
        setSelectedPatientId(created.id);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Registration Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              New Patient Registration
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Captures demographics, checks duplicates, and generates a unique
              Patient ID.
            </p>
          </div>
          {!canWrite && (
            <span className="rounded-full bg-[#DDE5E7] px-3 py-1 text-[11px] font-medium text-[#4B5A60]">
              Read-only
            </span>
          )}
        </div>

        {potentialDuplicate && (
          <div className="mb-4 rounded-[18px] border border-[#EF5B3A]/35 bg-[#EF5B3A]/10 px-4 py-3 text-xs text-[#9C2E15]">
            <p className="font-semibold">Potential Duplicate Patient Found</p>
            <p className="mt-0.5">
              {potentialDuplicate.fullName} ({potentialDuplicate.id}) already
              matches this phone or name &amp; DOB.
            </p>
            <button
              type="button"
              onClick={() => setSelectedPatientId(potentialDuplicate.id)}
              className="mt-2 font-semibold underline"
            >
              Open existing record ({potentialDuplicate.id})
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Full Name *</label>
              <input
                type="text"
                required
                disabled={!canWrite}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g., Priya Nair"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Date of Birth *</label>
              <input
                type="date"
                required
                disabled={!canWrite}
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm({ ...form, dateOfBirth: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Gender *</label>
              <select
                disabled={!canWrite}
                value={form.gender}
                onChange={(e) =>
                  setForm({ ...form, gender: e.target.value as Gender })
                }
                className={INPUT_CLASS}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Phone Number *</label>
              <input
                type="tel"
                required
                disabled={!canWrite}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g., 9876501234"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Blood Group</label>
              <select
                disabled={!canWrite}
                value={form.bloodGroup}
                onChange={(e) =>
                  setForm({ ...form, bloodGroup: e.target.value })
                }
                className={INPUT_CLASS}
              >
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "Unknown"].map(
                  (bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Email</label>
              <input
                type="email"
                disabled={!canWrite}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="patient@example.com"
                className={INPUT_CLASS}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Residential Address</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, City"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Emergency Contact Name</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.emergencyContactName}
                onChange={(e) =>
                  setForm({ ...form, emergencyContactName: e.target.value })
                }
                placeholder="Contact person"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Emergency Contact Phone</label>
              <input
                type="tel"
                disabled={!canWrite}
                value={form.emergencyContactPhone}
                onChange={(e) =>
                  setForm({ ...form, emergencyContactPhone: e.target.value })
                }
                placeholder="Emergency phone"
                className={INPUT_CLASS}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Known Allergies</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.allergies}
                onChange={(e) =>
                  setForm({ ...form, allergies: e.target.value })
                }
                placeholder="e.g., Penicillin, None"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!canWrite || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Registering..." : "Register Patient & Generate ID"}
            </button>
          </div>
        </form>
      </div>

      {/* Patient Directory & Record Retrieval */}
      <div className="flex flex-col gap-6 xl:col-span-7">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#14191B]">
                Patient Directory
              </h2>
              <p className="text-xs text-[#6B7A80]">
                Search by Patient ID, name, or phone number ({patients.length}{" "}
                registered).
              </p>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PAT ID, name, or phone..."
              className="w-full rounded-full border border-white bg-white px-4 py-2 text-xs text-[#14191B] placeholder:text-[#8E9CA1] focus:border-[#4A90A4] focus:outline-none sm:w-64"
            />
          </div>

          <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
            {filteredPatients.length === 0 ? (
              <p className="rounded-[18px] bg-[#F8FAFA] p-5 text-center text-xs text-[#738288]">
                No matching patient records found.
              </p>
            ) : (
              filteredPatients.map((patient) => {
                const isSelected = selectedPatient?.id === patient.id;
                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={`flex w-full items-center justify-between gap-4 rounded-[20px] border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-[#4A90A4] bg-white shadow-xs"
                        : "border-white/90 bg-[#F8FAFA] hover:bg-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#14191B]">
                        {patient.fullName}
                      </p>
                      <p className="text-xs text-[#6F7E84]">
                        {patient.id} • {patient.gender} • DOB{" "}
                        {patient.dateOfBirth}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex rounded-full bg-[#8FC1CE] px-2.5 py-0.5 text-[11px] font-medium text-white">
                        {patient.bloodGroup}
                      </span>
                      <p className="mt-1 text-[11px] text-[#76868C]">
                        {patient.phone}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Patient Summary Card */}
        {selectedPatient && (
          <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-[#181C1E] px-3 py-1 text-[11px] font-semibold text-white">
                  {selectedPatient.id}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-[#14191B]">
                  {selectedPatient.fullName}
                </h3>
                <p className="text-xs text-[#6B7A80]">
                  {selectedPatient.gender} • DOB {selectedPatient.dateOfBirth} •
                  Blood Group {selectedPatient.bloodGroup}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onStartAppointment(selectedPatient.id)}
                  className={ACCENT_BTN_CLASS}
                >
                  Book Appointment
                </button>
                <button
                  type="button"
                  onClick={() => onStartWalkIn(selectedPatient.id)}
                  className={SECONDARY_BTN_CLASS}
                >
                  Register Walk-in
                </button>
                <button
                  type="button"
                  onClick={() => onViewHistory(selectedPatient.id)}
                  className={SECONDARY_BTN_CLASS}
                >
                  History
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 rounded-[20px] bg-white p-4 text-xs sm:grid-cols-2">
              <div>
                <p className="text-[#7A898F]">Phone &amp; Email</p>
                <p className="mt-0.5 font-medium text-[#14191B]">
                  {selectedPatient.phone}
                  {selectedPatient.email ? ` • ${selectedPatient.email}` : ""}
                </p>
              </div>
              <div>
                <p className="text-[#7A898F]">Address</p>
                <p className="mt-0.5 font-medium text-[#14191B]">
                  {selectedPatient.address || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-[#7A898F]">Emergency Contact</p>
                <p className="mt-0.5 font-medium text-[#14191B]">
                  {selectedPatient.emergencyContactName
                    ? `${selectedPatient.emergencyContactName} (${selectedPatient.emergencyContactPhone})`
                    : "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-[#7A898F]">Allergies</p>
                <p className="mt-0.5 font-medium text-[#EF5B3A]">
                  {selectedPatient.allergies || "None"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
