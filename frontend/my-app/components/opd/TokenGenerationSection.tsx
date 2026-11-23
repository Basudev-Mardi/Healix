"use client";

import React, { useMemo, useState } from "react";
import type {
  OpdAppointment,
  OpdDoctor,
  OpdPatient,
  OpdToken,
  PriorityLevel,
} from "@/lib/opd/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  getStatusPillClass,
} from "./ui";

interface TokenGenerationSectionProps {
  appointments: OpdAppointment[];
  tokens: OpdToken[];
  patients: OpdPatient[];
  doctors: OpdDoctor[];
  canWrite: boolean;
  onGenerateToken: (
    appointmentId: string,
    priority?: PriorityLevel
  ) => Promise<void>;
}

export function TokenGenerationSection({
  appointments,
  tokens,
  patients,
  doctors,
  canWrite,
  onGenerateToken,
}: TokenGenerationSectionProps) {
  const eligibleAppointments = useMemo(
    () =>
      appointments.filter(
        (a) =>
          !a.tokenId &&
          (a.status === "Scheduled" || a.status === "Rescheduled")
      ),
    [appointments]
  );

  const [selectedAppointmentId, setSelectedAppointmentId] = useState(
    eligibleAppointments[0]?.id ?? ""
  );
  const [priority, setPriority] = useState<PriorityLevel>("Normal");
  const [submitting, setSubmitting] = useState(false);

  const effectiveAppointmentId = eligibleAppointments.some(
    (a) => a.id === selectedAppointmentId
  )
    ? selectedAppointmentId
    : (eligibleAppointments[0]?.id ?? "");

  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, p])),
    [patients]
  );
  const doctorMap = useMemo(
    () => new Map(doctors.map((d) => [d.id, d])),
    [doctors]
  );

  const orderedTokens = useMemo(
    () => [...tokens].sort((a, b) => b.sequence - a.sequence),
    [tokens]
  );

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !effectiveAppointmentId) return;
    setSubmitting(true);
    try {
      await onGenerateToken(effectiveAppointmentId, priority);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Generate Token Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Generate OPD Token
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Issue a unique sequential token for any scheduled appointment or
            follow-up visit.
          </p>
        </div>

        {eligibleAppointments.length === 0 ? (
          <div className="rounded-[20px] bg-[#F8FAFA] p-5 text-xs text-[#6B7A80]">
            All active appointments already have tokens assigned. Schedule a new
            appointment or register a walk-in to issue another token.
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>
                Select Eligible Appointment *
              </label>
              <select
                required
                disabled={!canWrite}
                value={effectiveAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                className={INPUT_CLASS}
              >
                {eligibleAppointments.map((apt) => {
                  const patient = patientMap.get(apt.patientId);
                  const doc = doctorMap.get(apt.doctorId);
                  return (
                    <option key={apt.id} value={apt.id}>
                      {apt.id} — {patient?.fullName ?? apt.patientId} •{" "}
                      {doc?.name ?? apt.doctorId} ({apt.date} {apt.timeSlot})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Queue Priority</label>
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

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!canWrite || submitting}
                className={PRIMARY_BTN_CLASS}
              >
                {submitting ? "Generating..." : "Issue Sequential Token"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Token Sequence Ledger */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Token Sequence Ledger
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Consistent linkage across Token ID, Patient ID, Doctor, and
              Appointment ID.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {tokens.length} issued
          </span>
        </div>

        <div className="space-y-2.5">
          {orderedTokens.map((token) => {
            const patient = patientMap.get(token.patientId);
            const doc = doctorMap.get(token.doctorId);
            return (
              <div
                key={token.id}
                className="flex flex-col justify-between gap-3 rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#181C1E] px-3 py-0.5 text-xs font-semibold text-white">
                      {token.tokenNumber}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#546369]">
                      {token.visitType}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusPillClass(token.priority)}`}
                    >
                      {token.priority}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-[#14191B]">
                    {patient?.fullName ?? token.patientId}{" "}
                    <span className="font-normal text-[#738288]">
                      ({token.patientId})
                    </span>
                  </p>
                  <p className="text-xs text-[#6B7A80]">
                    {doc?.name ?? token.doctorId} • {token.department} • Appt{" "}
                    {token.appointmentId} • {token.id}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusPillClass(token.status)}`}
                  >
                    {token.status}
                  </span>
                  <span className="text-[11px] text-[#7A898F]">
                    Seq #{token.sequence} • {token.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
