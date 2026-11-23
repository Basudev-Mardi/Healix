"use client";

import React, { useMemo, useState } from "react";
import type { IcuAdmission, IcuVentilatorRecord } from "@/lib/icu/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getIcuBadgeClass,
} from "./ui";

interface VentilatorRecordsSectionProps {
  admissions: IcuAdmission[];
  ventilatorRecords: IcuVentilatorRecord[];
  preselectedAdmissionId?: string;
  canWrite: boolean;
  onCreateRecord: (payload: {
    icuAdmissionId: string;
    responsibleStaff: string;
    ventilatorStatus: string;
    mode: string;
    fio2Percent: number;
    peepCmh2o: number;
    tidalVolumeMl: number;
    respRateSet: number;
    observations: string;
  }) => Promise<boolean>;
}

export function VentilatorRecordsSection({
  admissions,
  ventilatorRecords,
  preselectedAdmissionId,
  canWrite,
  onCreateRecord,
}: VentilatorRecordsSectionProps) {
  const [admissionId, setAdmissionId] = useState(
    preselectedAdmissionId || admissions[0]?.id || ""
  );
  const [responsibleStaff, setResponsibleStaff] = useState(
    "ICU Respiratory Therapist"
  );
  const [ventilatorStatus, setVentilatorStatus] = useState("Active");
  const [mode, setMode] = useState("AC/VC");
  const [fio2Percent, setFio2Percent] = useState(40);
  const [peepCmh2o, setPeepCmh2o] = useState(6);
  const [tidalVolumeMl, setTidalVolumeMl] = useState(440);
  const [respRateSet, setRespRateSet] = useState(14);
  const [observations, setObservations] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveAdmissionId =
    preselectedAdmissionId &&
    admissions.some((a) => a.id === preselectedAdmissionId)
      ? preselectedAdmissionId
      : admissions.some((a) => a.id === admissionId)
        ? admissionId
        : (admissions[0]?.id ?? "");

  const patientRecords = useMemo(
    () =>
      ventilatorRecords.filter(
        (v) => !effectiveAdmissionId || v.icuAdmissionId === effectiveAdmissionId
      ),
    [ventilatorRecords, effectiveAdmissionId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveAdmissionId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateRecord({
        icuAdmissionId: effectiveAdmissionId,
        responsibleStaff,
        ventilatorStatus,
        mode,
        fio2Percent,
        peepCmh2o,
        tidalVolumeMl,
        respRateSet,
        observations,
      });
      if (ok) setObservations("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Record Ventilator Settings &amp; Changes
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Log mode, FiO₂, PEEP, tidal volume, weaning trials, and respiratory
            observations.
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
            <label className={LABEL_CLASS}>Responsible Staff *</label>
            <input
              type="text"
              required
              disabled={!canWrite}
              value={responsibleStaff}
              onChange={(e) => setResponsibleStaff(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Ventilator Status *</label>
              <select
                disabled={!canWrite}
                value={ventilatorStatus}
                onChange={(e) => setVentilatorStatus(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="Active">Active</option>
                <option value="Weaning / SBT">Weaning / SBT</option>
                <option value="Standby">Standby</option>
                <option value="Extubated / Off">Extubated / Off</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Ventilator Mode *</label>
              <select
                disabled={!canWrite}
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="AC/VC">AC/VC</option>
                <option value="SIMV">SIMV</option>
                <option value="PSV">PSV</option>
                <option value="CPAP">CPAP</option>
                <option value="BiPAP">BiPAP</option>
                <option value="HFNC">HFNC</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>FiO₂ (%)</label>
              <input
                type="number"
                min={21}
                max={100}
                disabled={!canWrite}
                value={fio2Percent}
                onChange={(e) => setFio2Percent(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>PEEP (cmH₂O)</label>
              <input
                type="number"
                min={0}
                max={24}
                disabled={!canWrite}
                value={peepCmh2o}
                onChange={(e) => setPeepCmh2o(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Tidal Volume (mL)</label>
              <input
                type="number"
                disabled={!canWrite}
                value={tidalVolumeMl}
                onChange={(e) => setTidalVolumeMl(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Set Resp. Rate</label>
              <input
                type="number"
                disabled={!canWrite}
                value={respRateSet}
                onChange={(e) => setRespRateSet(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Observations &amp; ABG Notes</label>
            <textarea
              rows={3}
              disabled={!canWrite}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Peak pressure, plateau pressure, synchrony, ABG correlation..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canWrite || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Saving..." : "Log Ventilator Record"}
            </button>
          </div>
        </form>
      </div>

      {/* Ventilator Usage History */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Ventilator Usage &amp; Change History
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Chronological ventilator settings for{" "}
              {effectiveAdmissionId || "all patients"}.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {patientRecords.length} entries
          </span>
        </div>

        <div className="space-y-3">
          {patientRecords.map((rec) => (
            <div
              key={rec.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {rec.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getIcuBadgeClass(rec.ventilatorStatus)}`}
                  >
                    {rec.ventilatorStatus}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#4A90A4]">
                    Mode: {rec.mode}
                  </span>
                </div>
                <span className="text-[11px] text-[#7A898F]">
                  {rec.responsibleStaff} • {formatDateTime(rec.recordedAt)}
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-[14px] bg-white p-2.5 text-[11px] font-semibold text-[#14191B] sm:grid-cols-4">
                <span>FiO₂: {rec.fio2Percent}%</span>
                <span>PEEP: {rec.peepCmh2o} cmH₂O</span>
                <span>Vt: {rec.tidalVolumeMl} mL</span>
                <span>RR Set: {rec.respRateSet}/m</span>
              </div>

              {rec.observations && (
                <p className="mt-2 text-[#4C5B61]">{rec.observations}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
