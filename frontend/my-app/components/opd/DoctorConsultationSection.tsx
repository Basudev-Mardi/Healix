"use client";

import React, { useMemo, useState } from "react";
import type {
  ConsultationStatus,
  OpdAppointment,
  OpdConsultation,
  OpdDoctor,
  OpdPatient,
  OpdToken,
} from "@/lib/opd/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  getStatusPillClass,
} from "./ui";

interface DoctorConsultationSectionProps {
  doctors: OpdDoctor[];
  patients: OpdPatient[];
  appointments: OpdAppointment[];
  tokens: OpdToken[];
  consultations: OpdConsultation[];
  preselectedTokenId?: string;
  canWrite: boolean;
  onSaveConsultation: (payload: {
    tokenId: string;
    vitals: {
      bloodPressure: string;
      temperature: string;
      pulse: string;
      spo2: string;
    };
    symptoms: string;
    observations: string;
    diagnosis: string;
    clinicalNotes: string;
    treatment: string;
    status: ConsultationStatus;
  }) => Promise<OpdConsultation | null>;
  onScheduleFollowUp: (consultationId: string) => void;
}

export function DoctorConsultationSection({
  doctors,
  patients,
  appointments,
  tokens,
  consultations,
  preselectedTokenId,
  canWrite,
  onSaveConsultation,
  onScheduleFollowUp,
}: DoctorConsultationSectionProps) {
  const initialToken = useMemo(() => {
    if (preselectedTokenId) {
      const found = tokens.find((t) => t.id === preselectedTokenId);
      if (found) return found;
    }
    return (
      tokens.find(
        (t) =>
          t.status === "In Consultation" ||
          t.status === "Called" ||
          t.status === "Waiting"
      ) ?? tokens[0]
    );
  }, [tokens, preselectedTokenId]);

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    initialToken?.doctorId ?? doctors[0]?.id ?? ""
  );
  const [selectedTokenId, setSelectedTokenId] = useState<string>(
    initialToken?.id ?? ""
  );
  const [submitting, setSubmitting] = useState(false);

  const effectiveTokenId =
    preselectedTokenId && tokens.some((t) => t.id === preselectedTokenId)
      ? preselectedTokenId
      : selectedTokenId;

  const activeToken =
    tokens.find((t) => t.id === effectiveTokenId) ?? null;

  const activeDoctorId = activeToken?.doctorId ?? selectedDoctorId;

  const doctorQueue = useMemo(
    () =>
      tokens
        .filter(
          (t) =>
            t.doctorId === activeDoctorId &&
            t.status !== "Cancelled"
        )
        .sort((a, b) => a.sequence - b.sequence),
    [tokens, activeDoctorId]
  );

  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, p])),
    [patients]
  );
  const appointmentMap = useMemo(
    () => new Map(appointments.map((a) => [a.id, a])),
    [appointments]
  );
  const doctorMap = useMemo(
    () => new Map(doctors.map((d) => [d.id, d])),
    [doctors]
  );

  const activePatient = activeToken
    ? patientMap.get(activeToken.patientId) ?? null
    : null;
  const activeAppointment = activeToken
    ? appointmentMap.get(activeToken.appointmentId) ?? null
    : null;
  const existingConsultation = activeToken
    ? consultations.find((c) => c.tokenId === activeToken.id) ?? null
    : null;

  const patientHistory = useMemo(() => {
    if (!activePatient) return [];
    return consultations.filter(
      (c) =>
        c.patientId === activePatient.id &&
        c.id !== existingConsultation?.id
    );
  }, [consultations, activePatient, existingConsultation]);

  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        bloodPressure: string;
        temperature: string;
        pulse: string;
        spo2: string;
        symptoms: string;
        observations: string;
        diagnosis: string;
        clinicalNotes: string;
        treatment: string;
      }
    >
  >({});

  const formState = useMemo(() => {
    if (!activeToken) {
      return {
        bloodPressure: "120/80 mmHg",
        temperature: "98.6 °F",
        pulse: "74 bpm",
        spo2: "99%",
        symptoms: "",
        observations: "",
        diagnosis: "",
        clinicalNotes: "",
        treatment: "",
      };
    }
    if (drafts[activeToken.id]) return drafts[activeToken.id];
    if (existingConsultation) {
      return {
        bloodPressure: existingConsultation.vitals.bloodPressure,
        temperature: existingConsultation.vitals.temperature,
        pulse: existingConsultation.vitals.pulse,
        spo2: existingConsultation.vitals.spo2,
        symptoms: existingConsultation.symptoms,
        observations: existingConsultation.observations,
        diagnosis: existingConsultation.diagnosis,
        clinicalNotes: existingConsultation.clinicalNotes,
        treatment: existingConsultation.treatment,
      };
    }
    return {
      bloodPressure: "120/80 mmHg",
      temperature: "98.6 °F",
      pulse: "74 bpm",
      spo2: "99%",
      symptoms: activeAppointment?.reason ?? "",
      observations: "",
      diagnosis: "",
      clinicalNotes: "",
      treatment: "",
    };
  }, [activeToken, drafts, existingConsultation, activeAppointment]);

  function updateField(field: keyof typeof formState, value: string) {
    if (!activeToken) return;
    setDrafts((prev) => ({
      ...prev,
      [activeToken.id]: {
        ...formState,
        [field]: value,
      },
    }));
  }

  async function submitConsultation(status: ConsultationStatus) {
    if (!canWrite || !activeToken) return;
    setSubmitting(true);
    try {
      await onSaveConsultation({
        tokenId: activeToken.id,
        vitals: {
          bloodPressure: formState.bloodPressure,
          temperature: formState.temperature,
          pulse: formState.pulse,
          spo2: formState.spo2,
        },
        symptoms: formState.symptoms,
        observations: formState.observations,
        diagnosis: formState.diagnosis,
        clinicalNotes: formState.clinicalNotes,
        treatment: formState.treatment,
        status,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Left: Doctor Selector & Assigned Queue */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 xl:col-span-4">
        <h2 className="text-lg font-semibold text-[#14191B]">
          Doctor&apos;s Assigned Queue
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Select a doctor and open a queued patient to record clinical notes.
        </p>

        <div className="mt-4">
          <label className={LABEL_CLASS}>Consulting Doctor</label>
          <select
            value={activeDoctorId}
            onChange={(e) => {
              const nextDoc = e.target.value;
              setSelectedDoctorId(nextDoc);
              const firstForDoc = tokens.find(
                (t) => t.doctorId === nextDoc && t.status !== "Cancelled"
              );
              setSelectedTokenId(firstForDoc?.id ?? "");
            }}
            className={INPUT_CLASS}
          >
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} ({doc.department})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-2.5">
          {doctorQueue.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-4 text-center text-xs text-[#738288]">
              No tokens assigned to this doctor yet.
            </p>
          ) : (
            doctorQueue.map((tkn) => {
              const patient = patientMap.get(tkn.patientId);
              const isSelected = activeToken?.id === tkn.id;
              return (
                <button
                  key={tkn.id}
                  type="button"
                  onClick={() => setSelectedTokenId(tkn.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-[20px] border p-3.5 text-left transition ${
                    isSelected
                      ? "border-[#4A90A4] bg-white shadow-xs"
                      : "border-white/90 bg-[#F8FAFA] hover:bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#14191B]">
                      {tkn.tokenNumber} • {patient?.fullName ?? tkn.patientId}
                    </p>
                    <p className="text-[11px] text-[#6B7A80]">
                      {tkn.patientId} • {tkn.visitType}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getStatusPillClass(tkn.status)}`}
                  >
                    {tkn.status}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Consultation Editor + Patient History */}
      <div className="space-y-6 xl:col-span-8">
        {!activeToken || !activePatient ? (
          <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-8 text-center text-sm text-[#6B7A80]">
            Select a patient token from the doctor&apos;s queue to begin
            consultation.
          </div>
        ) : (
          <>
            {/* Patient Banner */}
            <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#181C1E] px-3 py-0.5 text-xs font-semibold text-white">
                      {activeToken.tokenNumber}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#546369]">
                      {activePatient.id}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#546369]">
                      Appt {activeToken.appointmentId}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusPillClass(activeToken.status)}`}
                    >
                      {activeToken.status}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-[#14191B]">
                    {activePatient.fullName}
                  </h3>
                  <p className="text-xs text-[#6B7A80]">
                    {activePatient.gender} • DOB {activePatient.dateOfBirth} •
                    Blood {activePatient.bloodGroup} • Allergies:{" "}
                    <span className="font-semibold text-[#EF5B3A]">
                      {activePatient.allergies}
                    </span>
                  </p>
                </div>

                {existingConsultation?.status === "Completed" && (
                  <button
                    type="button"
                    onClick={() => onScheduleFollowUp(existingConsultation.id)}
                    className={ACCENT_BTN_CLASS}
                  >
                    Schedule Follow-up Visit
                  </button>
                )}
              </div>

              {/* Clinical Form */}
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <label className={LABEL_CLASS}>Blood Pressure</label>
                    <input
                      type="text"
                      disabled={!canWrite}
                      value={formState.bloodPressure}
                      onChange={(e) =>
                        updateField("bloodPressure", e.target.value)
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Temperature</label>
                    <input
                      type="text"
                      disabled={!canWrite}
                      value={formState.temperature}
                      onChange={(e) =>
                        updateField("temperature", e.target.value)
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Pulse</label>
                    <input
                      type="text"
                      disabled={!canWrite}
                      value={formState.pulse}
                      onChange={(e) => updateField("pulse", e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>SpO2</label>
                    <input
                      type="text"
                      disabled={!canWrite}
                      value={formState.spo2}
                      onChange={(e) => updateField("spo2", e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLASS}>Symptoms *</label>
                    <textarea
                      rows={3}
                      required
                      disabled={!canWrite}
                      value={formState.symptoms}
                      onChange={(e) => updateField("symptoms", e.target.value)}
                      placeholder="Presenting symptoms and duration..."
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>
                      Clinical Observations
                    </label>
                    <textarea
                      rows={3}
                      disabled={!canWrite}
                      value={formState.observations}
                      onChange={(e) =>
                        updateField("observations", e.target.value)
                      }
                      placeholder="Physical examination findings..."
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
                    value={formState.diagnosis}
                    onChange={(e) => updateField("diagnosis", e.target.value)}
                    placeholder="Primary / provisional diagnosis"
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLASS}>
                      Treatment &amp; Prescription *
                    </label>
                    <textarea
                      rows={3}
                      required
                      disabled={!canWrite}
                      value={formState.treatment}
                      onChange={(e) => updateField("treatment", e.target.value)}
                      placeholder="Medications, dosage, tests, lifestyle advice..."
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Clinical Notes</label>
                    <textarea
                      rows={3}
                      disabled={!canWrite}
                      value={formState.clinicalNotes}
                      onChange={(e) =>
                        updateField("clinicalNotes", e.target.value)
                      }
                      placeholder="Additional remarks or care instructions..."
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {!canWrite ? (
                    <span className="text-xs font-medium text-[#738288]">
                      Switch role to Doctor, Hospital Administrator, or Super
                      Admin to record consultations.
                    </span>
                  ) : (
                    <span className="text-xs text-[#6B7A80]">
                      Completing consultation updates Token &amp; Appointment
                      status automatically.
                    </span>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!canWrite || submitting}
                      onClick={() => submitConsultation("In Progress")}
                      className={SECONDARY_BTN_CLASS}
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      disabled={!canWrite || submitting}
                      onClick={() => submitConsultation("Completed")}
                      className={PRIMARY_BTN_CLASS}
                    >
                      {submitting
                        ? "Saving..."
                        : "Save & Complete Consultation"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient's Previous Consultation History */}
            <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
              <h3 className="text-base font-semibold text-[#14191B]">
                Patient Medical &amp; Consultation History ({patientHistory.length})
              </h3>
              <p className="mt-0.5 text-xs text-[#6B7A80]">
                Prior OPD consultations for {activePatient.fullName}.
              </p>

              <div className="mt-4 space-y-3">
                {patientHistory.length === 0 ? (
                  <p className="rounded-[18px] bg-[#F8FAFA] p-4 text-xs text-[#738288]">
                    No prior consultations recorded for this patient.
                  </p>
                ) : (
                  patientHistory.map((item) => {
                    const doc = doctorMap.get(item.doctorId);
                    return (
                      <div
                        key={item.id}
                        className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-[#14191B]">
                            {item.visitDate} • {item.diagnosis}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                            {doc?.name ?? item.doctorId} ({item.id})
                          </span>
                        </div>
                        <p className="mt-1.5 text-[#546369]">
                          <strong>Treatment:</strong> {item.treatment}
                        </p>
                        {item.clinicalNotes && (
                          <p className="mt-1 text-[#6B7A80]">
                            <strong>Notes:</strong> {item.clinicalNotes}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
