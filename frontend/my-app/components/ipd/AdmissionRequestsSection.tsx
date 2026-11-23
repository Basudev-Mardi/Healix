"use client";

import React, { useMemo, useState } from "react";
import type {
  IpdAdmissionRequest,
  IpdDoctor,
  IpdPatient,
} from "@/lib/ipd/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  formatDateTime,
  getIpdBadgeClass,
} from "./ui";

interface AdmissionRequestsSectionProps {
  patients: IpdPatient[];
  doctors: IpdDoctor[];
  requests: IpdAdmissionRequest[];
  canCreate: boolean;
  canReview: boolean;
  canAdmit: boolean;
  onCreateRequest: (payload: {
    patientId: string;
    department: string;
    requestedBedType: string;
    reason: string;
    priority: string;
  }) => Promise<boolean>;
  onReviewRequest: (payload: {
    requestId: string;
    status: "Approved" | "Rejected" | "Cancelled";
    reviewNotes?: string;
  }) => Promise<void>;
  onConvertToAdmission: (request: IpdAdmissionRequest) => void;
}

const BED_TYPES = ["General", "Semi-Private", "Private", "Step-Down", "ICU"];

export function AdmissionRequestsSection({
  patients,
  doctors,
  requests,
  canCreate,
  canReview,
  canAdmit,
  onCreateRequest,
  onReviewRequest,
  onConvertToAdmission,
}: AdmissionRequestsSectionProps) {
  const departments = useMemo(
    () =>
      Array.from(new Set([...doctors.map((d) => d.department), "Critical Care"])),
    [doctors]
  );

  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [department, setDepartment] = useState(departments[0] ?? "General Medicine");
  const [requestedBedType, setRequestedBedType] = useState("Semi-Private");
  const [priority, setPriority] = useState("Normal");
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [submitting, setSubmitting] = useState(false);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "All") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate || !patientId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateRequest({
        patientId,
        department,
        requestedBedType,
        reason,
        priority,
      });
      if (ok) setReason("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Create Request Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Create Admission Request
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Submit an inpatient bed request for Ward Manager / Admin review and
            conversion.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Patient *</label>
            <select
              required
              disabled={!canCreate}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className={INPUT_CLASS}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} — {p.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Department *</label>
              <select
                disabled={!canCreate}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={INPUT_CLASS}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Requested Bed Type *</label>
              <select
                disabled={!canCreate}
                value={requestedBedType}
                onChange={(e) => setRequestedBedType(e.target.value)}
                className={INPUT_CLASS}
              >
                {BED_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Priority</label>
            <select
              disabled={!canCreate}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Admission Reason *</label>
            <textarea
              rows={3}
              required
              disabled={!canCreate}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Clinical justification for admission..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canCreate || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Submitting..." : "Submit Admission Request"}
            </button>
          </div>
        </form>
      </div>

      {/* Requests Review Queue */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Admission Requests Queue
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Approve, reject, cancel, or convert approved requests into active
              admissions.
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-white bg-white px-4 py-2 text-xs font-medium text-[#14191B] focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Converted">Converted</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No admission requests match this filter.
            </p>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {req.id}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getIpdBadgeClass(req.status)}`}
                      >
                        {req.status}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getIpdBadgeClass(req.priority)}`}
                      >
                        {req.priority}
                      </span>
                      {req.convertedAdmissionId && (
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#1E505E]">
                          Admitted: {req.convertedAdmissionId}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#14191B]">
                      {req.patientName} ({req.patientId})
                    </p>
                    <p className="text-[#6B7A80]">
                      {req.department} • Bed Type: {req.requestedBedType} • By{" "}
                      {req.requestedBy} ({formatDateTime(req.createdAt)})
                    </p>
                    <p className="mt-1 text-[#4C5B61]">{req.reason}</p>
                    {req.reviewedBy && (
                      <p className="mt-1 text-[11px] text-[#7A898F]">
                        Reviewed by {req.reviewedBy} (
                        {formatDateTime(req.updatedAt)})
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {canReview && req.status === "Pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onReviewRequest({
                              requestId: req.id,
                              status: "Approved",
                            })
                          }
                          className={ACCENT_BTN_CLASS}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onReviewRequest({
                              requestId: req.id,
                              status: "Rejected",
                            })
                          }
                          className={DANGER_BTN_CLASS}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onReviewRequest({
                              requestId: req.id,
                              status: "Cancelled",
                            })
                          }
                          className={SECONDARY_BTN_CLASS}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {canAdmit && req.status === "Approved" && (
                      <button
                        type="button"
                        onClick={() => onConvertToAdmission(req)}
                        className={PRIMARY_BTN_CLASS}
                      >
                        Convert to Admission
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
