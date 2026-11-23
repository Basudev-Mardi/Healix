"use client";

import React, { useMemo, useState } from "react";
import type { LabResult } from "@/lib/lab/types";
import {
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getLabBadgeClass,
} from "./ui";

interface ResultVerificationSectionProps {
  results: LabResult[];
  canVerify: boolean;
  onVerifyResult: (payload: {
    resultId: string;
    status: "Verified" | "Rejected";
    correctionNotes?: string;
  }) => Promise<void>;
}

export function ResultVerificationSection({
  results,
  canVerify,
  onVerifyResult,
}: ResultVerificationSectionProps) {
  const [filter, setFilter] = useState<"All" | "Pending" | "Verified" | "Rejected">(
    "All"
  );
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredResults = useMemo(() => {
    if (filter === "All") return results;
    return results.filter((r) => r.verificationStatus === filter);
  }, [results, filter]);

  async function handleAction(
    resultId: string,
    status: "Verified" | "Rejected"
  ) {
    setBusyId(resultId);
    try {
      await onVerifyResult({
        resultId,
        status,
        correctionNotes:
          status === "Rejected" ? (notesById[resultId] ?? "") : undefined,
      });
      if (status === "Rejected") {
        setNotesById((prev) => ({ ...prev, [resultId]: "" }));
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#14191B]">
            Pathologist & Doctor Result Verification
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Approve verified results (permanently locked) or reject with
            mandatory correction notes for lab re-run.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(["All", "Pending", "Verified", "Rejected"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === tab
                  ? "bg-[#181C1E] text-white"
                  : "bg-white text-[#47565C] hover:bg-[#F8FAFA]"
              }`}
            >
              {tab} (
              {tab === "All"
                ? results.length
                : results.filter((r) => r.verificationStatus === tab).length}
              )
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredResults.map((res) => (
          <div
            key={res.id}
            className="rounded-[26px] border border-white/85 bg-[#EDF2F3] p-5 text-xs"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {res.id}
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
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                    Request {res.requestId} • Sample {res.sampleId} • Patient{" "}
                    {res.patientId}
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {res.testCode} — {res.testName}
                </p>
              </div>

              <div className="rounded-[18px] border border-white/90 bg-white px-4 py-2.5 text-right">
                <p className="text-[10px] uppercase tracking-wider text-[#7D8C92]">
                  Result vs Reference
                </p>
                <p className="text-base font-bold text-[#14191B]">
                  {res.resultValue} {res.unit}
                </p>
                <p className="text-[11px] text-[#6B7A80]">
                  Ref: {res.referenceRange || "Qualitative"}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-[#546369]">
              <span>
                Processed by <strong>{res.processedBy}</strong> at{" "}
                {formatDateTime(res.processedAt)}
              </span>
              {res.verifiedBy && (
                <span>
                  {res.verificationStatus} by <strong>{res.verifiedBy}</strong>{" "}
                  {res.verifiedAt ? `at ${formatDateTime(res.verifiedAt)}` : ""}
                </span>
              )}
            </div>

            {res.remarks && (
              <p className="mt-2 rounded-[14px] bg-[#F8FAFA] px-3 py-2 text-[#47565C]">
                Lab Remarks: {res.remarks}
              </p>
            )}

            {res.correctionNotes && (
              <p className="mt-2 rounded-[14px] bg-[#FCEBE7] px-3 py-2 font-medium text-[#B8381B]">
                Correction Notes: {res.correctionNotes}
              </p>
            )}

            {canVerify && res.verificationStatus !== "Verified" && (
              <div className="mt-4 flex flex-col gap-2.5 border-t border-white/80 pt-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={notesById[res.id] ?? ""}
                  onChange={(e) =>
                    setNotesById((prev) => ({
                      ...prev,
                      [res.id]: e.target.value,
                    }))
                  }
                  placeholder="Enter required correction notes if rejecting..."
                  className={`${INPUT_CLASS} sm:flex-1`}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === res.id}
                    onClick={() => handleAction(res.id, "Verified")}
                    className={PRIMARY_BTN_CLASS}
                  >
                    Verify & Lock
                  </button>
                  <button
                    type="button"
                    disabled={busyId === res.id}
                    onClick={() => handleAction(res.id, "Rejected")}
                    className={DANGER_BTN_CLASS}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredResults.length === 0 && (
          <div className="rounded-[26px] border border-white/85 bg-[#EDF2F3] p-8 text-center text-xs text-[#7D8C92]">
            No laboratory results match the selected verification filter.
          </div>
        )}
      </div>
    </div>
  );
}
