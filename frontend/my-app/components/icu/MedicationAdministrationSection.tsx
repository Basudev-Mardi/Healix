"use client";

import React, { useMemo, useState } from "react";
import type { IcuAdmission, IcuMedication } from "@/lib/icu/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  formatDateTime,
  getIcuBadgeClass,
} from "./ui";

interface MedicationAdministrationSectionProps {
  admissions: IcuAdmission[];
  medications: IcuMedication[];
  preselectedAdmissionId?: string;
  canPrescribe: boolean;
  canAdminister: boolean;
  onPrescribe: (payload: {
    icuAdmissionId: string;
    medicationName: string;
    dosage: string;
    route: string;
    frequency: string;
    scheduledTime: string;
    notes: string;
  }) => Promise<boolean>;
  onAdminister: (payload: {
    medicationId: string;
    status: "Administered" | "Missed" | "Withheld";
  }) => Promise<void>;
}

export function MedicationAdministrationSection({
  admissions,
  medications,
  preselectedAdmissionId,
  canPrescribe,
  canAdminister,
  onPrescribe,
  onAdminister,
}: MedicationAdministrationSectionProps) {
  const [admissionId, setAdmissionId] = useState(
    preselectedAdmissionId || admissions[0]?.id || ""
  );
  const [form, setForm] = useState({
    medicationName: "",
    dosage: "",
    route: "IV Push",
    frequency: "q12h",
    scheduledTime: "16:00",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const effectiveAdmissionId =
    preselectedAdmissionId &&
    admissions.some((a) => a.id === preselectedAdmissionId)
      ? preselectedAdmissionId
      : admissions.some((a) => a.id === admissionId)
        ? admissionId
        : (admissions[0]?.id ?? "");

  const patientMeds = useMemo(
    () =>
      medications.filter(
        (m) => !effectiveAdmissionId || m.icuAdmissionId === effectiveAdmissionId
      ),
    [medications, effectiveAdmissionId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPrescribe || !effectiveAdmissionId) return;
    setSubmitting(true);
    try {
      const ok = await onPrescribe({
        icuAdmissionId: effectiveAdmissionId,
        ...form,
      });
      if (ok) {
        setForm({
          medicationName: "",
          dosage: "",
          route: "IV Push",
          frequency: "q12h",
          scheduledTime: "16:00",
          notes: "",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Prescribe ICU Medication */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Schedule ICU Medication
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Prevents duplicate scheduled doses for the same medication and time.
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

          <div>
            <label className={LABEL_CLASS}>Medication Name *</label>
            <input
              type="text"
              required
              disabled={!canPrescribe}
              value={form.medicationName}
              onChange={(e) =>
                setForm({ ...form, medicationName: e.target.value })
              }
              placeholder="e.g., Meropenem, Vancomycin, Norepinephrine"
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Dosage *</label>
              <input
                type="text"
                required
                disabled={!canPrescribe}
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                placeholder="e.g., 1 g / 0.1 mcg/kg/min"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Route *</label>
              <select
                disabled={!canPrescribe}
                value={form.route}
                onChange={(e) => setForm({ ...form, route: e.target.value })}
                className={INPUT_CLASS}
              >
                <option value="IV Push">IV Push</option>
                <option value="IV Infusion">IV Infusion</option>
                <option value="IV Continuous">IV Continuous</option>
                <option value="Oral / NG Tube">Oral / NG Tube</option>
                <option value="Subcutaneous">Subcutaneous</option>
                <option value="Nebulized">Nebulized</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Frequency *</label>
              <input
                type="text"
                required
                disabled={!canPrescribe}
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
                placeholder="q8h, q12h, Continuous"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Scheduled Time *</label>
              <input
                type="time"
                required
                disabled={!canPrescribe}
                value={form.scheduledTime}
                onChange={(e) =>
                  setForm({ ...form, scheduledTime: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Administration Notes</label>
            <input
              type="text"
              disabled={!canPrescribe}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Dilution, monitoring parameter, hold criteria..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canPrescribe || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Scheduling..." : "Add to ICU MAR"}
            </button>
          </div>
        </form>
      </div>

      {/* ICU MAR Administration Board */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              ICU Medication Administration Record (MAR)
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Track Pending, Administered, Missed, and Withheld doses; blocks
              duplicate administration.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {patientMeds.length} doses
          </span>
        </div>

        <div className="space-y-3">
          {patientMeds.map((med) => (
            <div
              key={med.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {med.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getIcuBadgeClass(med.status)}`}
                    >
                      {med.status}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                      Scheduled {med.scheduledTime}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-[#14191B]">
                    {med.medicationName} — {med.dosage}
                  </p>
                  <p className="text-[#6B7A80]">
                    {med.route} • {med.frequency}
                    {med.notes ? ` • ${med.notes}` : ""}
                  </p>
                  {med.actualAdministeredAt && (
                    <p className="mt-1 text-[11px] text-[#3E8E7E]">
                      Administered by {med.administeringStaff} at{" "}
                      {formatDateTime(med.actualAdministeredAt)}
                    </p>
                  )}
                </div>

                {canAdminister && med.status !== "Administered" && (
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onAdminister({
                          medicationId: med.id,
                          status: "Administered",
                        })
                      }
                      className={ACCENT_BTN_CLASS}
                    >
                      Administer
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAdminister({
                          medicationId: med.id,
                          status: "Withheld",
                        })
                      }
                      className={SECONDARY_BTN_CLASS}
                    >
                      Withhold
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAdminister({
                          medicationId: med.id,
                          status: "Missed",
                        })
                      }
                      className={DANGER_BTN_CLASS}
                    >
                      Missed
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
