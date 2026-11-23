"use client";

import React, { useState } from "react";
import type {
  RadiologyImage,
  RadiologyReport,
  RadiologyRequest,
} from "@/lib/radiology/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  formatDateTime,
  getRadiologyBadgeClass,
} from "./ui";

interface RadiologistReportsSectionProps {
  requests: RadiologyRequest[];
  images: RadiologyImage[];
  reports: RadiologyReport[];
  preselectedRequestId?: string;
  canWrite: boolean;
  canFinalize: boolean;
  onSaveReport: (payload: {
    requestId: string;
    findings: string;
    observations: string;
    impression: string;
    conclusion: string;
    radiologistName: string;
    status: "Draft" | "Pending Verification" | "Finalized";
  }) => Promise<boolean>;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function printRadiologyReportPdf(report: RadiologyReport) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Radiology Report ${escapeHtml(report.id)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #14191b; padding: 32px; max-width: 860px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #181c1e; padding-bottom: 14px; margin-bottom: 20px; }
    .brand { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .sub { font-size: 12px; color: #546369; margin-top: 2px; }
    .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 24px; background: #f4f7f8; border: 1px solid #dce4e7; border-radius: 12px; padding: 14px 16px; font-size: 12px; margin-bottom: 20px; }
    .section { margin-bottom: 16px; }
    .section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #4a90a4; margin: 0 0 6px 0; }
    .section p { font-size: 13px; line-height: 1.55; margin: 0; white-space: pre-wrap; }
    .footer { display: flex; justify-content: space-between; border-top: 1px solid #dce4e7; padding-top: 14px; margin-top: 24px; font-size: 11px; color: #546369; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Healix Hospital — Diagnostic Radiology Report</div>
      <div class="sub">Radiology Information System (RIS) • ${escapeHtml(report.modality)} Report</div>
    </div>
    <div style="text-align:right;font-size:12px;">
      <div><strong>Report ID:</strong> ${escapeHtml(report.id)}</div>
      <div><strong>Status:</strong> ${escapeHtml(report.status)}</div>
    </div>
  </div>

  <div class="meta">
    <div><strong>Patient:</strong> ${escapeHtml(report.patientName)} (${escapeHtml(report.patientId)})</div>
    <div><strong>Referring Doctor:</strong> ${escapeHtml(report.referringDoctor)}</div>
    <div><strong>Request / Exam ID:</strong> ${escapeHtml(report.requestId)} / ${escapeHtml(report.examinationId)}</div>
    <div><strong>Examination:</strong> ${escapeHtml(report.modality)} — ${escapeHtml(report.examType)}</div>
    <div><strong>Body Region:</strong> ${escapeHtml(report.bodyRegion)}</div>
    <div><strong>Linked Images:</strong> ${escapeHtml(report.imageIds.join(", ") || "None")}</div>
  </div>

  <div class="section">
    <h3>Findings</h3>
    <p>${escapeHtml(report.findings)}</p>
  </div>

  ${
    report.observations
      ? `<div class="section"><h3>Observations</h3><p>${escapeHtml(report.observations)}</p></div>`
      : ""
  }

  <div class="section">
    <h3>Impression</h3>
    <p>${escapeHtml(report.impression)}</p>
  </div>

  ${
    report.conclusion
      ? `<div class="section"><h3>Conclusion & Recommendations</h3><p>${escapeHtml(report.conclusion)}</p></div>`
      : ""
  }

  <div class="footer">
    <div><strong>Reporting Radiologist:</strong> ${escapeHtml(report.radiologistName)}</div>
    <div><strong>Timestamp:</strong> ${escapeHtml(formatDateTime(report.finalizedAt || report.updatedAt))}</div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=920,height=780");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 250);
}

export function RadiologistReportsSection({
  requests,
  images,
  reports,
  preselectedRequestId,
  canWrite,
  canFinalize,
  onSaveReport,
}: RadiologistReportsSectionProps) {
  const activeRequests = requests.filter((r) => r.status !== "Cancelled");

  const [selectedRequestId, setSelectedRequestId] = useState(
    preselectedRequestId ?? ""
  );
  const [radiologistName, setRadiologistName] = useState(
    "Dr. Kavita Rao (Radiologist)"
  );
  const [findings, setFindings] = useState("");
  const [observations, setObservations] = useState("");
  const [impression, setImpression] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [targetStatus, setTargetStatus] = useState<
    "Draft" | "Pending Verification" | "Finalized"
  >("Draft");
  const [submitting, setSubmitting] = useState(false);

  const activeRequestId =
    selectedRequestId && activeRequests.some((r) => r.id === selectedRequestId)
      ? selectedRequestId
      : preselectedRequestId &&
          activeRequests.some((r) => r.id === preselectedRequestId)
        ? preselectedRequestId
        : (activeRequests[0]?.id ?? "");

  const activeRequest = activeRequests.find((r) => r.id === activeRequestId);
  const linkedImages = images.filter((i) => i.requestId === activeRequestId);
  const existingReport = reports.find((r) => r.requestId === activeRequestId);
  const isFinalized = existingReport?.status === "Finalized";

  function loadExistingIntoForm(rpt: RadiologyReport) {
    setSelectedRequestId(rpt.requestId);
    setRadiologistName(rpt.radiologistName);
    setFindings(rpt.findings);
    setObservations(rpt.observations);
    setImpression(rpt.impression);
    setConclusion(rpt.conclusion);
    setTargetStatus(rpt.status);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRequestId || isFinalized) return;
    setSubmitting(true);
    try {
      const ok = await onSaveReport({
        requestId: activeRequestId,
        findings,
        observations,
        impression,
        conclusion,
        radiologistName,
        status: targetStatus,
      });
      if (ok && targetStatus === "Finalized") {
        setFindings("");
        setObservations("");
        setImpression("");
        setConclusion("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Radiologist Reporting Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
      >
        <h2 className="text-lg font-semibold text-[#14191B]">
          Radiologist Diagnostic Reporting
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Review linked images, author findings and impressions, and finalize
          signed reports (permanently locked once finalized).
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Imaging Examination *</label>
            <select
              value={activeRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canWrite || activeRequests.length === 0}
            >
              {activeRequests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} ({r.examinationId}) • {r.modality} — {r.patientName}
                </option>
              ))}
            </select>
          </div>

          {activeRequest && (
            <div className="rounded-[18px] border border-white/90 bg-[#F8FAFA] p-3 text-xs text-[#546369]">
              <p className="font-semibold text-[#14191B]">
                {activeRequest.modality} — {activeRequest.examType} (
                {activeRequest.bodyRegion})
              </p>
              <p className="mt-0.5">
                Indication: {activeRequest.clinicalIndication}
              </p>
              <p className="mt-1 font-medium text-[#4A90A4]">
                Linked Images: {linkedImages.length} study image(s)
              </p>
              {existingReport && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6EDEF] pt-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getRadiologyBadgeClass(existingReport.status)}`}
                  >
                    Existing: {existingReport.id} ({existingReport.status})
                  </span>
                  {!isFinalized && (
                    <button
                      type="button"
                      onClick={() => loadExistingIntoForm(existingReport)}
                      className="text-[11px] font-semibold text-[#4A90A4] underline"
                    >
                      Load into editor
                    </button>
                  )}
                </div>
              )}
              {isFinalized && (
                <p className="mt-2 rounded-[12px] bg-[#E8F4F1] px-3 py-1.5 text-[11px] font-medium text-[#2A6B5C]">
                  Finalized reports are permanently locked against modification.
                </p>
              )}
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Reporting Radiologist *</label>
            <input
              type="text"
              required
              value={radiologistName}
              onChange={(e) => setRadiologistName(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canWrite || isFinalized}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Findings *</label>
            <textarea
              rows={3}
              required
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Detailed anatomical and pathological observations..."
              className={INPUT_CLASS}
              disabled={!canWrite || isFinalized}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Additional Observations</label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Technical quality, comparison with prior studies..."
              className={INPUT_CLASS}
              disabled={!canWrite || isFinalized}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Impression *</label>
            <textarea
              rows={2}
              required
              value={impression}
              onChange={(e) => setImpression(e.target.value)}
              placeholder="Primary diagnostic summary..."
              className={INPUT_CLASS}
              disabled={!canWrite || isFinalized}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Conclusion / Recommendations</label>
            <textarea
              rows={2}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Clinical correlation or follow-up imaging advice..."
              className={INPUT_CLASS}
              disabled={!canWrite || isFinalized}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Report Status *</label>
            <select
              value={targetStatus}
              onChange={(e) =>
                setTargetStatus(
                  e.target.value as
                    | "Draft"
                    | "Pending Verification"
                    | "Finalized"
                )
              }
              className={INPUT_CLASS}
              disabled={!canWrite || isFinalized}
            >
              <option value="Draft">Draft</option>
              <option value="Pending Verification">Pending Verification</option>
              {canFinalize && <option value="Finalized">Finalized (Lock)</option>}
            </select>
          </div>

          <button
            type="submit"
            disabled={!canWrite || submitting || isFinalized || !activeRequestId}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting
              ? "Saving Report..."
              : targetStatus === "Finalized"
                ? "Finalize & Lock Report"
                : "Save Radiologist Report"}
          </button>
        </div>
      </form>

      {/* Right: Reports Archive, History, and Print / Save PDF */}
      <div className="space-y-3 lg:col-span-7">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
          <h3 className="text-base font-semibold text-[#14191B]">
            Radiologist Reports ({reports.length})
          </h3>
          <p className="text-xs text-[#6B7A80]">
            Complete report archive with audit history and downloadable PDF
            export.
          </p>

          <div className="mt-4 space-y-3">
            {reports.map((rpt) => (
              <div
                key={rpt.id}
                className="rounded-[24px] border border-white/90 bg-white p-5 text-xs shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {rpt.id}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getRadiologyBadgeClass(rpt.status)}`}
                      >
                        {rpt.status}
                      </span>
                      <span className="rounded-full bg-[#EDF2F3] px-2.5 py-0.5 text-[11px] font-medium text-[#47565C]">
                        {rpt.modality} • {rpt.requestId}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-[#14191B]">
                      {rpt.patientName} ({rpt.patientId}) — {rpt.examType}
                    </p>
                    <p className="text-[11px] text-[#6B7A80]">
                      Exam {rpt.examinationId} • Region: {rpt.bodyRegion} •
                      Images: {rpt.imageIds.join(", ") || "None"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canWrite && rpt.status !== "Finalized" && (
                      <button
                        type="button"
                        onClick={() => loadExistingIntoForm(rpt)}
                        className={SECONDARY_BTN_CLASS}
                      >
                        Edit / Finalize
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => printRadiologyReportPdf(rpt)}
                      className={ACCENT_BTN_CLASS}
                    >
                      Print / Save PDF
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2 rounded-[18px] bg-[#F8FAFA] p-3.5 text-[#3B484D]">
                  <p>
                    <strong className="text-[#14191B]">Findings:</strong>{" "}
                    {rpt.findings}
                  </p>
                  {rpt.observations && (
                    <p>
                      <strong className="text-[#14191B]">Observations:</strong>{" "}
                      {rpt.observations}
                    </p>
                  )}
                  <p>
                    <strong className="text-[#14191B]">Impression:</strong>{" "}
                    {rpt.impression}
                  </p>
                  {rpt.conclusion && (
                    <p>
                      <strong className="text-[#14191B]">Conclusion:</strong>{" "}
                      {rpt.conclusion}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6B7A80]">
                  <span>Radiologist: {rpt.radiologistName}</span>
                  <span>
                    {rpt.finalizedAt
                      ? `Finalized ${formatDateTime(rpt.finalizedAt)}`
                      : `Updated ${formatDateTime(rpt.updatedAt)}`}
                  </span>
                </div>

                {rpt.reportHistory.length > 0 && (
                  <div className="mt-2.5 space-y-1 border-t border-[#E6EDEF] pt-2.5 text-[11px] text-[#7D8C92]">
                    {rpt.reportHistory.map((h, idx) => (
                      <p key={`${rpt.id}-h-${idx}`}>
                        <strong>{h.status}</strong> ({formatDateTime(h.timestamp)}
                        ) — {h.staff}: {h.note}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {reports.length === 0 && (
              <p className="rounded-[18px] bg-[#F8FAFA] py-8 text-center text-xs text-[#7D8C92]">
                No radiologist reports created yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
