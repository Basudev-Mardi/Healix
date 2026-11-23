"use client";

import React, { useState } from "react";
import type {
  MriScreeningInfo,
  RadiologyAppointment,
  RadiologyDoctor,
  RadiologyImage,
  RadiologyModality,
  RadiologyPatient,
  RadiologyReport,
  RadiologyRequest,
} from "@/lib/radiology/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  getRadiologyBadgeClass,
} from "./ui";

const MODALITY_PRESETS: Record<
  RadiologyModality,
  {
    title: string;
    subtitle: string;
    examTypes: string[];
    bodyPlaceholder: string;
    instructionsPlaceholder: string;
  }
> = {
  "X-ray": {
    title: "X-ray Examination Management",
    subtitle:
      "Order and track digital X-ray studies, assign technicians, and link radiographs and reports.",
    examTypes: [
      "Chest PA & Lateral",
      "Cervical Spine AP/Lat",
      "Knee AP & Lateral",
      "Abdomen Supine/Erect",
      "Pelvis AP",
    ],
    bodyPlaceholder: "e.g. Chest / Right Knee / Lumbar Spine",
    instructionsPlaceholder: "e.g. Remove metallic jewelry, upright PA view",
  },
  "CT Scan": {
    title: "CT Scan Management",
    subtitle:
      "Manage non-contrast and contrast CT requests, prep instructions, and scan status.",
    examTypes: [
      "CT Brain (Non-Contrast)",
      "CT Chest High-Resolution (HRCT)",
      "CT Abdomen & Pelvis (Contrast)",
      "CT Angiography (CTA)",
      "CT Spine",
    ],
    bodyPlaceholder: "e.g. Head / Brain, Thorax, Abdomen & Pelvis",
    instructionsPlaceholder:
      "e.g. NPO 4 hours, verify serum creatinine/eGFR prior to IV contrast",
  },
  MRI: {
    title: "MRI Examination Management",
    subtitle:
      "Manage MRI studies with mandatory patient metallic/implant safety screening.",
    examTypes: [
      "MRI Brain (With/Without Contrast)",
      "MRI Lumbar Spine",
      "MRI Knee Joint",
      "MRI Cardiac",
      "MRCP Abdomen",
    ],
    bodyPlaceholder: "e.g. Lumbar Spine (L1-S1), Brain, Right Shoulder",
    instructionsPlaceholder:
      "e.g. Remove all ferromagnetic items; ear protection required",
  },
  Ultrasound: {
    title: "Ultrasound Examination Management",
    subtitle:
      "Manage diagnostic and Doppler ultrasound requests, scheduling, and sonographer assignments.",
    examTypes: [
      "Abdominal & Pelvic Ultrasound",
      "Obstetric (OB) Ultrasound",
      "Thyroid & Neck Ultrasound",
      "Carotid Color Doppler",
      "Lower Limb Venous Doppler",
    ],
    bodyPlaceholder: "e.g. Abdomen / Pelvis, Thyroid, Lower Limb Vessels",
    instructionsPlaceholder:
      "e.g. Fasting 6 hours for abdominal scan; full bladder for pelvic scan",
  },
};

interface ModalitySectionProps {
  modality: RadiologyModality;
  patients: RadiologyPatient[];
  doctors: RadiologyDoctor[];
  requests: RadiologyRequest[];
  appointments: RadiologyAppointment[];
  images: RadiologyImage[];
  reports: RadiologyReport[];
  canCreate: boolean;
  canManageExam: boolean;
  onCreateRequest: (payload: {
    patientId: string;
    modality: RadiologyModality;
    examType: string;
    bodyRegion: string;
    clinicalIndication: string;
    instructions: string;
    mriScreening?: MriScreeningInfo;
    priority: "Routine" | "Urgent" | "STAT";
    referringDoctor: string;
    assignedTechnician: string;
    examDate: string;
    examTime: string;
  }) => Promise<boolean>;
  onUpdateRequest: (payload: {
    requestId: string;
    status?: "Pending" | "Scheduled" | "In Progress" | "Completed" | "Cancelled";
    assignedTechnician?: string;
    examDate?: string;
    examTime?: string;
  }) => Promise<void>;
  onNavigateRequest: (
    tab: "appointments" | "images" | "reports",
    requestId: string
  ) => void;
}

