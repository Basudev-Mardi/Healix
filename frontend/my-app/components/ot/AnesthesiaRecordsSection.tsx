"use client";

import React, { useMemo, useState } from "react";
import type {
  OtAnesthesiaRecord,
  OtSurgeon,
  OtSurgery,
} from "@/lib/ot/types";
import { INPUT_CLASS, LABEL_CLASS, PRIMARY_BTN_CLASS } from "./ui";

interface AnesthesiaRecordsSectionProps {
  surgeries: OtSurgery[];
  surgeons: OtSurgeon[];
  anesthesiaRecords: OtAnesthesiaRecord[];
  preselectedSurgeryId?: string;
  canWrite: boolean;
  onSaveRecord: (payload: {
    surgeryId: string;
    anesthesiologist: string;
    anesthesiaType: string;
    preAnesthesiaAssessment: string;
    medicationsAndDosages: string;
    intraopMonitoring: string;
    anesthesiaStartTime: string;
    anesthesiaEndTime: string;
    recoveryDetails: string;
    observations: string;
  }) => Promise<boolean>;
}

export function AnesthesiaRecordsSection({
  surgeries,
  surgeons,
  anesthesiaRecords,
  preselectedSurgeryId,
  canWrite,
  onSaveRecord,
}: AnesthesiaRecordsSectionProps) {
  const [surgeryId, setSurgeryId] = useState(
    preselectedSurgeryId || surgeries[0]?.id || ""
  );
  const [submitting, setSubmitting] = useState(false);

  const anesthesiologists = useMemo(
    () =>
      surgeons.filter((s) =>
        s.roleType.toLowerCase().includes("anesthes")
      ),
    [surgeons]
  );

  const effectiveSurgeryId =
    preselectedSurgeryId && surgeries.some((s) => s.id === preselectedSurgeryId)
      ? preselectedSurgeryId
      : surgeries.some((s) => s.id === surgeryId)
        ? surgeryId
        : (surgeries[0]?.id ?? "");

  const existing =
    anesthesiaRecords.find((r) => r.surgeryId === effectiveSurgeryId) ?? null;

  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        anesthesiologist: string;
        anesthesiaType: string;
        preAnesthesiaAssessment: string;
        medicationsAndDosages: string;
        intraopMonitoring: string;
        anesthesiaStartTime: string;
        anesthesiaEndTime: string;
        recoveryDetails: string;
        observations: string;
      }
    >
  >({});

  const form = useMemo(() => {
    if (drafts[effectiveSurgeryId]) return drafts[effectiveSurgeryId];
    if (existing) {
      return {
        anesthesiologist: existing.anesthesiologist,
        anesthesiaType: existing.anesthesiaType,
        preAnesthesiaAssessment: existing.preAnesthesiaAssessment,
        medicationsAndDosages: existing.medicationsAndDosages,
        intraopMonitoring: existing.intraopMonitoring,
        anesthesiaStartTime: existing.anesthesiaStartTime,
        anesthesiaEndTime: existing.anesthesiaEndTime,
        recoveryDetails: existing.recoveryDetails,
        observations: existing.observations,
      };
    }
    return {
      anesthesiologist: anesthesiologists[0]?.name ?? "Dr. Maya Roy",
      anesthesiaType: "General",
      preAnesthesiaAssessment: "ASA Class II • Airway Mallampati I • NPO > 8h",
      medicationsAndDosages: "",
      intraopMonitoring: "ECG, NIBP, SpO2, EtCO2, MAC continuous",
      anesthesiaStartTime: "10:50",
      anesthesiaEndTime: "12:35",
      recoveryDetails: "Extubated awake, Aldrete score 9/10",
      observations: "",
    };
  }, [drafts, effectiveSurgeryId, existing, anesthesiologists]);

  function updateField(field: keyof typeof form, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [effectiveSurgeryId]: { ...form, [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveSurgeryId) return;
    setSubmitting(true);
    try {
      await onSaveRecord({ surgeryId: effectiveSurgeryId, ...form });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Anesthesia Record
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Document pre-anesthesia assessment, agents &amp; dosages, intra-op
            monitoring, and emergence recovery.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Surgery *</label>
            <select
              value={effectiveSurgeryId}
              onChange={(e) => setSurgeryId(e.target.value)}
              className={INPUT_CLASS}
            >
              {surgeries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.patientName} • {s.procedureName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Anesthesiologist *</label>
              <select
                disabled={!canWrite}
                value={form.anesthesiologist}
                onChange={(e) =>
                  updateField("anesthesiologist", e.target.value)
                }
                className={INPUT_CLASS}
              >
                {(anesthesiologists.length > 0 ? anesthesiologists : surgeons).map(
                  (a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Anesthesia Type *</label>
              <select
                disabled={!canWrite}
                value={form.anesthesiaType}
                onChange={(e) => updateField("anesthesiaType", e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="General">General</option>
                <option value="Spinal">Spinal</option>
                <option value="Epidural">Epidural</option>
                <option value="Regional Block">Regional Block</option>
                <option value="Local + Sedation">Local + Sedation</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Pre-Anesthesia Assessment *</label>
            <textarea
              rows={2}
              required
              disabled={!canWrite}
              value={form.preAnesthesiaAssessment}
              onChange={(e) =>
                updateField("preAnesthesiaAssessment", e.target.value)
              }
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>
              Anesthesia Medications &amp; Dosages *
            </label>
            <textarea
              rows={2}
              required
              disabled={!canWrite}
              value={form.medicationsAndDosages}
              onChange={(e) =>
                updateField("medicationsAndDosages", e.target.value)
              }
              placeholder="Propofol 140mg IV, Fentanyl 100mcg IV, Rocuronium 40mg, Sevoflurane 2%..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Anesthesia Start</label>
              <input
                type="time"
                disabled={!canWrite}
                value={form.anesthesiaStartTime}
                onChange={(e) =>
                  updateField("anesthesiaStartTime", e.target.value)
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Anesthesia End</label>
              <input
                type="time"
                disabled={!canWrite}
                value={form.anesthesiaEndTime}
                onChange={(e) =>
                  updateField("anesthesiaEndTime", e.target.value)
                }
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Intra-Operative Monitoring</label>
            <input
              type="text"
              disabled={!canWrite}
              value={form.intraopMonitoring}
              onChange={(e) => updateField("intraopMonitoring", e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Recovery Details</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.recoveryDetails}
                onChange={(e) => updateField("recoveryDetails", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Observations</label>
              <input
                type="text"
                disabled={!canWrite}
                value={form.observations}
                onChange={(e) => updateField("observations", e.target.value)}
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
              {submitting ? "Saving..." : "Save Anesthesia Record"}
            </button>
          </div>
        </form>
      </div>

      {/* Anesthesia History */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Anesthesia Records History
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Patient-specific anesthesia logs linked to surgical cases.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {anesthesiaRecords.length} records
          </span>
        </div>

        <div className="space-y-3">
          {anesthesiaRecords.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No anesthesia records logged yet.
            </p>
          ) : (
            anesthesiaRecords.map((rec) => (
              <article
                key={rec.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {rec.id} • {rec.surgeryId}
                  </span>
                  <span className="rounded-full bg-[#8FC1CE] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {rec.anesthesiaType}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {rec.anesthesiologist} ({rec.patientId})
                </p>
                <p className="text-[#6B7A80]">
                  Time: {rec.anesthesiaStartTime}–{rec.anesthesiaEndTime}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Pre-Assessment:</strong> {rec.preAnesthesiaAssessment}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Agents &amp; Dosages:</strong>{" "}
                  {rec.medicationsAndDosages}
                </p>
                <p className="mt-1 text-[#6B7A80]">
                  <strong>Recovery:</strong> {rec.recoveryDetails}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
