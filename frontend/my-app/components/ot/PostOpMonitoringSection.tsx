"use client";

import React, { useMemo, useState } from "react";
import type { OtPostOpRecord, OtSurgery } from "@/lib/ot/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getOtBadgeClass,
} from "./ui";

interface PostOpMonitoringSectionProps {
  surgeries: OtSurgery[];
  postOpRecords: OtPostOpRecord[];
  preselectedSurgeryId?: string;
  canWrite: boolean;
  onCreatePostOp: (payload: {
    surgeryId: string;
    responsibleStaff: string;
    patientCondition: string;
    vitals: {
      bloodPressure: string;
      heartRate: string;
      spo2: string;
      temperature: string;
    };
    painScore: string;
    recoveryStatus: string;
    medicationsAndCare: string;
    complications: string;
    observations: string;
    transferDestination: string;
  }) => Promise<boolean>;
}

export function PostOpMonitoringSection({
  surgeries,
  postOpRecords,
  preselectedSurgeryId,
  canWrite,
  onCreatePostOp,
}: PostOpMonitoringSectionProps) {
  const [surgeryId, setSurgeryId] = useState(
    preselectedSurgeryId || surgeries[0]?.id || ""
  );
  const [responsibleStaff, setResponsibleStaff] = useState("PACU Recovery RN");
  const [patientCondition, setPatientCondition] = useState("Recovering");
  const [vitals, setVitals] = useState({
    bloodPressure: "118/74 mmHg",
    heartRate: "76 bpm",
    spo2: "99%",
    temperature: "98.2 °F",
  });
  const [painScore, setPainScore] = useState("3/10");
  const [recoveryStatus, setRecoveryStatus] = useState("PACU Observation");
  const [transferDestination, setTransferDestination] =
    useState("PACU / Recovery");
  const [medicationsAndCare, setMedicationsAndCare] = useState("");
  const [complications, setComplications] = useState("None");
  const [observations, setObservations] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveSurgeryId =
    preselectedSurgeryId && surgeries.some((s) => s.id === preselectedSurgeryId)
      ? preselectedSurgeryId
      : surgeries.some((s) => s.id === surgeryId)
        ? surgeryId
        : (surgeries[0]?.id ?? "");

  const filteredRecords = useMemo(
    () =>
      postOpRecords.filter(
        (r) => !effectiveSurgeryId || r.surgeryId === effectiveSurgeryId
      ),
    [postOpRecords, effectiveSurgeryId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveSurgeryId) return;
    setSubmitting(true);
    try {
      const ok = await onCreatePostOp({
        surgeryId: effectiveSurgeryId,
        responsibleStaff,
        patientCondition,
        vitals,
        painScore,
        recoveryStatus,
        medicationsAndCare,
        complications,
        observations,
        transferDestination,
      });
      if (ok) {
        setMedicationsAndCare("");
        setObservations("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Post-operative Recovery &amp; PACU Monitoring
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Track post-op vitals, pain levels, care instructions, complications,
            and transfer to ICU or Ward.
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
            <div>
              <label className={LABEL_CLASS}>Patient Condition</label>
              <select
                disabled={!canWrite}
                value={patientCondition}
                onChange={(e) => setPatientCondition(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="Stable">Stable</option>
                <option value="Recovering">Recovering</option>
                <option value="Guarded">Guarded</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>BP</label>
              <input
                type="text"
                disabled={!canWrite}
                value={vitals.bloodPressure}
                onChange={(e) =>
                  setVitals({ ...vitals, bloodPressure: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Heart Rate</label>
              <input
                type="text"
                disabled={!canWrite}
                value={vitals.heartRate}
                onChange={(e) =>
                  setVitals({ ...vitals, heartRate: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>SpO₂</label>
              <input
                type="text"
                disabled={!canWrite}
                value={vitals.spo2}
                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Pain Score</label>
              <input
                type="text"
                disabled={!canWrite}
                value={painScore}
                onChange={(e) => setPainScore(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Recovery Status</label>
              <select
                disabled={!canWrite}
                value={recoveryStatus}
                onChange={(e) => setRecoveryStatus(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="PACU Observation">PACU Observation</option>
                <option value="Awake & Stable">Awake &amp; Stable</option>
                <option value="Ready for Transfer">Ready for Transfer</option>
                <option value="Transferred">Transferred</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Transfer Destination</label>
              <select
                disabled={!canWrite}
                value={transferDestination}
                onChange={(e) => setTransferDestination(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="PACU / Recovery">PACU / Recovery</option>
                <option value="Surgical Ward">Surgical Ward</option>
                <option value="General Ward">General Ward</option>
                <option value="ICU">ICU</option>
                <option value="Day-Care Discharge">Day-Care Discharge</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>
              Post-Op Medications &amp; Care Instructions
            </label>
            <textarea
              rows={2}
              disabled={!canWrite}
              value={medicationsAndCare}
              onChange={(e) => setMedicationsAndCare(e.target.value)}
              placeholder="Analgesics, IV fluids, dressing checks, drain output..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Complications</label>
              <input
                type="text"
                disabled={!canWrite}
                value={complications}
                onChange={(e) => setComplications(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Observations</label>
              <input
                type="text"
                disabled={!canWrite}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
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
              {submitting ? "Saving..." : "Log Post-Op Entry"}
            </button>
          </div>
        </form>
      </div>

      {/* Post-Op Timeline */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Post-operative Monitoring Log
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Recovery milestones and transfer destinations for{" "}
              {effectiveSurgeryId || "all surgeries"}.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {filteredRecords.length} entries
          </span>
        </div>

        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No post-operative monitoring entries logged yet.
            </p>
          ) : (
            filteredRecords.map((rec) => (
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
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getOtBadgeClass(rec.patientCondition)}`}
                    >
                      {rec.patientCondition}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getOtBadgeClass(rec.recoveryStatus)}`}
                    >
                      {rec.recoveryStatus}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7A898F]">
                    {rec.responsibleStaff} • {formatDateTime(rec.recordedAt)}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-[14px] bg-white p-2.5 text-[11px] text-[#546369] sm:grid-cols-4">
                  <span>BP: {rec.vitals.bloodPressure}</span>
                  <span>HR: {rec.vitals.heartRate}</span>
                  <span>SpO₂: {rec.vitals.spo2}</span>
                  <span>Pain: {rec.painScore}</span>
                </div>

                <p className="mt-2 text-[#4C5B61]">
                  <strong>Transfer / Destination:</strong>{" "}
                  {rec.transferDestination}
                  {rec.surgicalRecordId
                    ? ` • Operative Ref: ${rec.surgicalRecordId}`
                    : ""}
                </p>
                {rec.medicationsAndCare && (
                  <p className="mt-1 text-[#4C5B61]">
                    <strong>Care &amp; Meds:</strong> {rec.medicationsAndCare}
                  </p>
                )}
                {rec.observations && (
                  <p className="mt-1 text-[#6B7A80]">
                    <strong>Observations:</strong> {rec.observations} •{" "}
                    <strong>Complications:</strong> {rec.complications}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
