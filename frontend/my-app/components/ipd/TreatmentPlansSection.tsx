"use client";

import React, { useMemo, useState } from "react";
import type {
  IpdAdmission,
  IpdDoctor,
  IpdTreatmentPlan,
} from "@/lib/ipd/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getIpdBadgeClass,
} from "./ui";

interface TreatmentPlansSectionProps {
  admissions: IpdAdmission[];
  doctors: IpdDoctor[];
  treatmentPlans: IpdTreatmentPlan[];
  preselectedAdmissionId?: string;
  canWrite: boolean;
  onCreatePlan: (payload: {
    admissionId: string;
    doctorName: string;
    diagnosis: string;
    treatmentInstructions: string;
    medications: string;
    procedures: string;
    careRequirements: string;
    assignedStaff: string;
  }) => Promise<boolean>;
  onUpdateStatus: (planId: string, status: string) => Promise<void>;
}

export function TreatmentPlansSection({
  admissions,
  doctors,
  treatmentPlans,
  preselectedAdmissionId,
  canWrite,
  onCreatePlan,
  onUpdateStatus,
}: TreatmentPlansSectionProps) {
  const [admissionId, setAdmissionId] = useState(
    preselectedAdmissionId || admissions[0]?.id || ""
  );
  const [doctorName, setDoctorName] = useState(
    doctors[0]?.name ?? "Dr. Rajesh Mehta"
  );
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentInstructions, setTreatmentInstructions] = useState("");
  const [medications, setMedications] = useState("");
  const [procedures, setProcedures] = useState("");
  const [careRequirements, setCareRequirements] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("Ward Nursing Team");
  const [submitting, setSubmitting] = useState(false);

  const effectiveAdmissionId =
    preselectedAdmissionId &&
    admissions.some((a) => a.id === preselectedAdmissionId)
      ? preselectedAdmissionId
      : admissions.some((a) => a.id === admissionId)
        ? admissionId
        : (admissions[0]?.id ?? "");

  const filteredPlans = useMemo(
    () =>
      treatmentPlans.filter(
        (p) => !effectiveAdmissionId || p.admissionId === effectiveAdmissionId
      ),
    [treatmentPlans, effectiveAdmissionId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveAdmissionId) return;
    setSubmitting(true);
    try {
      const ok = await onCreatePlan({
        admissionId: effectiveAdmissionId,
        doctorName,
        diagnosis,
        treatmentInstructions,
        medications,
        procedures,
        careRequirements,
        assignedStaff,
      });
      if (ok) {
        setDiagnosis("");
        setTreatmentInstructions("");
        setMedications("");
        setProcedures("");
        setCareRequirements("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Create / Revise Treatment Plan */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Create / Revise Treatment Plan
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Doctors author versioned care plans; prior versions are preserved
            automatically in plan history.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Inpatient Admission *</label>
            <select
              value={effectiveAdmissionId}
              onChange={(e) => setAdmissionId(e.target.value)}
              className={INPUT_CLASS}
            >
              {admissions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.patientName} ({a.diagnosis})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Authoring Doctor *</label>
              <select
                disabled={!canWrite}
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className={INPUT_CLASS}
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Assigned Care Staff</label>
              <input
                type="text"
                disabled={!canWrite}
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Diagnosis *</label>
            <input
              type="text"
              required
              disabled={!canWrite}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Primary inpatient diagnosis"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Treatment Instructions *</label>
            <textarea
              rows={2}
              required
              disabled={!canWrite}
              value={treatmentInstructions}
              onChange={(e) => setTreatmentInstructions(e.target.value)}
              placeholder="Clinical goals, monitoring frequency, escalation criteria..."
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Medications *</label>
            <textarea
              rows={2}
              required
              disabled={!canWrite}
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="IV / Oral medications, dose, route, frequency..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Procedures</label>
              <input
                type="text"
                disabled={!canWrite}
                value={procedures}
                onChange={(e) => setProcedures(e.target.value)}
                placeholder="Labs, imaging, surgical procedures"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Care Requirements</label>
              <input
                type="text"
                disabled={!canWrite}
                value={careRequirements}
                onChange={(e) => setCareRequirements(e.target.value)}
                placeholder="Diet, physiotherapy, isolation, mobility"
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
              {submitting ? "Saving..." : "Save Treatment Plan"}
            </button>
          </div>
        </form>
      </div>

      {/* Treatment Plan History */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Treatment Plan History
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Track active, revised, and completed plans for{" "}
              {effectiveAdmissionId || "selected admission"}.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {filteredPlans.length} versions
          </span>
        </div>

        <div className="space-y-3">
          {filteredPlans.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No treatment plans created for this admission yet.
            </p>
          ) : (
            filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {plan.id} • v{plan.version}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getIpdBadgeClass(plan.status)}`}
                    >
                      {plan.status}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                      {plan.doctorName}
                    </span>
                  </div>
                  {canWrite && (
                    <select
                      aria-label={`Status for ${plan.id}`}
                      value={plan.status}
                      onChange={(e) => onUpdateStatus(plan.id, e.target.value)}
                      className="rounded-full border border-[#D4DFE2] bg-white px-3 py-1 text-[11px] font-semibold text-[#14191B]"
                    >
                      <option value="Active">Active</option>
                      <option value="Revised">Revised</option>
                      <option value="Completed">Completed</option>
                      <option value="Discontinued">Discontinued</option>
                    </select>
                  )}
                </div>

                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {plan.diagnosis}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Instructions:</strong> {plan.treatmentInstructions}
                </p>
                <p className="mt-1 text-[#4C5B61]">
                  <strong>Medications:</strong> {plan.medications}
                </p>
                <p className="mt-1 text-[#6B7A80]">
                  <strong>Procedures:</strong> {plan.procedures} •{" "}
                  <strong>Care:</strong> {plan.careRequirements || "Standard"}
                </p>
                <p className="mt-1 text-[11px] text-[#7D8C92]">
                  Assigned Staff: {plan.assignedStaff} • Updated{" "}
                  {formatDateTime(plan.updatedAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
