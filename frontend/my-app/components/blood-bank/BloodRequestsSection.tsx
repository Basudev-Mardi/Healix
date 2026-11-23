"use client";

import React, { useState } from "react";
import {
  BLOOD_COMPONENTS,
  BLOOD_GROUPS,
  type BloodBankDoctor,
  type BloodBankPatient,
  type BloodComponent,
  type BloodGroup,
  type BloodRequest,
} from "@/lib/blood-bank/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getBloodBadgeClass,
} from "./ui";

interface BloodRequestsSectionProps {
  patients: BloodBankPatient[];
  doctors: BloodBankDoctor[];
  requests: BloodRequest[];
  canCreate: boolean;
  canApprove: boolean;
  onCreateRequest: (payload: {
    patientId: string;
    department: "OPD" | "IPD" | "Emergency" | "Surgery";
    requestedBloodGroup: BloodGroup;
    component: BloodComponent;
    unitsRequested: number;
    urgency: "Routine" | "Urgent" | "Emergency";
    requestingDoctor: string;
    clinicalIndication: string;
  }) => Promise<boolean>;
  onUpdateStatus: (payload: {
    requestId: string;
    status: "Approved" | "Rejected" | "Cancelled";
    rejectionReason?: string;
  }) => Promise<void>;
}

export function BloodRequestsSection({
  patients,
  doctors,
  requests,
  canCreate,
  canApprove,
  onCreateRequest,
  onUpdateStatus,
}: BloodRequestsSectionProps) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [department, setDepartment] = useState<
    "OPD" | "IPD" | "Emergency" | "Surgery"
  >("Surgery");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("O+");
  const [component, setComponent] = useState<BloodComponent>("RBC");
  const [unitsRequested, setUnitsRequested] = useState("1");
  const [urgency, setUrgency] = useState<"Routine" | "Urgent" | "Emergency">(
    "Urgent"
  );
  const [doctor, setDoctor] = useState(doctors[0]?.name ?? "");
  const [indication, setIndication] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onCreateRequest({
        patientId: patientId || patients[0]?.id || "",
        department,
        requestedBloodGroup: bloodGroup,
        component,
        unitsRequested: Number(unitsRequested) || 1,
        urgency,
        requestingDoctor: doctor || doctors[0]?.name || "",
        clinicalIndication: indication,
      });
      if (ok) {
        setIndication("");
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
          Create Department Blood Request
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Submit blood requests from OPD, IPD, Emergency, or Surgery with
          priority handling.
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
                    {p.fullName} ({p.bloodGroup})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Department *</label>
              <select
                value={department}
                onChange={(e) =>
                  setDepartment(
                    e.target.value as "OPD" | "IPD" | "Emergency" | "Surgery"
                  )
                }
                className={INPUT_CLASS}
                disabled={!canCreate}
              >
                <option value="OPD">OPD</option>
                <option value="IPD">IPD</option>
                <option value="Emergency">Emergency</option>
                <option value="Surgery">Surgery</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className={LABEL_CLASS}>Blood Group *</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Component *</label>
              <select
                value={component}
                onChange={(e) =>
                  setComponent(e.target.value as BloodComponent)
                }
                className={INPUT_CLASS}
                disabled={!canCreate}
              >
                {BLOOD_COMPONENTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Units *</label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={unitsRequested}
                onChange={(e) => setUnitsRequested(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Urgency *</label>
              <select
                value={urgency}
                onChange={(e) =>
                  setUrgency(
                    e.target.value as "Routine" | "Urgent" | "Emergency"
                  )
                }
                className={INPUT_CLASS}
                disabled={!canCreate}
              >
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Emergency (STAT)</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Requesting Doctor *</label>
              <select
                value={doctor || doctors[0]?.name || ""}
                onChange={(e) => setDoctor(e.target.value)}
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
            <label className={LABEL_CLASS}>Clinical Indication *</label>
            <textarea
              rows={2}
              required
              value={indication}
              onChange={(e) => setIndication(e.target.value)}
              placeholder="Hemoglobin level, surgical procedure, acute hemorrhage..."
              className={INPUT_CLASS}
              disabled={!canCreate}
            />
          </div>

          <button
            type="submit"
            disabled={!canCreate || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Submitting Request..." : "Submit Blood Request"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Blood Requests Queue ({requests.length})
        </h3>
        <div className="mt-4 space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {req.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBloodBadgeClass(req.status)}`}
                  >
                    {req.status}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBloodBadgeClass(req.urgency)}`}
                  >
                    {req.urgency}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                    {req.department}
                  </span>
                </div>
                <span className="text-[11px] text-[#6B7A80]">
                  {formatDateTime(req.requestedAt)}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {req.patientName} ({req.patientId}) — {req.requestedBloodGroup}{" "}
                {req.component} ({req.unitsFulfilled}/{req.unitsRequested}{" "}
                fulfilled)
              </p>
              <p className="mt-0.5 text-[#546369]">
                Doctor: {req.requestingDoctor} • {req.clinicalIndication}
              </p>
              {req.rejectionReason && (
                <p className="mt-1 font-medium text-[#B8381B]">
                  Rejected: {req.rejectionReason}
                </p>
              )}

              {canApprove &&
                (req.status === "Pending" ||
                  req.status === "Approved" ||
                  req.status === "Reserved") && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E6EDEF] pt-3">
                    {req.status === "Pending" && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateStatus({
                            requestId: req.id,
                            status: "Approved",
                          })
                        }
                        className={ACCENT_BTN_CLASS}
                      >
                        Approve Request
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStatus({
                          requestId: req.id,
                          status: "Rejected",
                          rejectionReason: "Rejected by Blood Bank Officer",
                        })
                      }
                      className={DANGER_BTN_CLASS}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStatus({
                          requestId: req.id,
                          status: "Cancelled",
                        })
                      }
                      className="rounded-full border border-[#D4DFE2] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#47565C]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
