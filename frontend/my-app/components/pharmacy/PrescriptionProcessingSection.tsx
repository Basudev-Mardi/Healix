"use client";

import React, { useState } from "react";
import type {
  PharmacyDoctor,
  PharmacyMedicine,
  PharmacyPatient,
  PharmacyPrescription,
} from "@/lib/pharmacy/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getPharmacyBadgeClass,
} from "./ui";

interface PrescriptionProcessingSectionProps {
  patients: PharmacyPatient[];
  doctors: PharmacyDoctor[];
  medicines: PharmacyMedicine[];
  prescriptions: PharmacyPrescription[];
  canCreate: boolean;
  canProcess: boolean;
  onCreatePrescription: (payload: {
    patientId: string;
    doctorName: string;
    items: {
      medicineId: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
      prescribedQty: number;
    }[];
  }) => Promise<boolean>;
  onProcessPrescription: (payload: {
    prescriptionId: string;
    status: "Processing" | "Cancelled";
    note?: string;
  }) => Promise<void>;
  onNavigateDispense: (prescriptionId: string) => void;
}

export function PrescriptionProcessingSection({
  patients,
  doctors,
  medicines,
  prescriptions,
  canCreate,
  canProcess,
  onCreatePrescription,
  onProcessPrescription,
  onNavigateDispense,
}: PrescriptionProcessingSectionProps) {
  const activeMedicines = medicines.filter((m) => m.isActive);

  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [doctorName, setDoctorName] = useState(doctors[0]?.name ?? "");
  const [medicineId, setMedicineId] = useState(activeMedicines[0]?.id ?? "");
  const [dosage, setDosage] = useState("1 tablet");
  const [frequency, setFrequency] = useState("BD (2x daily)");
  const [duration, setDuration] = useState("5 days");
  const [prescribedQty, setPrescribedQty] = useState("10");
  const [instructions, setInstructions] = useState("Take after meals");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onCreatePrescription({
        patientId: patientId || patients[0]?.id || "",
        doctorName: doctorName || doctors[0]?.name || "",
        items: [
          {
            medicineId: medicineId || activeMedicines[0]?.id || "",
            dosage,
            frequency,
            duration,
            instructions,
            prescribedQty: Number(prescribedQty) || 10,
          },
        ],
      });
      if (ok) {
        setInstructions("Take after meals");
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
          Issue Doctor Prescription
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Doctors create verified prescriptions; pharmacy staff validate and
          route them to FEFO dispensing.
        </p>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Patient *</label>
              <select
                value={patientId || patients[0]?.id || ""}
                onChange={(e) => setPatientId(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Prescribing Doctor *</label>
              <select
                value={doctorName || doctors[0]?.name || ""}
                onChange={(e) => setDoctorName(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Medicine *</label>
            <select
              value={medicineId || activeMedicines[0]?.id || ""}
              onChange={(e) => setMedicineId(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canCreate}
            >
              {activeMedicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.medicineCode} — {m.medicineName} (Avail: {m.availableStock}
                  )
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className={LABEL_CLASS}>Dosage *</label>
              <input
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Frequency *</label>
              <input
                type="text"
                required
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Duration *</label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Prescribed Qty *</label>
              <input
                type="number"
                min="1"
                required
                value={prescribedQty}
                onChange={(e) => setPrescribedQty(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Instructions</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canCreate || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Creating Prescription..." : "Issue Prescription"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Prescription Queue & Validation ({prescriptions.length})
        </h3>
        <div className="mt-4 space-y-3">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {rx.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPharmacyBadgeClass(rx.status)}`}
                  >
                    {rx.status}
                  </span>
                </div>
                <span className="text-[11px] text-[#6B7A80]">
                  {formatDateTime(rx.prescribedAt)}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {rx.patientName} ({rx.patientId}) • Prescribed by{" "}
                {rx.doctorName}
              </p>

              <div className="mt-2.5 space-y-1.5">
                {rx.items.map((item) => (
                  <div
                    key={`${rx.id}-${item.medicineId}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-white px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-[#14191B]">
                        {item.medicineCode} — {item.medicineName}
                      </p>
                      <p className="text-[11px] text-[#6B7A80]">
                        {item.dosage} • {item.frequency} • {item.duration}{" "}
                        {item.instructions ? `• ${item.instructions}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#EDF2F3] px-2.5 py-0.5 text-[11px] font-semibold text-[#14191B]">
                      {item.dispensedQty} / {item.prescribedQty} dispensed
                    </span>
                  </div>
                ))}
              </div>

              {rx.status !== "Completed" && rx.status !== "Cancelled" && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E6EDEF] pt-3">
                  {canProcess && rx.status === "Pending" && (
                    <button
                      type="button"
                      onClick={() =>
                        onProcessPrescription({
                          prescriptionId: rx.id,
                          status: "Processing",
                          note: "Validated dosage, strength, and patient safety",
                        })
                      }
                      className={ACCENT_BTN_CLASS}
                    >
                      Validate & Process
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onNavigateDispense(rx.id)}
                    className={PRIMARY_BTN_CLASS}
                  >
                    Dispense Medicines →
                  </button>
                  {canProcess && (
                    <button
                      type="button"
                      onClick={() =>
                        onProcessPrescription({
                          prescriptionId: rx.id,
                          status: "Cancelled",
                          note: "Cancelled by pharmacy staff",
                        })
                      }
                      className={DANGER_BTN_CLASS}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}

              {rx.processingHistory.length > 0 && (
                <div className="mt-2.5 space-y-1 border-t border-[#E6EDEF] pt-2 text-[11px] text-[#7D8C92]">
                  {rx.processingHistory.map((h, idx) => (
                    <p key={`${rx.id}-h-${idx}`}>
                      <strong>{h.status}</strong> ({formatDateTime(h.timestamp)}
                      ) — {h.staff}: {h.note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
