"use client";

import React, { useMemo, useState } from "react";
import type {
  IcuAdmission,
  IcuVitalSign,
  IcuVitalThresholds,
} from "@/lib/icu/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
} from "./ui";

interface VitalSignsSectionProps {
  admissions: IcuAdmission[];
  vitalSigns: IcuVitalSign[];
  thresholds: IcuVitalThresholds;
  preselectedAdmissionId?: string;
  canRecordVitals: boolean;
  canEditThresholds: boolean;
  onRecordVitals: (payload: {
    icuAdmissionId: string;
    responsibleStaff: string;
    systolicBp: number;
    diastolicBp: number;
    heartRate: number;
    respiratoryRate: number;
    temperatureF: number;
    spo2: number;
  }) => Promise<boolean>;
  onUpdateThresholds: (payload: {
    systolicMin: number;
    systolicMax: number;
    heartRateMin: number;
    heartRateMax: number;
    respRateMin: number;
    respRateMax: number;
    tempMin: number;
    tempMax: number;
    spo2Min: number;
  }) => Promise<boolean>;
}

export function VitalSignsSection({
  admissions,
  vitalSigns,
  thresholds,
  preselectedAdmissionId,
  canRecordVitals,
  canEditThresholds,
  onRecordVitals,
  onUpdateThresholds,
}: VitalSignsSectionProps) {
  const [admissionId, setAdmissionId] = useState(
    preselectedAdmissionId || admissions[0]?.id || ""
  );
  const [responsibleStaff, setResponsibleStaff] = useState("Nurse Rohan Das");
  const [form, setForm] = useState({
    systolicBp: 112,
    diastolicBp: 72,
    heartRate: 88,
    respiratoryRate: 18,
    temperatureF: 98.6,
    spo2: 96,
  });
  const [thForm, setThForm] = useState({
    systolicMin: thresholds.systolicMin,
    systolicMax: thresholds.systolicMax,
    heartRateMin: thresholds.heartRateMin,
    heartRateMax: thresholds.heartRateMax,
    respRateMin: thresholds.respRateMin,
    respRateMax: thresholds.respRateMax,
    tempMin: thresholds.tempMin,
    tempMax: thresholds.tempMax,
    spo2Min: thresholds.spo2Min,
  });
  const [showThresholds, setShowThresholds] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const effectiveAdmissionId =
    preselectedAdmissionId &&
    admissions.some((a) => a.id === preselectedAdmissionId)
      ? preselectedAdmissionId
      : admissions.some((a) => a.id === admissionId)
        ? admissionId
        : (admissions[0]?.id ?? "");

  const admissionVitals = useMemo(
    () =>
      vitalSigns.filter(
        (v) => !effectiveAdmissionId || v.icuAdmissionId === effectiveAdmissionId
      ),
    [vitalSigns, effectiveAdmissionId]
  );

  async function handleRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!canRecordVitals || !effectiveAdmissionId) return;
    setSubmitting(true);
    try {
      await onRecordVitals({
        icuAdmissionId: effectiveAdmissionId,
        responsibleStaff,
        ...form,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Record Vitals Form */}
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-[#14191B]">
                Record ICU Vital Signs
              </h2>
              <p className="text-xs text-[#6B7A80]">
                Automatically flags abnormal readings against configured
                clinical thresholds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowThresholds((prev) => !prev)}
              className={ACCENT_BTN_CLASS}
            >
              {showThresholds ? "Hide Thresholds" : "Thresholds"}
            </button>
          </div>

          <form onSubmit={handleRecord} className="space-y-4">
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
              <label className={LABEL_CLASS}>Recorded By *</label>
              <input
                type="text"
                required
                disabled={!canRecordVitals}
                value={responsibleStaff}
                onChange={(e) => setResponsibleStaff(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className={LABEL_CLASS}>Systolic BP</label>
                <input
                  type="number"
                  required
                  disabled={!canRecordVitals}
                  value={form.systolicBp}
                  onChange={(e) =>
                    setForm({ ...form, systolicBp: Number(e.target.value) })
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Diastolic BP</label>
                <input
                  type="number"
                  required
                  disabled={!canRecordVitals}
                  value={form.diastolicBp}
                  onChange={(e) =>
                    setForm({ ...form, diastolicBp: Number(e.target.value) })
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Heart Rate (bpm)</label>
                <input
                  type="number"
                  required
                  disabled={!canRecordVitals}
                  value={form.heartRate}
                  onChange={(e) =>
                    setForm({ ...form, heartRate: Number(e.target.value) })
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Resp. Rate (/min)</label>
                <input
                  type="number"
                  required
                  disabled={!canRecordVitals}
                  value={form.respiratoryRate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      respiratoryRate: Number(e.target.value),
                    })
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  disabled={!canRecordVitals}
                  value={form.temperatureF}
                  onChange={(e) =>
                    setForm({ ...form, temperatureF: Number(e.target.value) })
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>SpO₂ (%)</label>
                <input
                  type="number"
                  required
                  disabled={!canRecordVitals}
                  value={form.spo2}
                  onChange={(e) =>
                    setForm({ ...form, spo2: Number(e.target.value) })
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!canRecordVitals || submitting}
                className={PRIMARY_BTN_CLASS}
              >
                {submitting ? "Recording..." : "Save Vital Signs"}
              </button>
            </div>
          </form>

          {showThresholds && (
            <div className="mt-5 rounded-[20px] bg-white p-4">
              <p className="text-xs font-semibold text-[#14191B]">
                Configurable Clinical Alert Thresholds
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-3">
                <div>
                  <label className={LABEL_CLASS}>Sys Min</label>
                  <input
                    type="number"
                    disabled={!canEditThresholds}
                    value={thForm.systolicMin}
                    onChange={(e) =>
                      setThForm({
                        ...thForm,
                        systolicMin: Number(e.target.value),
                      })
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Sys Max</label>
                  <input
                    type="number"
                    disabled={!canEditThresholds}
                    value={thForm.systolicMax}
                    onChange={(e) =>
                      setThForm({
                        ...thForm,
                        systolicMax: Number(e.target.value),
                      })
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>SpO₂ Min %</label>
                  <input
                    type="number"
                    disabled={!canEditThresholds}
                    value={thForm.spo2Min}
                    onChange={(e) =>
                      setThForm({ ...thForm, spo2Min: Number(e.target.value) })
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>HR Min</label>
                  <input
                    type="number"
                    disabled={!canEditThresholds}
                    value={thForm.heartRateMin}
                    onChange={(e) =>
                      setThForm({
                        ...thForm,
                        heartRateMin: Number(e.target.value),
                      })
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>HR Max</label>
                  <input
                    type="number"
                    disabled={!canEditThresholds}
                    value={thForm.heartRateMax}
                    onChange={(e) =>
                      setThForm({
                        ...thForm,
                        heartRateMax: Number(e.target.value),
                      })
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Temp Max °F</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!canEditThresholds}
                    value={thForm.tempMax}
                    onChange={(e) =>
                      setThForm({ ...thForm, tempMax: Number(e.target.value) })
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              {canEditThresholds && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onUpdateThresholds(thForm)}
                    className={PRIMARY_BTN_CLASS}
                  >
                    Save Thresholds
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chronological Vitals Trend & Abnormal Flags */}
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#14191B]">
                Vital Signs Trend &amp; Abnormal Alerts
              </h2>
              <p className="text-xs text-[#6B7A80]">
                Active limits: Sys {thresholds.systolicMin}–
                {thresholds.systolicMax} • HR {thresholds.heartRateMin}–
                {thresholds.heartRateMax} • SpO₂ ≥ {thresholds.spo2Min}% • Temp
                ≤ {thresholds.tempMax}°F
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
              {admissionVitals.length} readings
            </span>
          </div>

          <div className="space-y-3">
            {admissionVitals.map((v) => (
              <div
                key={v.id}
                className={`rounded-[22px] border p-4 text-xs ${
                  v.isAbnormal
                    ? "border-[#EF5B3A]/50 bg-white"
                    : "border-white/90 bg-[#F8FAFA]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {v.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        v.isAbnormal
                          ? "bg-[#EF5B3A] text-white"
                          : "bg-[#6AB4A4] text-white"
                      }`}
                    >
                      {v.isAbnormal ? "Abnormal" : "Within Threshold"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7A898F]">
                    {v.responsibleStaff} • {formatDateTime(v.measuredAt)}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-[14px] bg-[#EDF2F3]/70 p-3 text-xs font-semibold text-[#14191B] sm:grid-cols-5">
                  <span>
                    BP: {v.systolicBp}/{v.diastolicBp}
                  </span>
                  <span>HR: {v.heartRate} bpm</span>
                  <span>RR: {v.respiratoryRate}/m</span>
                  <span>Temp: {v.temperatureF}°F</span>
                  <span>SpO₂: {v.spo2}%</span>
                </div>

                {v.abnormalFlags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {v.abnormalFlags.map((flag) => (
                      <span
                        key={flag}
                        className="rounded-full bg-[#EF5B3A]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#9C2E15]"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
