"use client";

import React, { useMemo, useState } from "react";
import type { IcuAdmission, IcuMonitoringRecord } from "@/lib/icu/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getIcuBadgeClass,
} from "./ui";

interface PatientMonitoringSectionProps {
  admissions: IcuAdmission[];
  monitoringRecords: IcuMonitoringRecord[];
  preselectedAdmissionId?: string;
  canMonitor: boolean;
  onCreateMonitoring: (payload: {
    icuAdmissionId: string;
    responsibleStaff: string;
    patientCondition: string;
    monitoringStatus: string;
    neurologicalStatus: string;
    fluidBalance: string;
    notes: string;
  }) => Promise<boolean>;
}

export function PatientMonitoringSection({
  admissions,
  monitoringRecords,
  preselectedAdmissionId,
  canMonitor,
  onCreateMonitoring,
}: PatientMonitoringSectionProps) {
  const activeAdmissions = useMemo(
    () =>
      admissions.filter(
        (a) => a.status !== "Discharged" && a.status !== "Transferred"
      ),
    [admissions]
  );

  const [admissionId, setAdmissionId] = useState(
    preselectedAdmissionId || activeAdmissions[0]?.id || admissions[0]?.id || ""
  );
  const [responsibleStaff, setResponsibleStaff] = useState("Nurse Rohan Das");
  const [patientCondition, setPatientCondition] = useState("Critical");
  const [monitoringStatus, setMonitoringStatus] = useState("1:1 Nursing");
  const [neurologicalStatus, setNeurologicalStatus] = useState(
    "Alert & Oriented / GCS 15"
  );
  const [fluidBalance, setFluidBalance] = useState("+150 mL / 8h");
  const [notes, setNotes] = useState("");
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
      monitoringRecords.filter(
        (m) => !effectiveAdmissionId || m.icuAdmissionId === effectiveAdmissionId
      ),
    [monitoringRecords, effectiveAdmissionId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canMonitor || !effectiveAdmissionId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateMonitoring({
        icuAdmissionId: effectiveAdmissionId,
        responsibleStaff,
        patientCondition,
        monitoringStatus,
        neurologicalStatus,
        fluidBalance,
        notes,
      });
      if (ok) setNotes("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Monitoring Log Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Record ICU Patient Monitoring
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Track condition, nursing surveillance level, neuro status, and fluid
            balance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>ICU Patient *</label>
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
              disabled={!canMonitor}
              value={responsibleStaff}
              onChange={(e) => setResponsibleStaff(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Patient Condition *</label>
              <select
                disabled={!canMonitor}
                value={patientCondition}
                onChange={(e) => setPatientCondition(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="Critical">Critical</option>
                <option value="Unstable">Unstable</option>
                <option value="Guarded">Guarded</option>
                <option value="Stabilizing">Stabilizing</option>
                <option value="Stable">Stable</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Monitoring Status *</label>
              <select
                disabled={!canMonitor}
                value={monitoringStatus}
                onChange={(e) => setMonitoringStatus(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="Continuous Telemetry">
                  Continuous Telemetry
                </option>
                <option value="1:1 Nursing">1:1 Nursing</option>
                <option value="Weaning Observation">Weaning Observation</option>
                <option value="Step-Down Ready">Step-Down Ready</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Neurological Status</label>
              <input
                type="text"
                disabled={!canMonitor}
                value={neurologicalStatus}
                onChange={(e) => setNeurologicalStatus(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Fluid Balance (I/O)</label>
              <input
                type="text"
                disabled={!canMonitor}
                value={fluidBalance}
                onChange={(e) => setFluidBalance(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Monitoring Notes</label>
            <textarea
              rows={3}
              disabled={!canMonitor}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Hemodynamic trends, line checks, sedation score..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canMonitor || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Saving..." : "Log Monitoring Update"}
            </button>
          </div>
        </form>
      </div>

      {/* Patient-Specific Monitoring Feed */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Recent Monitoring Records
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Chronological bedside monitoring updates for{" "}
              {effectiveAdmissionId || "all ICU patients"}.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {patientRecords.length} updates
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
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getIcuBadgeClass(rec.patientCondition)}`}
                  >
                    {rec.patientCondition}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getIcuBadgeClass(rec.monitoringStatus)}`}
                  >
                    {rec.monitoringStatus}
                  </span>
                </div>
                <span className="text-[11px] text-[#7A898F]">
                  {formatDateTime(rec.recordedAt)}
                </span>
              </div>

              <p className="mt-2 text-[#4C5B61]">
                <strong>Neuro:</strong> {rec.neurologicalStatus} •{" "}
                <strong>Fluid Balance:</strong> {rec.fluidBalance}
              </p>
              {rec.notes && (
                <p className="mt-1 text-[#546369]">{rec.notes}</p>
              )}
              <p className="mt-1.5 text-[11px] text-[#7D8C92]">
                Staff: {rec.responsibleStaff} • {rec.icuAdmissionId} (
                {rec.patientId})
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
