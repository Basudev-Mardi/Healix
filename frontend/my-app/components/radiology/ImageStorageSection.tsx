"use client";

import React, { useState } from "react";
import type { RadiologyImage, RadiologyRequest } from "@/lib/radiology/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  formatDateTime,
  getRadiologyBadgeClass,
} from "./ui";

interface ImageStorageSectionProps {
  requests: RadiologyRequest[];
  images: RadiologyImage[];
  preselectedRequestId?: string;
  canUpload: boolean;
  onUploadImage: (payload: {
    requestId: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    imageDataUrl: string;
    uploadedBy: string;
    notes: string;
  }) => Promise<boolean>;
}

function buildDiagnosticPlaceholderSvg(req: RadiologyRequest): string {
  const safeExam = `${req.examinationId} • ${req.modality.toUpperCase()} • ${req.examType}`.slice(
    0,
    58
  );
  const safePatient = `${req.patientId} | ${req.patientName.toUpperCase()} | ${req.bodyRegion}`.slice(
    0,
    64
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" width="640" height="420"><rect width="640" height="420" fill="#0d1418"/><rect x="24" y="24" width="592" height="372" rx="18" fill="#131e24" stroke="#2c444e" stroke-width="2"/><circle cx="320" cy="210" r="118" fill="#1c2f38" stroke="#6ea5b5" stroke-width="2" opacity="0.88"/><circle cx="320" cy="210" r="68" fill="#243c47" stroke="#8fc1ce" stroke-width="1.5" opacity="0.9"/><line x1="202" y1="210" x2="438" y2="210" stroke="#4a90a4" stroke-dasharray="4 4"/><line x1="320" y1="92" x2="320" y2="328" stroke="#4a90a4" stroke-dasharray="4 4"/><text x="44" y="56" fill="#8fc1ce" font-family="monospace" font-size="13">HEALIX RIS • ${safeExam.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</text><text x="44" y="378" fill="#6ab4a4" font-family="monospace" font-size="12">${safePatient.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export function ImageStorageSection({
  requests,
  images,
  preselectedRequestId,
  canUpload,
  onUploadImage,
}: ImageStorageSectionProps) {
  const activeRequests = requests.filter((r) => r.status !== "Cancelled");

  const [selectedRequestId, setSelectedRequestId] = useState(
    preselectedRequestId ?? ""
  );
  const [uploadedBy, setUploadedBy] = useState("Tech Rohan Das");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");
  const [mimeType, setMimeType] = useState("image/png");
  const [fileSizeBytes, setFileSizeBytes] = useState(0);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [filterModality, setFilterModality] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingImageId, setViewingImageId] = useState<string>(
    images[0]?.id ?? ""
  );

  const activeRequestId =
    selectedRequestId && activeRequests.some((r) => r.id === selectedRequestId)
      ? selectedRequestId
      : preselectedRequestId &&
          activeRequests.some((r) => r.id === preselectedRequestId)
        ? preselectedRequestId
        : (activeRequests[0]?.id ?? "");

  const activeRequest = activeRequests.find((r) => r.id === activeRequestId);

  const filteredImages = images.filter((img) => {
    if (filterModality !== "All" && img.modality !== filterModality) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        img.patientName.toLowerCase().includes(q) ||
        img.patientId.toLowerCase().includes(q) ||
        img.requestId.toLowerCase().includes(q) ||
        img.examinationId.toLowerCase().includes(q) ||
        img.examType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const viewingImage =
    images.find((i) => i.id === viewingImageId) ?? filteredImages[0];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setMimeType(file.type || "image/png");
    setFileSizeBytes(file.size);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRequest) return;
    setSubmitting(true);
    try {
      const finalDataUrl =
        imageDataUrl || buildDiagnosticPlaceholderSvg(activeRequest);
      const finalFileName =
        fileName ||
        `${activeRequest.examinationId}_${activeRequest.modality.toLowerCase().replaceAll(" ", "_")}.svg`;
      const finalMime = imageDataUrl ? mimeType : "image/svg+xml";
      const finalSize = imageDataUrl ? fileSizeBytes : finalDataUrl.length;

      const ok = await onUploadImage({
        requestId: activeRequest.id,
        fileName: finalFileName,
        mimeType: finalMime,
        fileSizeBytes: finalSize,
        imageDataUrl: finalDataUrl,
        uploadedBy,
        notes,
      });
      if (ok) {
        setNotes("");
        setFileName("");
        setImageDataUrl("");
        setFileSizeBytes(0);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Upload & Attach Imaging Study */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
      >
        <h2 className="text-lg font-semibold text-[#14191B]">
          Secure Image Storage (PACS)
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Upload diagnostic images (PNG, JPEG, WebP, SVG) linked directly to
          patient ID, request ID, and examination ID.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Imaging Examination *</label>
            <select
              value={activeRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canUpload || activeRequests.length === 0}
            >
              {activeRequests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} ({r.examinationId}) • {r.modality} — {r.patientName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>
              Select Image File (or leave blank to capture study preview)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={INPUT_CLASS}
              disabled={!canUpload}
            />
            {fileName && (
              <p className="mt-1 text-[11px] text-[#4A90A4]">
                Ready: {fileName} ({Math.round(fileSizeBytes / 1024)} KB)
              </p>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Uploaded By *</label>
            <input
              type="text"
              required
              value={uploadedBy}
              onChange={(e) => setUploadedBy(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canUpload}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Acquisition / Study Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="View orientation, slice thickness, contrast phase..."
              className={INPUT_CLASS}
              disabled={!canUpload}
            />
          </div>

          <button
            type="submit"
            disabled={!canUpload || submitting || !activeRequestId}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Storing Image..." : "Store Radiology Image"}
          </button>
        </div>
      </form>

      {/* Right: Viewer + Stored Images Repository */}
      <div className="space-y-4 lg:col-span-7">
        {/* Active Image Viewer */}
        {viewingImage && (
          <div className="rounded-[28px] border border-white/85 bg-[#11171A] p-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8FC1CE]">
                  {viewingImage.id} • {viewingImage.modality} •{" "}
                  {viewingImage.examinationId}
                </p>
                <p className="text-sm font-semibold">
                  {viewingImage.patientName} ({viewingImage.patientId}) —{" "}
                  {viewingImage.examType}
                </p>
              </div>
              <a
                href={viewingImage.imageDataUrl}
                download={viewingImage.fileName}
                className={ACCENT_BTN_CLASS}
              >
                Download Image
              </a>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-white/10 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingImage.imageDataUrl}
                alt={`${viewingImage.modality} ${viewingImage.examType}`}
                className="max-h-[320px] w-full object-contain"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#9FB2B9]">
              <span>
                File: {viewingImage.fileName} • Uploaded by{" "}
                {viewingImage.uploadedBy}
              </span>
              <span>{formatDateTime(viewingImage.uploadedAt)}</span>
            </div>
            {viewingImage.notes && (
              <p className="mt-1.5 text-xs text-[#DCE4E7]">
                Notes: {viewingImage.notes}
              </p>
            )}
          </div>
        )}

        {/* Repository Filter & Grid */}
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-[#14191B]">
              Stored Imaging Archive ({filteredImages.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, request, exam..."
                className="rounded-full border border-[#DCE4E7] bg-white px-3.5 py-1.5 text-xs"
              />
              <select
                value={filterModality}
                onChange={(e) => setFilterModality(e.target.value)}
                className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
              >
                <option value="All">All Modalities</option>
                <option value="X-ray">X-ray</option>
                <option value="CT Scan">CT Scan</option>
                <option value="MRI">MRI</option>
                <option value="Ultrasound">Ultrasound</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredImages.map((img) => (
              <div
                key={img.id}
                className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-3.5 text-xs"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                    {img.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getRadiologyBadgeClass("Scheduled")}`}
                  >
                    {img.modality}
                  </span>
                </div>
                <p className="mt-2 font-semibold text-[#14191B]">
                  {img.patientName} ({img.patientId})
                </p>
                <p className="text-[11px] text-[#546369]">
                  {img.examType} • {img.requestId}
                </p>
                <p className="mt-1 text-[11px] text-[#7D8C92]">
                  {formatDateTime(img.uploadedAt)} • {img.uploadedBy}
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingImageId(img.id)}
                    className={SECONDARY_BTN_CLASS}
                  >
                    View Study
                  </button>
                  <a
                    href={img.imageDataUrl}
                    download={img.fileName}
                    className={ACCENT_BTN_CLASS}
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}

            {filteredImages.length === 0 && (
              <p className="col-span-2 rounded-[18px] bg-[#F8FAFA] py-8 text-center text-xs text-[#7D8C92]">
                No stored radiology images match your filter.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
