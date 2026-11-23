"use client";

import React, { useMemo, useState } from "react";
import type {
  OpdConsultation,
  OpdDoctor,
  OpdFollowUp,
  OpdPatient,
} from "@/lib/opd/types";
import { getStatusPillClass } from "./ui";

interface ConsultationHistorySectionProps {
  consultations: OpdConsultation[];
  patients: OpdPatient[];
  doctors: OpdDoctor[];
  followUps: OpdFollowUp[];
  preselectedPatientId?: string;
  canRead: boolean;
}

export function ConsultationHistorySection({
  consultations,
  patients,
  doctors,
  followUps,
  preselectedPatientId,
  canRead,
}: ConsultationHistorySectionProps) {
  const [patientFilter, setPatientFilter] = useState<string>(
    preselectedPatientId || "All"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const effectivePatientFilter =
    preselectedPatientId &&
    (preselectedPatientId === "All" ||
      patients.some((p) => p.id === preselectedPatientId))
      ? preselectedPatientId
      : patientFilter;

  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, p])),
    [patients]
  );
  const doctorMap = useMemo(
    () => new Map(doctors.map((d) => [d.id, d])),
    [doctors]
  );
  const followUpByConsultation = useMemo(
    () => new Map(followUps.map((f) => [f.originalConsultationId, f])),
    [followUps]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...consultations]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((c) => {
        if (
          effectivePatientFilter !== "All" &&
          c.patientId !== effectivePatientFilter
        ) {
          return false;
        }
        if (!q) return true;
        const patient = patientMap.get(c.patientId);
        const doc = doctorMap.get(c.doctorId);
        return (
          c.id.toLowerCase().includes(q) ||
          c.diagnosis.toLowerCase().includes(q) ||
          c.symptoms.toLowerCase().includes(q) ||
          c.treatment.toLowerCase().includes(q) ||
          (patient?.fullName.toLowerCase().includes(q) ?? false) ||
          (doc?.name.toLowerCase().includes(q) ?? false)
        );
      });
  }, [consultations, effectivePatientFilter, searchQuery, patientMap, doctorMap]);

  if (!canRead) {
    return (
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-8 text-center text-sm text-[#6B7A80]">
        Your active role does not have permission to view clinical consultation
        history.
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#14191B]">
            Chronological Consultation History
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Complete longitudinal record of visits, doctors, diagnoses, clinical
            notes, and treatment plans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={effectivePatientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            className="rounded-full border border-white bg-white px-4 py-2 text-xs font-medium text-[#14191B] focus:outline-none"
          >
            <option value="All">All Patients</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.id})
              </option>
            ))}
          </select>

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by diagnosis, doctor..."
            className="rounded-full border border-white bg-white px-4 py-2 text-xs text-[#14191B] placeholder:text-[#8E9CA1] focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="rounded-[18px] bg-[#F8FAFA] p-6 text-center text-xs text-[#738288]">
            No consultation records match the current filter.
          </p>
        ) : (
          filtered.map((item) => {
            const patient = patientMap.get(item.patientId);
            const doc = doctorMap.get(item.doctorId);
            const linkedFollowUp = followUpByConsultation.get(item.id);
            return (
              <article
                key={item.id}
                className="rounded-[24px] border border-white/90 bg-[#F8FAFA] p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#181C1E] px-3 py-0.5 text-xs font-semibold text-white">
                      {item.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusPillClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#546369]">
                      Visit: {item.visitDate}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                      Appt {item.appointmentId} • Token {item.tokenId}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#4A90A4]">
                    {doc?.name ?? item.doctorId} • {item.department}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-[#14191B]">
                    {patient?.fullName ?? item.patientId}{" "}
                    <span className="text-xs font-normal text-[#738288]">
                      ({item.patientId})
                    </span>
                  </h3>
                  <p className="text-xs font-semibold text-[#14191B]">
                    Diagnosis: {item.diagnosis}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-[16px] bg-white p-3 text-[11px] text-[#546369] sm:grid-cols-4">
                  <span>
                    <strong>BP:</strong> {item.vitals.bloodPressure}
                  </span>
                  <span>
                    <strong>Temp:</strong> {item.vitals.temperature}
                  </span>
                  <span>
                    <strong>Pulse:</strong> {item.vitals.pulse}
                  </span>
                  <span>
                    <strong>SpO2:</strong> {item.vitals.spo2}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-[#4C5B61] sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-[#14191B]">Symptoms</p>
                    <p className="mt-0.5">{item.symptoms}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#14191B]">Observations</p>
                    <p className="mt-0.5">
                      {item.observations || "No additional observations"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#14191B]">
                      Treatment &amp; Prescription
                    </p>
                    <p className="mt-0.5">{item.treatment}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#14191B]">
                      Clinical Notes
                    </p>
                    <p className="mt-0.5">
                      {item.clinicalNotes || "None recorded"}
                    </p>
                  </div>
                </div>

                {linkedFollowUp && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[16px] bg-[#8FC1CE]/15 px-3.5 py-2 text-xs text-[#1E505E]">
                    <span>
                      Linked Follow-up: <strong>{linkedFollowUp.id}</strong> on{" "}
                      {linkedFollowUp.scheduledDate} at {linkedFollowUp.timeSlot}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusPillClass(linkedFollowUp.status)}`}
                    >
                      {linkedFollowUp.status}
                    </span>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