export function ModalitySection({
  modality,
  patients,
  doctors,
  requests,
  appointments,
  images,
  reports,
  canCreate,
  canManageExam,
  onCreateRequest,
  onUpdateRequest,
  onNavigateRequest,
}: ModalitySectionProps) {
  const preset = MODALITY_PRESETS[modality];
  const modalityRequests = requests.filter((r) => r.modality === modality);

  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [referringDoctor, setReferringDoctor] = useState(
    doctors[0]?.name ?? ""
  );
  const [examType, setExamType] = useState(preset.examTypes[0]);
  const [bodyRegion, setBodyRegion] = useState("");
  const [clinicalIndication, setClinicalIndication] = useState("");
  const [instructions, setInstructions] = useState("");
  const [priority, setPriority] = useState<"Routine" | "Urgent" | "STAT">(
    "Routine"
  );
  const [assignedTechnician, setAssignedTechnician] = useState("Tech Rohan Das");
  const [examDate, setExamDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [examTime, setExamTime] = useState("10:30");

  // MRI Screening fields
  const [pacemaker, setPacemaker] = useState(false);
  const [metalImplants, setMetalImplants] = useState(false);
  const [claustrophobia, setClaustrophobia] = useState(false);
  const [contrastAllergy, setContrastAllergy] = useState(false);
  const [renalCleared, setRenalCleared] = useState(true);
  const [screeningNotes, setScreeningNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [techEditById, setTechEditById] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onCreateRequest({
        patientId: patientId || patients[0]?.id || "",
        modality,
        examType,
        bodyRegion,
        clinicalIndication,
        instructions,
        mriScreening:
          modality === "MRI"
            ? {
                pacemaker,
                metalImplants,
                claustrophobia,
                contrastAllergy,
                renalCleared,
                screeningNotes,
              }
            : undefined,
        priority,
        referringDoctor: referringDoctor || doctors[0]?.name || "",
        assignedTechnician,
        examDate,
        examTime,
      });
      if (ok) {
        setBodyRegion("");
        setClinicalIndication("");
        setInstructions("");
        setScreeningNotes("");
        setPacemaker(false);
        setMetalImplants(false);
        setClaustrophobia(false);
        setContrastAllergy(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Modality Request Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
      >
        <h2 className="text-lg font-semibold text-[#14191B]">{preset.title}</h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">{preset.subtitle}</p>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    {p.fullName} ({p.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Referring Doctor *</label>
              <select
                value={referringDoctor || doctors[0]?.name || ""}
                onChange={(e) => setReferringDoctor(e.target.value)}
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Examination Type *</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              >
                {preset.examTypes.map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Priority *</label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "Routine" | "Urgent" | "STAT")
                }
                className={INPUT_CLASS}
                disabled={!canCreate}
              >
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Body Part / Region *</label>
            <input
              type="text"
              required
              value={bodyRegion}
              onChange={(e) => setBodyRegion(e.target.value)}
              placeholder={preset.bodyPlaceholder}
              className={INPUT_CLASS}
              disabled={!canCreate}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Clinical Indication *</label>
            <textarea
              rows={2}
              required
              value={clinicalIndication}
              onChange={(e) => setClinicalIndication(e.target.value)}
              placeholder="Symptoms, provisional diagnosis, or clinical question..."
              className={INPUT_CLASS}
              disabled={!canCreate}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>
              {modality === "CT Scan"
                ? "Contrast & Preparation Instructions"
                : "Examination Instructions"}
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={preset.instructionsPlaceholder}
              className={INPUT_CLASS}
              disabled={!canCreate}
            />
          </div>

          {modality === "MRI" && (
            <div className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-3.5">
              <p className="text-xs font-semibold text-[#14191B]">
                MRI Patient Safety Screening
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#3B484D]">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pacemaker}
                    onChange={(e) => setPacemaker(e.target.checked)}
                    disabled={!canCreate}
                  />
                  Pacemaker / ICD
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={metalImplants}
                    onChange={(e) => setMetalImplants(e.target.checked)}
                    disabled={!canCreate}
                  />
                  Metal Implants
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={claustrophobia}
                    onChange={(e) => setClaustrophobia(e.target.checked)}
                    disabled={!canCreate}
                  />
                  Claustrophobia
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={contrastAllergy}
                    onChange={(e) => setContrastAllergy(e.target.checked)}
                    disabled={!canCreate}
                  />
                  Contrast Allergy
                </label>
                <label className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={renalCleared}
                    onChange={(e) => setRenalCleared(e.target.checked)}
                    disabled={!canCreate}
                  />
                  Renal Function (eGFR) Cleared
                </label>
              </div>
              <input
                type="text"
                value={screeningNotes}
                onChange={(e) => setScreeningNotes(e.target.value)}
                placeholder="Screening clearance notes..."
                className={`${INPUT_CLASS} mt-2`}
                disabled={!canCreate}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={LABEL_CLASS}>Assigned Technician</label>
              <input
                type="text"
                value={assignedTechnician}
                onChange={(e) => setAssignedTechnician(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Exam Time</label>
              <input
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canCreate || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting
              ? `Creating ${modality} Request...`
              : `Create ${modality} Request`}
          </button>
        </div>
      </form>

      {/* Right: Modality Examinations List */}
      <div className="space-y-3 lg:col-span-7">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#14191B]">
                {modality} Requests & Examinations ({modalityRequests.length})
              </h3>
              <p className="text-xs text-[#6B7A80]">
                Track exam status, update technician assignment, and jump to
                appointments, images, or radiologist reports.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {modalityRequests.map((req) => {
              const linkedApt = appointments.find(
                (a) => a.requestId === req.id && a.status !== "Cancelled"
              );
              const linkedImages = images.filter((i) => i.requestId === req.id);
              const linkedReport = reports.find((r) => r.requestId === req.id);

              return (
                <div
                  key={req.id}
                  className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {req.id}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#47565C]">
                        {req.examinationId}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getRadiologyBadgeClass(req.status)}`}
                      >
                        {req.status}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getRadiologyBadgeClass(req.priority)}`}
                      >
                        {req.priority}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#6B7A80]">
                      {req.examDate || "Unscheduled"}{" "}
                      {req.examTime ? `• ${req.examTime}` : ""}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-[#14191B]">
                    {req.patientName} ({req.patientId}) — {req.examType}
                  </p>
                  <p className="mt-0.5 text-[#546369]">
                    Region: <strong>{req.bodyRegion}</strong> • Referring:{" "}
                    {req.referringDoctor} • Tech:{" "}
                    <strong>{req.assignedTechnician || "Unassigned"}</strong>
                  </p>
                  <p className="mt-1 text-[#6B7A80]">
                    Indication: {req.clinicalIndication}
                  </p>
                  {req.instructions && (
                    <p className="mt-1 text-[#4A90A4]">
                      Instructions: {req.instructions}
                    </p>
                  )}

                  {modality === "MRI" && req.mriScreening && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-[#47565C]">
                        Metal Implants:{" "}
                        {req.mriScreening.metalImplants ? "Yes" : "No"}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-[#47565C]">
                        Claustrophobia:{" "}
                        {req.mriScreening.claustrophobia ? "Yes" : "No"}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-[#47565C]">
                        Renal Cleared:{" "}
                        {req.mriScreening.renalCleared ? "Yes" : "No"}
                      </span>
                    </div>
                  )}

                  {/* Linked workflow indicators */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#E6EDEF] pt-3">
                    <button
                      type="button"
                      onClick={() => onNavigateRequest("appointments", req.id)}
                      className={SECONDARY_BTN_CLASS}
                    >
                      {linkedApt
                        ? `Appt: ${linkedApt.id} (${linkedApt.timeSlot})`
                        : "Schedule Appt →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateRequest("images", req.id)}
                      className={SECONDARY_BTN_CLASS}
                    >
                      Images ({linkedImages.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateRequest("reports", req.id)}
                      className={ACCENT_BTN_CLASS}
                    >
                      {linkedReport
                        ? `Report: ${linkedReport.status}`
                        : "Write Report →"}
                    </button>
                  </div>

                  {/* Exam Execution Controls */}
                  {canManageExam &&
                    req.status !== "Completed" &&
                    req.status !== "Cancelled" && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#E6EDEF] pt-3">
                        <input
                          type="text"
                          value={
                            techEditById[req.id] ?? req.assignedTechnician ?? ""
                          }
                          onChange={(e) =>
                            setTechEditById((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }))
                          }
                          placeholder="Assign technician..."
                          className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs text-[#14191B]"
                        />
                        {req.status !== "In Progress" && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateRequest({
                                requestId: req.id,
                                status: "In Progress",
                                assignedTechnician:
                                  techEditById[req.id] ?? req.assignedTechnician,
                              })
                            }
                            className={ACCENT_BTN_CLASS}
                          >
                            Start Exam
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateRequest({
                              requestId: req.id,
                              status: "Completed",
                              assignedTechnician:
                                techEditById[req.id] ?? req.assignedTechnician,
                            })
                          }
                          className={PRIMARY_BTN_CLASS}
                        >
                          Mark Completed
                        </button>
                      </div>
                    )}
                </div>
              );
            })}

            {modalityRequests.length === 0 && (
              <p className="rounded-[18px] bg-[#F8FAFA] py-8 text-center text-xs text-[#7D8C92]">
                No {modality} examinations recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
