"use client";

import React, { useMemo, useState } from "react";
import type {
  LabRequest,
  LabResult,
  LabSample,
  LabTest,
} from "@/lib/lab/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getLabBadgeClass,
} from "./ui";

interface TestProcessingSectionProps {
  requests: LabRequest[];
  samples: LabSample[];
  tests: LabTest[];
  results: LabResult[];
  preselectedRequestId?: string;
  canProcess: boolean;
  onSaveResult: (payload: {
    requestId: string;
    testId: string;
    resultValue: string;
    remarks: string;
    processedBy: string;
    correctionNotes?: string;
  }) => Promise<boolean>;
}

export function TestProcessingSection({
  requests,
  samples,
  tests,
  results,
  preselectedRequestId,
  canProcess,
  onSaveResult,
}: TestProcessingSectionProps) {
  const sampleByRequest = useMemo(() => {
    const map = new Map<string, LabSample>();
    for (const s of samples) {
      map.set(s.requestId, s);
    }
    return map;
  }, [samples]);

  const testById = useMemo(() => {
    const map = new Map<string, LabTest>();
    for (const t of tests) {
      map.set(t.id, t);
    }
    return map;
  }, [tests]);

  const eligibleRequests = useMemo(
    () =>
      requests.filter((r) => {
        const smp = sampleByRequest.get(r.id);
        return (
          r.status !== "Cancelled" &&
          smp !== undefined &&
          smp.status !== "Rejected"
        );
      }),
    [requests, sampleByRequest]
  );

  const [selectedRequestId, setSelectedRequestId] = useState(
    preselectedRequestId ?? ""
  );
  const [selectedTestId, setSelectedTestId] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [remarks, setRemarks] = useState("");
  const [processedBy, setProcessedBy] = useState("Lab Tech Ananya");
  const [correctionNotes, setCorrectionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeRequestId =
    selectedRequestId &&
    eligibleRequests.some((r) => r.id === selectedRequestId)
      ? selectedRequestId
      : preselectedRequestId &&
          eligibleRequests.some((r) => r.id === preselectedRequestId)
        ? preselectedRequestId
        : (eligibleRequests[0]?.id ?? "");

  const activeRequest = eligibleRequests.find((r) => r.id === activeRequestId);
  const activeSample = activeRequest
    ? sampleByRequest.get(activeRequest.id)
    : undefined;

  const activeTestId =
    selectedTestId && activeRequest?.testIds.includes(selectedTestId)
      ? selectedTestId
      : (activeRequest?.testIds[0] ?? "");

  const activeTest = activeTestId ? testById.get(activeTestId) : undefined;

  const existingResult = results.find(
    (res) => res.requestId === activeRequestId && res.testId === activeTestId
  );

  const isLocked = existingResult?.verificationStatus === "Verified";
  const isRejectedResubmit = existingResult?.verificationStatus === "Rejected";

  const requestResults = results.filter(
    (res) => res.requestId === activeRequestId
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRequestId || !activeTestId || isLocked) return;
    setSubmitting(true);
    try {
      const ok = await onSaveResult({
        requestId: activeRequestId,
        testId: activeTestId,
        resultValue,
        remarks,
        processedBy,
        correctionNotes: isRejectedResubmit ? correctionNotes : undefined,
      });
      if (ok) {
        setResultValue("");
        setRemarks("");
        setCorrectionNotes("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Result Entry Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
      >
        <h2 className="text-lg font-semibold text-[#14191B]">
          Test Processing & Result Entry
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Record numerical or qualitative findings. Values outside configured
          reference ranges are flagged automatically.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Lab Request (with Sample) *</label>
            <select
              value={activeRequestId}
              onChange={(e) => {
                setSelectedRequestId(e.target.value);
                setSelectedTestId("");
              }}
              className={INPUT_CLASS}
              disabled={!canProcess || eligibleRequests.length === 0}
            >
              {eligibleRequests.length === 0 ? (
                <option value="">No collected samples ready</option>
              ) : (
                eligibleRequests.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.id} — {req.patientName} ({req.priority})
                  </option>
                ))
              )}
            </select>
          </div>

          {activeRequest && (
            <div className="rounded-[18px] border border-white/90 bg-[#F8FAFA] p-3 text-xs text-[#546369]">
              <p className="font-semibold text-[#14191B]">
                Sample {activeSample?.id} • {activeSample?.specimenType}
              </p>
              <p className="mt-0.5">
                Status: {activeSample?.status} • Referring:{" "}
                {activeRequest.referringDoctor}
              </p>
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Test to Process *</label>
            <select
              value={activeTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canProcess || !activeRequest}
            >
              {activeRequest?.testIds.map((tid) => {
                const t = testById.get(tid);
                const r = results.find(
                  (x) => x.requestId === activeRequest.id && x.testId === tid
                );
                return (
                  <option key={tid} value={tid}>
                    {t ? `${t.testCode} — ${t.testName}` : tid}
                    {r ? ` [${r.verificationStatus}]` : " [Not Entered]"}
                  </option>
                );
              })}
            </select>
          </div>

          {activeTest && (
            <div className="rounded-[18px] border border-white/90 bg-white p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-[#14191B]">
                  {activeTest.testCode} • {activeTest.resultFormat}
                </span>
                <span className="rounded-full bg-[#EDF2F3] px-2.5 py-0.5 text-[11px] font-medium text-[#47565C]">
                  Ref: {activeTest.referenceRangeLabel || "N/A"}{" "}
                  {activeTest.unit}
                </span>
              </div>
              {existingResult && (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[#E6EDEF] pt-2">
                  <span className="text-[#6B7A80]">Current:</span>
                  <span className="font-semibold text-[#14191B]">
                    {existingResult.resultValue} {existingResult.unit}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getLabBadgeClass(existingResult.verificationStatus)}`}
                  >
                    {existingResult.verificationStatus}
                  </span>
                </div>
              )}
              {isLocked && (
                <p className="mt-2 rounded-[12px] bg-[#E8F4F1] px-3 py-1.5 text-[11px] font-medium text-[#2A6B5C]">
                  This result is Verified and locked against modification.
                </p>
              )}
              {isRejectedResubmit && existingResult?.correctionNotes && (
                <p className="mt-2 rounded-[12px] bg-[#FCEBE7] px-3 py-1.5 text-[11px] font-medium text-[#B8381B]">
                  Verifier Rejection Note: {existingResult.correctionNotes}
                </p>
              )}
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>
              Result Value *{" "}
              {activeTest?.unit ? `(${activeTest.unit})` : ""}
            </label>
            <input
              type="text"
              required
              value={resultValue}
              onChange={(e) => setResultValue(e.target.value)}
              placeholder={
                activeTest?.resultFormat === "Numerical"
                  ? "e.g. 13.8"
                  : "e.g. Negative / Reactive / Normal"
              }
              className={INPUT_CLASS}
              disabled={!canProcess || isLocked || !activeTest}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Processed By *</label>
            <input
              type="text"
              required
              value={processedBy}
              onChange={(e) => setProcessedBy(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canProcess || isLocked}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Technical Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Analyzer run ID, dilution notes, or clinical observations..."
              className={INPUT_CLASS}
              disabled={!canProcess || isLocked}
            />
          </div>

          {isRejectedResubmit && (
            <div>
              <label className={LABEL_CLASS}>
                Correction Justification Notes *
              </label>
              <textarea
                rows={2}
                required
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                placeholder="Explain re-run or calibration correction before resubmitting..."
                className={INPUT_CLASS}
                disabled={!canProcess}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={
              !canProcess ||
              submitting ||
              isLocked ||
              !activeRequestId ||
              !activeTestId
            }
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting
              ? "Saving Result..."
              : isRejectedResubmit
                ? "Resubmit Corrected Result"
                : existingResult
                  ? "Update Pending Result"
                  : "Record Test Result"}
          </button>
        </div>
      </form>

      {/* Right: Results for Selected Request & All Recent Results */}
      <div className="space-y-4 lg:col-span-7">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-[#14191B]">
                Processed Results{" "}
                {activeRequest ? `for ${activeRequest.id}` : ""}
              </h3>
              <p className="text-xs text-[#6B7A80]">
                {activeRequest
                  ? `${requestResults.length} of ${activeRequest.testIds.length} test(s) processed`
                  : "Select a request to inspect its test results"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {requestResults.map((res) => (
              <div
                key={res.id}
                className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {res.testCode}
                    </span>
                    <span className="font-semibold text-[#14191B]">
                      {res.testName}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getLabBadgeClass(res.verificationStatus)}`}
                    >
                      {res.verificationStatus}
                    </span>
                    {res.isOutOfRange && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getLabBadgeClass("Out of Range")}`}
                      >
                        Out of Range
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#7D8C92]">
                    {formatDateTime(res.processedAt)}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-1 gap-2 rounded-[14px] bg-white p-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#7D8C92]">
                      Measured Value
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-[#14191B]">
                      {res.resultValue} {res.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#7D8C92]">
                      Reference Range
                    </p>
                    <p className="mt-0.5 font-medium text-[#3B484D]">
                      {res.referenceRange || "Qualitative"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#7D8C92]">
                      Processed By
                    </p>
                    <p className="mt-0.5 font-medium text-[#3B484D]">
                      {res.processedBy}
                    </p>
                  </div>
                </div>

                {res.remarks && (
                  <p className="mt-2 text-[#546369]">Remarks: {res.remarks}</p>
                )}
              </div>
            ))}

            {requestResults.length === 0 && (
              <p className="rounded-[18px] bg-[#F8FAFA] py-8 text-center text-xs text-[#7D8C92]">
                No results entered yet for this lab request.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
