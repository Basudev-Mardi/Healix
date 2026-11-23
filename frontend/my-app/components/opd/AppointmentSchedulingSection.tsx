"use client";

import React, { useMemo, useState } from "react";
import type {
  OpdAppointment,
  OpdDoctor,
  OpdPatient,
  PriorityLevel,
} from "@/lib/opd/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  getStatusPillClass,
  getTodayDateString,
} from "./ui";

interface AppointmentSchedulingSectionProps {
  patients: OpdPatient[];
  doctors: OpdDoctor[];
  appointments: OpdAppointment[];
  preselectedPatientId?: string;
  canWrite: boolean;
  canGenerateToken: boolean;
  onCreateAppointment: (payload: {
    patientId: string;
    department: string;
    doctorId: string;
    date: string;
    timeSlot: string;
    priority: PriorityLevel;
    reason: string;
  }) => Promise<boolean>;
  onUpdateAppointment: (payload: {
    appointmentId: string;
    action: "reschedule" | "cancel";
    date?: string;
    timeSlot?: string;
    doctorId?: string;
    cancelReason?: string;
  }) => Promise<boolean>;
  onGenerateToken: (appointmentId: string) => Promise<void>;
}

export function AppointmentSchedulingSection({
  patients,
  doctors,
  appointments,
  preselectedPatientId,
  canWrite,
  canGenerateToken,
  onCreateAppointment,
  onUpdateAppointment,
  onGenerateToken,
}: AppointmentSchedulingSectionProps) {
  const departments = useMemo(
    () => Array.from(new Set(doctors.map((d) => d.department))),
    [doctors]
  );

  const [patientId, setPatientId] = useState(
    preselectedPatientId || patients[0]?.id || ""
  );
  const [department, setDepartment] = useState(departments[0] ?? "");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [date, setDate] = useState(getTodayDateString());
  const [timeSlot, setTimeSlot] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("Normal");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(getTodayDateString());
  const [rescheduleSlot, setRescheduleSlot] = useState("");

  const effectivePatientId =
    preselectedPatientId && patients.some((p) => p.id === preselectedPatientId)
      ? preselectedPatientId
      : patientId;

  const departmentDoctors = useMemo(
    () => doctors.filter((d) => d.department === department),
    [doctors, department]
  );

  const activeDoctor = useMemo(
    () =>
      departmentDoctors.find((d) => d.id === doctorId) ??
      departmentDoctors[0] ??
      null,
    [departmentDoctors, doctorId]
  );

  const bookedSlotsForSelected = useMemo(() => {
    if (!activeDoctor) return new Set<string>();
    return new Set(
      appointments
        .filter(
          (a) =>
            a.doctorId === activeDoctor.id &&
            a.date === date &&
            a.status !== "Cancelled"
        )
        .map((a) => a.timeSlot)
    );
  }, [appointments, activeDoctor, date]);

  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, p])),
    [patients]
  );
  const doctorMap = useMemo(
    () => new Map(doctors.map((d) => [d.id, d])),
    [doctors]
  );

  const filteredAppointments = useMemo(() => {
    if (statusFilter === "All") return appointments;
    return appointments.filter((a) => a.status === statusFilter);
  }, [appointments, statusFilter]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !activeDoctor || !effectivePatientId || !timeSlot) return;
    setSubmitting(true);
    try {
      const ok = await onCreateAppointment({
        patientId: effectivePatientId,
        department: activeDoctor.department,
        doctorId: activeDoctor.id,
        date,
        timeSlot,
        priority,
        reason,
      });
      if (ok) {
        setTimeSlot("");
        setReason("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmReschedule(apt: OpdAppointment) {
    if (!rescheduleDate || !rescheduleSlot) return;
    const ok = await onUpdateAppointment({
      appointmentId: apt.id,
      action: "reschedule",
      date: rescheduleDate,
      timeSlot: rescheduleSlot,
      doctorId: apt.doctorId,
    });
    if (ok) {
      setRescheduleId(null);
      setRescheduleSlot("");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Booking Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Schedule OPD Appointment
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Validates doctor availability and prevents conflicting slot
              bookings.
            </p>
          </div>
          {!canWrite && (
            <span className="rounded-full bg-[#DDE5E7] px-3 py-1 text-[11px] font-medium text-[#4B5A60]">
              Read-only
            </span>
          )}
        </div>

        <form onSubmit={handleBook} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Patient *</label>
            <select
              required
              disabled={!canWrite}
              value={effectivePatientId}
              onChange={(e) => setPatientId(e.target.value)}
              className={INPUT_CLASS}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Department *</label>
              <select
                required
                disabled={!canWrite}
                value={department}
                onChange={(e) => {
                  const nextDept = e.target.value;
                  setDepartment(nextDept);
                  const firstDoc = doctors.find(
                    (d) => d.department === nextDept
                  );
                  if (firstDoc) setDoctorId(firstDoc.id);
                  setTimeSlot("");
                }}
                className={INPUT_CLASS}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Doctor *</label>
              <select
                required
                disabled={!canWrite}
                value={activeDoctor?.id ?? ""}
                onChange={(e) => {
                  setDoctorId(e.target.value);
                  setTimeSlot("");
                }}
                className={INPUT_CLASS}
              >
                {departmentDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.room})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Appointment Date *</label>
              <input
                type="date"
                required
                disabled={!canWrite}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTimeSlot("");
                }}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Priority</label>
              <select
                disabled={!canWrite}
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className={INPUT_CLASS}
              >
                <option value="Normal">Normal</option>
                <option value="Priority">Priority</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Interactive Slot Picker */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-[#47565C]">
                Available Time Slots *
              </label>
              <span className="text-[11px] text-[#718086]">
                {activeDoctor
                  ? `${activeDoctor.slots.length - bookedSlotsForSelected.size} open`
                  : ""}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 rounded-[20px] bg-white p-3">
              {(activeDoctor?.slots ?? []).map((slot) => {
                const isBooked = bookedSlotsForSelected.has(slot);
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
            <label className={LABEL_CLASS}>Chief Complaint / Reason</label>
            <input
              type="text"
              disabled={!canWrite}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Persistent cough & fever"
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canWrite || !timeSlot || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Booking..." : "Confirm Appointment"}
            </button>
          </div>
        </form>
      </div>

      {/* Appointments List */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Scheduled Appointments
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Track status, reschedule, cancel, or check in to generate an OPD
              token.
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-white bg-white px-4 py-2 text-xs font-medium text-[#14191B] focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Checked In">Checked In</option>
            <option value="In Consultation">In Consultation</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
              No appointments match this filter.
            </p>
          ) : (
            filteredAppointments.map((apt) => {
              const patient = patientMap.get(apt.patientId);
              const doc = doctorMap.get(apt.doctorId);
              const isRescheduling = rescheduleId === apt.id;
              const canCheckIn =
                canGenerateToken &&
                !apt.tokenId &&
                (apt.status === "Scheduled" || apt.status === "Rescheduled");
              const canModify =
                canWrite &&
                apt.status !== "Completed" &&
                apt.status !== "Cancelled";

              const rescheduleBooked = new Set(
                appointments
                  .filter(
                    (other) =>
                      other.id !== apt.id &&
                      other.doctorId === apt.doctorId &&
                      other.date === rescheduleDate &&
                      other.status !== "Cancelled"
                  )
                  .map((other) => other.timeSlot)
              );

              return (
                <div
                  key={apt.id}
                  className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                          {apt.id}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusPillClass(apt.status)}`}
                        >
                          {apt.status}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#546369]">
                          {apt.visitType}
                        </span>
                        {apt.tokenId && (
                          <span className="rounded-full bg-[#8FC1CE]/25 px-2.5 py-0.5 text-[11px] font-semibold text-[#1E505E]">
                            Token: {apt.tokenId}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[#14191B]">
                        {patient?.fullName ?? apt.patientId}{" "}
                        <span className="font-normal text-[#738288]">
                          ({apt.patientId})
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-[#6B7A80]">
                        {doc?.name ?? apt.doctorId} • {apt.department} •{" "}
                        {apt.date} at {apt.timeSlot}
                      </p>
                      <p className="mt-1 text-xs text-[#546369]">
                        Reason: {apt.reason}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {canCheckIn && (
                        <button
                          type="button"
                          onClick={() => onGenerateToken(apt.id)}
                          className={ACCENT_BTN_CLASS}
                        >
                          Check In &amp; Token
                        </button>
                      )}
                      {canModify && (
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleId(isRescheduling ? null : apt.id);
                            setRescheduleDate(apt.date);
                            setRescheduleSlot("");
                          }}
                          className={SECONDARY_BTN_CLASS}
                        >
                          {isRescheduling ? "Close" : "Reschedule"}
                        </button>
                      )}
                      {canModify && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateAppointment({
                              appointmentId: apt.id,
                              action: "cancel",
                              cancelReason: "Cancelled via OPD Desk",
                            })
                          }
                          className={DANGER_BTN_CLASS}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {isRescheduling && doc && (
                    <div className="mt-4 rounded-[18px] border border-[#DCE5E8] bg-white p-3.5">
                      <p className="text-xs font-semibold text-[#14191B]">
                        Reschedule {apt.id} ({doc.name})
                      </p>
                      <div className="mt-2.5 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="sm:w-44">
                          <label className={LABEL_CLASS}>New Date</label>
                          <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => {
                              setRescheduleDate(e.target.value);
                              setRescheduleSlot("");
                            }}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div className="flex-1">
                          <label className={LABEL_CLASS}>New Slot</label>
                          <select
                            value={rescheduleSlot}
                            onChange={(e) => setRescheduleSlot(e.target.value)}
                            className={INPUT_CLASS}
                          >
                            <option value="">Select available slot</option>
                            {doc.slots.map((slot) => (
                              <option
                                key={slot}
                                value={slot}
                                disabled={rescheduleBooked.has(slot)}
                              >
                                {slot}
                                {rescheduleBooked.has(slot) ? " (Booked)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          disabled={!rescheduleSlot}
                          onClick={() => handleConfirmReschedule(apt)}
                          className={PRIMARY_BTN_CLASS}
                        >
                          Save Slot
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
