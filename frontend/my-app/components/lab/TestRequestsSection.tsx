"use client";

import React, { useMemo, useState } from "react";
import type {
  LabDoctor,
  LabPatient,
  LabRequest,
  LabTest,
} from "@/lib/lab/types";
import {
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getLabBadgeClass,
} from "./ui";

interface TestRequestsSectionProps {
  patients: LabPatient[];
  doctors: LabDoctor[];
  tests: LabTest[];
  requests: LabRequest[];
  canCreate: boolean;
  canUpdateStatus: boolean;
  onCreateRequest: (payload: {
    patientId: string;
    referringDoctor: string;
    priority: string;
    clinicalNotes: string;
    testIds: string[];
  }) => Promise<boolean>;
  onCancelRequest: (requestId: string) => Promise<void>;
  onNavigateRequest: (
    tab: "collection" | "tracking" | "processing" | "verification" | "reports",
    requestId: string
  ) => void;
}

export function TestRequestsSection({
  patients,
  doctors,
  tests,
  requests,
  canCreate,
  canUpdateStatus,
  onCreateRequest,
  onCancelRequest,
  onNavigateRequest,
}: TestRequestsSectionProps) {
  const activeTests = useMemo(() => tests.filter((t) => t.isActive), [tests]);
  const testMap = useMemo(
    () => new Map(tests.map((t) => [t.id, t])),
    [tests]
  );

  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [referringDoctor, setReferringDoctor] = useState(
    doctors[0]?.name ?? "Dr. Rajesh Mehta"
  );
  const [priority, setPriority] = useState("Routine");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(
    activeTests[0] ? [activeTests[0].id] : []
  );
  const [submitting, setSubmitting] = useState(false);

  function toggleTest(id: string) {
    setSelectedTestIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate || !patientId || selectedTestIds.length === 0) return;
    setSubmitting(true);
    try {
      const ok = await onCreateRequest({
        patientId,
        referringDoctor,
        priority,
        clinicalNotes,
        testIds: selectedTestIds,
      });
      if (ok) {
        setClinicalNotes("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Create Test Request */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Create Laboratory Test Request
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Select one or multiple active tests under a single Lab Request ID.
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
                  {p.id} — {p.fullName} ({p.gender})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Referring Doctor *</label>
              <select
                disabled={!canCreate}
                value={referringDoctor}
                onChange={(e) => setReferringDoctor(e.target.value)}
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
              <label className={LABEL_CLASS}>Priority</label>
              <select
                disabled={!canCreate}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>
              Select Tests * ({selectedTestIds.length} selected)
            </label>
            <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-[18px] bg-white p-3">
              {activeTests.map((t) => {
                const checked = selectedTestIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-[12px] px-2.5 py-2 text-xs hover:bg-[#F5F8F9]"
                  >
                    <span className="flex items-center gap-2 font-medium text-[#14191B]">
                      <input
                        type="checkbox"
                        disabled={!canCreate}
                        checked={checked}
                        onChange={() => toggleTest(t.id)}
                        className="h-4 w-4 accent-[#181C1E]"
                      />
                      {t.testCode} — {t.testName}
                    </span>
                    <span className="text-[11px] text-[#6B7A80]">
                      ${t.price}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Clinical Notes</label>
            <textarea
              rows={2}
              disabled={!canCreate}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Fasting status, suspected diagnosis, urgent instructions..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canCreate || selectedTestIds.length === 0 || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Submitting..." : "Submit Lab Request"}
            </button>
          </div>
        </form>
      </div>

      {/* Lab Requests List */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Laboratory Test Requests
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Track Pending, Accepted, Processing, Completed, and Cancelled
              requests.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {requests.length} requests
          </span>
        </div>

        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {req.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getLabBadgeClass(req.status)}`}
                    >
                      {req.status}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getLabBadgeClass(req.priority)}`}
                    >
                      {req.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#14191B]">
                    {req.patientName} ({req.patientId})
                  </p>
                  <p className="text-[#6B7A80]">
                    Referring: {req.referringDoctor} •{" "}
                    {formatDateTime(req.requestedAt)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {req.testIds.map((tid) => {
                      const t = testMap.get(tid);
                      return (
                        <span
                          key={tid}
                          className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#3C4A50]"
                        >
                          {t ? `${t.testCode}: ${t.testName}` : tid}
                        </span>
                      );
                    })}
                  </div>
                  {req.clinicalNotes && (
                    <p className="mt-1 text-[#546369]">{req.clinicalNotes}</p>
                  )}
                </div>

                {canUpdateStatus &&
                  req.status !== "Completed" &&
                  req.status !== "Cancelled" && (
                    <button
                      type="button"
                      onClick={() => onCancelRequest(req.id)}
                      className={DANGER_BTN_CLASS}
                    >
                      Cancel
                    </button>
                  )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#E6ECEE] pt-3">
                {(
                  [
                    { tab: "collection", label: "Collect Sample" },
                    { tab: "tracking", label: "Track Sample" },
                    { tab: "processing", label: "Process Results" },
                    { tab: "verification", label: "Verify Results" },
                    { tab: "reports", label: "Digital Report" },
                  ] as const
                ).map((btn) => (
                  <button
                    key={btn.tab}
                    type="button"
                    onClick={() => onNavigateRequest(btn.tab, req.id)}
                    className="rounded-full bg-[#EDF2F3] px-2.5 py-1 text-[11px] font-semibold text-[#3C4A50] hover:bg-[#DCE4E7]"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
