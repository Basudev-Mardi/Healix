"use client";

import React, { useMemo, useState } from "react";
import type {
  FollowUpStatus,
  OpdAppointment,
  OpdConsultation,
  OpdDoctor,
  OpdFollowUp,
  OpdPatient,
} from "@/lib/opd/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  getStatusPillClass,
  getTodayDateString,
} from "./ui";

interface FollowUpVisitsSectionProps {
  consultations: OpdConsultation[];
  followUps: OpdFollowUp[];
  appointments: OpdAppointment[];
  patients: OpdPatient[];
  doctors: OpdDoctor[];
  preselectedConsultationId?: string;
  canWrite: boolean;
  canGenerateToken: boolean;
  onScheduleFollowUp: (payload: {
    originalConsultationId: string;
    scheduledDate: string;
    timeSlot: string;
    doctorId: string;
    instructions: string;
  }) => Promise<boolean>;
  onUpdateFollowUpStatus: (
    followUpId: string,
    status: FollowUpStatus
  ) => Promise<void>;
  onCheckInFollowUp: (appointmentId: string) => Promise<void>;
}

export function FollowUpVisitsSection({
  consultations,
  followUps,
  appointments,
  patients,
  doctors,
  preselectedConsultationId,
  canWrite,
  canGenerateToken,
  onScheduleFollowUp,
  onUpdateFollowUpStatus,
  onCheckInFollowUp,
}: FollowUpVisitsSectionProps) {
  const completedConsultations = useMemo(
    () => consultations.filter((c) => c.status === "Completed"),
    [consultations]
  );

  const [consultationId, setConsultationId] = useState(
    preselectedConsultationId || completedConsultations[0]?.id || ""
  );
  const [scheduledDate, setScheduledDate] = useState(getTodayDateString());
  const [timeSlot, setTimeSlot] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveConsultationId =
    preselectedConsultationId &&
    completedConsultations.some((c) => c.id === preselectedConsultationId)
      ? preselectedConsultationId
      : completedConsultations.some((c) => c.id === consultationId)
        ? consultationId
        : (completedConsultations[0]?.id ?? "");

  const selectedConsultation =
    completedConsultations.find((c) => c.id === effectiveConsultationId) ??
    null;

  const doctorMap = useMemo(
    () => new Map(doctors.map((d) => [d.id, d])),
    [doctors]
  );
  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, p])),
    [patients]
  );
  const appointmentMap = useMemo(
    () => new Map(appointments.map((a) => [a.id, a])),
    [appointments]
  );

  const targetDoctor = selectedConsultation
    ? doctorMap.get(selectedConsultation.doctorId) ?? null
    : null;

  const bookedSlots = useMemo(() => {
    if (!targetDoctor) return new Set<string>();
    return new Set(
      appointments
        .filter(
          (a) =>
            a.doctorId === targetDoctor.id &&
            a.date === scheduledDate &&
            a.status !== "Cancelled"
        )
        .map((a) => a.timeSlot)
    );
  }, [appointments, targetDoctor, scheduledDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !selectedConsultation || !timeSlot) return;
    setSubmitting(true);
    try {
      const ok = await onScheduleFollowUp({
        originalConsultationId: selectedConsultation.id,
        scheduledDate,
        timeSlot,
        doctorId: selectedConsultation.doctorId,
        instructions,
      });
      if (ok) {
        setTimeSlot("");
        setInstructions("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Schedule Follow-up Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Schedule Follow-up Visit
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Links the follow-up appointment directly to the original
            consultation record.
          </p>
        </div>

        {completedConsultations.length === 0 ? (
          <p className="rounded-[18px] bg-[#F8FAFA] p-5 text-xs text-[#738288]">
            Complete a doctor consultation first to schedule a linked follow-up
            visit.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Original Consultation *</label>
              <select
                required
                disabled={!canWrite}
                value={effectiveConsultationId}
                onChange={(e) => {
                  setConsultationId(e.target.value);
                  setTimeSlot("");
                }}
                className={INPUT_CLASS}
              >
                {completedConsultations.map((c) => {
                  const patient = patientMap.get(c.patientId);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.id} — {patient?.fullName ?? c.patientId} ({c.diagnosis})
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedConsultation && targetDoctor && (
              <div className="rounded-[18px] bg-white p-3.5 text-xs text-[#546369]">
                <p className="font-semibold text-[#14191B]">
                  {targetDoctor.name} • {targetDoctor.department}
                </p>
                <p className="mt-0.5">
                  Patient: {patientMap.get(selectedConsultation.patientId)?.fullName}{" "}
                  ({selectedConsultation.patientId})
                </p>
              </div>
            )}

            <div>
              <label className={LABEL_CLASS}>Follow-up Date *</label>
              <input
                type="date"
                required
                disabled={!canWrite}
                value={scheduledDate}
                onChange={(e) => {
                  setScheduledDate(e.target.value);
                  setTimeSlot("");
                }}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Available Time Slot *</label>
              <div className="grid grid-cols-4 gap-2 rounded-[20px] bg-white p-3">
                {(targetDoctor?.slots ?? []).map((slot) => {
                  const isBooked = bookedSlots.has(slot);
                  const isSelected = timeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={!canWrite || isBooked}
                      onClick={() => setTimeSlot(slot)}
                      className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition ${
                        isBooked
                          ? "cursor-not-allowed bg-[#F1F4F5] text-[#A4B0B5] line-through"
                          : isSelected
                            ? "bg-[#181C1E] text-white"
                            : "bg-[#EDF2F3] text-[#1D2529] hover:bg-[#8FC1CE] hover:text-white"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Follow-up Instructions</label>
              <textarea
                rows={3}
                disabled={!canWrite}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Lab reports to bring, medication review notes..."
                className={INPUT_CLASS}
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!canWrite || !timeSlot || submitting}
                className={PRIMARY_BTN_CLASS}
              >
                {submitting ? "Scheduling..." : "Schedule Follow-up"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Follow-up Tracker */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Upcoming &amp; Completed Follow-ups
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Check in returning follow-up patients directly into the OPD Token
              &amp; Queue flow.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {followUps.length} linked
          </span>
        </div>

        <div className="space-y-3">
          {followUps.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No follow-up visits scheduled yet.
            </p>
          ) : (
            followUps.map((fup) => {
              const patient = patientMap.get(fup.patientId);
              const doc = doctorMap.get(fup.doctorId);
              const linkedApt = appointmentMap.get(fup.followUpAppointmentId);
              const canCheckIn =
                canGenerateToken &&
                fup.status === "Upcoming" &&
                linkedApt &&
                !linkedApt.tokenId;

              return (
                <div
                  key={fup.id}
                  className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                          {fup.id}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusPillClass(fup.status)}`}
                        >
                          {fup.status}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                          From {fup.originalConsultationId}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                          Appt {fup.followUpAppointmentId}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[#14191B]">
                        {patient?.fullName ?? fup.patientId} ({fup.patientId})
                      </p>
                      <p className="text-xs text-[#6B7A80]">
                        {doc?.name ?? fup.doctorId} • {fup.department} •{" "}
                        {fup.scheduledDate} at {fup.timeSlot}
                      </p>
                      <p className="mt-1 text-xs text-[#546369]">
                        {fup.instructions}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {canCheckIn && (
                        <button
                          type="button"
                          onClick={() =>
                            onCheckInFollowUp(fup.followUpAppointmentId)
                          }
                          className={ACCENT_BTN_CLASS}
                        >
                          Check In &amp; Token
                        </button>
                      )}
                      {canWrite && fup.status === "Upcoming" && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateFollowUpStatus(fup.id, "Cancelled")
                          }
                          className={DANGER_BTN_CLASS}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
