"use client";

import React, { useState } from "react";
import type {
  RadiologyAppointment,
  RadiologyEquipment,
  RadiologyRequest,
} from "@/lib/radiology/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getRadiologyBadgeClass,
} from "./ui";

const TIME_SLOTS = [
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
];

interface ImagingAppointmentsSectionProps {
  requests: RadiologyRequest[];
  equipment: RadiologyEquipment[];
  appointments: RadiologyAppointment[];
  preselectedRequestId?: string;
  canManage: boolean;
  onCreateAppointment: (payload: {
    requestId: string;
    equipmentId: string;
    appointmentDate: string;
    timeSlot: string;
    note: string;
  }) => Promise<boolean>;
  onUpdateAppointment: (payload: {
    appointmentId: string;
    action: "reschedule" | "cancel";
    equipmentId?: string;
    appointmentDate?: string;
    timeSlot?: string;
    cancelReason?: string;
  }) => Promise<void>;
}

export function ImagingAppointmentsSection({
  requests,
  equipment,
  appointments,
  preselectedRequestId,
  canManage,
  onCreateAppointment,
  onUpdateAppointment,
}: ImagingAppointmentsSectionProps) {
  const bookedRequestIds = new Set(
    appointments
      .filter((a) => a.status !== "Cancelled")
      .map((a) => a.requestId)
  );

  const schedulableRequests = requests.filter(
    (r) =>
      r.status !== "Cancelled" &&
      r.status !== "Completed" &&
      !bookedRequestIds.has(r.id)
  );

  const [selectedRequestId, setSelectedRequestId] = useState(
    preselectedRequestId ?? ""
  );
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [timeSlot, setTimeSlot] = useState("10:00");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reschedule / cancel inline state
  const [rescheduleSlotById, setRescheduleSlotById] = useState<
    Record<string, string>
  >({});
  const [rescheduleDateById, setRescheduleDateById] = useState<
    Record<string, string>
  >({});

  const activeRequestId =
    selectedRequestId &&
    schedulableRequests.some((r) => r.id === selectedRequestId)
      ? selectedRequestId
      : preselectedRequestId &&
          schedulableRequests.some((r) => r.id === preselectedRequestId)
        ? preselectedRequestId
        : (schedulableRequests[0]?.id ?? "");

  const activeRequest = schedulableRequests.find(
    (r) => r.id === activeRequestId
  );

  const matchingEquipment = activeRequest
    ? equipment.filter((e) => e.modality === activeRequest.modality)
    : equipment;

  const activeEquipmentId =
    selectedEquipmentId &&
    matchingEquipment.some((e) => e.id === selectedEquipmentId)
      ? selectedEquipmentId
      : (matchingEquipment[0]?.id ?? "");

  const bookedSlotsForSelected = new Set(
    appointments
      .filter(
        (a) =>
          a.equipmentId === activeEquipmentId &&
          a.appointmentDate === appointmentDate &&
          a.status !== "Cancelled"
      )
      .map((a) => a.timeSlot)
  );

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRequestId || !activeEquipmentId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateAppointment({
        requestId: activeRequestId,
        equipmentId: activeEquipmentId,
        appointmentDate,
        timeSlot,
        note,
      });
      if (ok) {
        setNote("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Equipment Availability Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {equipment.map((eqp) => {
          const todayCount = appointments.filter(
            (a) =>
              a.equipmentId === eqp.id &&
              a.appointmentDate === appointmentDate &&
              a.status !== "Cancelled"
          ).length;
          return (
            <div
              key={eqp.id}
              className="rounded-[22px] border border-white/85 bg-[#EDF2F3] p-4 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#14191B]">{eqp.name}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getRadiologyBadgeClass(eqp.status)}`}
                >
                  {eqp.status}
                </span>
              </div>
              <p className="mt-1 text-[#6B7A80]">
                {eqp.modality} • {eqp.roomLocation}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-[#4A90A4]">
                {todayCount} booking(s) on {appointmentDate}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Schedule Appointment Form */}
        <form
          onSubmit={handleBook}
          className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
        >
          <h2 className="text-lg font-semibold text-[#14191B]">
            Schedule Imaging Appointment
          </h2>
          <p className="mt-0.5 text-xs text-[#6B7A80]">
            Matches request modality to available imaging equipment and prevents
            conflicting time-slot bookings.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className={LABEL_CLASS}>Pending Imaging Request *</label>
              <select
                value={activeRequestId}
                onChange={(e) => {
                  setSelectedRequestId(e.target.value);
                  setSelectedEquipmentId("");
                }}
                className={INPUT_CLASS}
                disabled={!canManage || schedulableRequests.length === 0}
              >
                {schedulableRequests.length === 0 ? (
                  <option value="">All active requests are scheduled</option>
                ) : (
                  schedulableRequests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} • {r.modality} — {r.patientName} ({r.examType})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Imaging Equipment *</label>
              <select
                value={activeEquipmentId}
                onChange={(e) => setSelectedEquipmentId(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canManage || matchingEquipment.length === 0}
              >
                {matchingEquipment.map((eqp) => (
                  <option key={eqp.id} value={eqp.id}>
                    {eqp.name} ({eqp.roomLocation})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Appointment Date *</label>
                <input
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className={INPUT_CLASS}
                  disabled={!canManage}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Time Slot *</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className={INPUT_CLASS}
                  disabled={!canManage}
                >
                  {TIME_SLOTS.map((slot) => {
                    const booked = bookedSlotsForSelected.has(slot);
                    return (
                      <option key={slot} value={slot}>
                        {slot} {booked ? "(Booked)" : "(Available)"}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Scheduling Notes</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Wheelchair transport, fasting check, etc."
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>

            <button
              type="submit"
              disabled={
                !canManage ||
                submitting ||
                !activeRequestId ||
                !activeEquipmentId
              }
              className={`${PRIMARY_BTN_CLASS} w-full`}
            >
              {submitting ? "Booking Slot..." : "Confirm Imaging Appointment"}
            </button>
          </div>
        </form>

        {/* Right: Appointments List + Reschedule / Cancel + History */}
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
          <h3 className="text-base font-semibold text-[#14191B]">
            Scheduled Imaging Appointments ({appointments.length})
          </h3>
          <div className="mt-4 space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {apt.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getRadiologyBadgeClass(apt.status)}`}
                    >
                      {apt.status}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#47565C]">
                      {apt.modality} • {apt.requestId}
                    </span>
                  </div>
                  <span className="font-semibold text-[#14191B]">
                    {apt.appointmentDate} • {apt.timeSlot}
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {apt.patientName} ({apt.patientId}) — {apt.examType}
                </p>
                <p className="mt-0.5 text-[#546369]">
                  Equipment: <strong>{apt.equipmentName}</strong> • Exam ID:{" "}
                  {apt.examinationId}
                </p>

                {canManage &&
                  apt.status !== "Completed" &&
                  apt.status !== "Cancelled" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#E6EDEF] pt-3">
                      <input
                        type="date"
                        value={rescheduleDateById[apt.id] ?? apt.appointmentDate}
                        onChange={(e) =>
                          setRescheduleDateById((prev) => ({
                            ...prev,
                            [apt.id]: e.target.value,
                          }))
                        }
                        className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
                      />
                      <select
                        value={rescheduleSlotById[apt.id] ?? apt.timeSlot}
                        onChange={(e) =>
                          setRescheduleSlotById((prev) => ({
                            ...prev,
                            [apt.id]: e.target.value,
                          }))
                        }
                        className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
                      >
                        {TIME_SLOTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateAppointment({
                            appointmentId: apt.id,
                            action: "reschedule",
                            appointmentDate:
                              rescheduleDateById[apt.id] ?? apt.appointmentDate,
                            timeSlot:
                              rescheduleSlotById[apt.id] ?? apt.timeSlot,
                          })
                        }
                        className={ACCENT_BTN_CLASS}
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateAppointment({
                            appointmentId: apt.id,
                            action: "cancel",
                            cancelReason: "Cancelled from Radiology Schedule",
                          })
                        }
                        className={DANGER_BTN_CLASS}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                {apt.schedulingHistory.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-[#E6EDEF] pt-2.5 text-[11px] text-[#6B7A80]">
                    {apt.schedulingHistory.map((h, idx) => (
                      <p key={`${apt.id}-h-${idx}`}>
                        <strong>{h.action}</strong> ({formatDateTime(h.timestamp)}
                        ) by {h.staff}: {h.note}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
