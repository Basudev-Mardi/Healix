"use client";

import React, { useState } from "react";
import {
  BLOOD_GROUPS,
  type BloodDonor,
  type BloodGroup,
} from "@/lib/blood-bank/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  getBloodBadgeClass,
} from "./ui";

interface DonorRegistrationSectionProps {
  donors: BloodDonor[];
  canManage: boolean;
  onRegisterDonor: (payload: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email: string;
    bloodGroup: BloodGroup;
    weightKg: number;
    hemoglobinGdl: number;
    medicalHistory: string;
  }) => Promise<boolean>;
}

export function DonorRegistrationSection({
  donors,
  canManage,
  onRegisterDonor,
}: DonorRegistrationSectionProps) {
  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "1994-05-15",
    gender: "Male",
    phone: "",
    email: "",
    bloodGroup: "O+" as BloodGroup,
    weightKg: "65",
    hemoglobinGdl: "14.0",
    medicalHistory: "No contraindications",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onRegisterDonor({
        ...form,
        weightKg: Number(form.weightKg) || 0,
        hemoglobinGdl: Number(form.hemoglobinGdl) || 0,
      });
      if (ok) {
        setForm({ ...form, fullName: "", phone: "", email: "" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
      >
        <h2 className="text-lg font-semibold text-[#14191B]">
          Donor Registration & Eligibility Screening
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Automatically evaluates clinical eligibility (Weight ≥ 50 kg,
          Hemoglobin ≥ 12.5 g/dL) before permitting blood collection.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Full Name *</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={INPUT_CLASS}
              disabled={!canManage}
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className={LABEL_CLASS}>Blood Group *</label>
              <select
                value={form.bloodGroup}
                onChange={(e) =>
                  setForm({ ...form, bloodGroup: e.target.value as BloodGroup })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManage}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>DOB</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm({ ...form, dateOfBirth: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Phone *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Weight (kg) *</label>
              <input
                type="number"
                step="0.5"
                required
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Hemoglobin (g/dL) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={form.hemoglobinGdl}
                onChange={(e) =>
                  setForm({ ...form, hemoglobinGdl: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Medical History / Screening Notes</label>
            <textarea
              rows={2}
              value={form.medicalHistory}
              onChange={(e) =>
                setForm({ ...form, medicalHistory: e.target.value })
              }
              className={INPUT_CLASS}
              disabled={!canManage}
            />
          </div>

          <button
            type="submit"
            disabled={!canManage || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Registering Donor..." : "Register & Screen Donor"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Registered Blood Donors ({donors.length})
        </h3>
        <div className="mt-4 space-y-2.5">
          {donors.map((d) => (
            <div
              key={d.id}
              className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {d.bloodGroup}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBloodBadgeClass(d.eligibilityStatus)}`}
                  >
                    {d.eligibilityStatus}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                    {d.id}
                  </span>
                </div>
                <span className="font-semibold text-[#4A90A4]">
                  {d.totalDonations} donation(s)
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {d.fullName} ({d.gender || "—"}) • {d.phone}
              </p>
              <p className="mt-0.5 text-[#546369]">
                Weight: {d.weightKg} kg • Hb: {d.hemoglobinGdl} g/dL • Last
                Donated: {d.lastDonationDate || "Never"}
              </p>
              <p className="mt-1 text-[#6B7A80]">{d.medicalHistory}</p>
              {d.deferralReason && (
                <p className="mt-1 font-medium text-[#B8381B]">
                  Deferral: {d.deferralReason}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
