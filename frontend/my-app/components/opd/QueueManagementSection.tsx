"use client";

import React, { useMemo, useState } from "react";
import type { OpdDoctor, OpdPatient, OpdToken } from "@/lib/opd/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  getStatusPillClass,
} from "./ui";

interface QueueManagementSectionProps {
  tokens: OpdToken[];
  patients: OpdPatient[];
  doctors: OpdDoctor[];
  canManage: boolean;
  canConsult: boolean;
  onQueueAction: (payload: {
    action: "call-next" | "call" | "start" | "skip" | "requeue" | "complete";
    tokenId?: string;
    doctorId?: string;
  }) => Promise<void>;
  onOpenConsultation: (tokenId: string) => void;
}

const PRIORITY_RANK = { Urgent: 0, Priority: 1, Normal: 2 };

export function QueueManagementSection({
  tokens,
  patients,
  doctors,
  canManage,
  canConsult,
  onQueueAction,
  onOpenConsultation,
}: QueueManagementSectionProps) {
  const [doctorFilter, setDoctorFilter] = useState<string>("All");

  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, p])),
    [patients]
  );
  const doctorMap = useMemo(
    () => new Map(doctors.map((d) => [d.id, d])),
    [doctors]
  );

  const filteredTokens = useMemo(() => {
    const base =
      doctorFilter === "All"
        ? tokens
        : tokens.filter((t) => t.doctorId === doctorFilter);
    return [...base].sort((a, b) => {
      const pDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (pDiff !== 0) return pDiff;
      return a.sequence - b.sequence;
    });
  }, [tokens, doctorFilter]);

  const waiting = filteredTokens.filter((t) => t.status === "Waiting");
  const active = filteredTokens.filter(
    (t) => t.status === "Called" || t.status === "In Consultation"
  );
  const skipped = filteredTokens.filter((t) => t.status === "Skipped");
  const completed = filteredTokens.filter((t) => t.status === "Completed");

  return (
    <div className="space-y-6">
      {/* Queue Controls Bar */}
      <div className="flex flex-col gap-4 rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#14191B]">
            Live OPD Queue Management
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Call the next patient in priority/sequence order, skip, re-queue, or
            begin doctor consultation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="rounded-full border border-white bg-white px-4 py-2 text-xs font-medium text-[#14191B] focus:outline-none"
          >
            <option value="All">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} ({doc.department})
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!canManage || waiting.length === 0}
            onClick={() =>
              onQueueAction({
                action: "call-next",
                doctorId: doctorFilter === "All" ? undefined : doctorFilter,
              })
            }
            className={PRIMARY_BTN_CLASS}
          >
            Call Next Patient ({waiting.length})
          </button>
        </div>
      </div>

      {/* 3-Column Queue Board */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Waiting Queue */}
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#14191B]">Waiting</h3>
            <span className="rounded-full bg-[#8FC1CE] px-3 py-0.5 text-xs font-semibold text-white">
              {waiting.length}
            </span>
          </div>
          <div className="space-y-3">
            {waiting.length === 0 ? (
              <p className="rounded-[18px] bg-[#F8FAFA] p-4 text-center text-xs text-[#738288]">
                No patients waiting.
              </p>
            ) : (
              waiting.map((tkn) => {
                const patient = patientMap.get(tkn.patientId);
                const doc = doctorMap.get(tkn.doctorId);
                return (
                  <div
                    key={tkn.id}
                    className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-xs font-semibold text-white">
                        {tkn.tokenNumber}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusPillClass(tkn.priority)}`}
                      >
                        {tkn.priority}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#14191B]">
                      {patient?.fullName ?? tkn.patientId}
                    </p>
                    <p className="text-xs text-[#6B7A80]">
                      {doc?.name ?? tkn.doctorId} • {tkn.visitType}
                    </p>
                    {canManage && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onQueueAction({ action: "call", tokenId: tkn.id })
                          }
                          className={ACCENT_BTN_CLASS}
                        >
                          Call
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onQueueAction({ action: "skip", tokenId: tkn.id })
                          }
                          className={SECONDARY_BTN_CLASS}
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Called / Currently Consulting */}
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#14191B]">
              Called / Consulting
            </h3>
            <span className="rounded-full bg-[#EB9B52] px-3 py-0.5 text-xs font-semibold text-white">
              {active.length}
            </span>
          </div>
          <div className="space-y-3">
            {active.length === 0 ? (
              <p className="rounded-[18px] bg-[#F8FAFA] p-4 text-center text-xs text-[#738288]">
                No patient currently called or in consultation.
              </p>
            ) : (
              active.map((tkn) => {
                const patient = patientMap.get(tkn.patientId);
                const doc = doctorMap.get(tkn.doctorId);
                return (
                  <div
                    key={tkn.id}
                    className="rounded-[20px] border border-[#EB9B52]/40 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-xs font-semibold text-white">
                        {tkn.tokenNumber}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusPillClass(tkn.status)}`}
                      >
                        {tkn.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#14191B]">
                      {patient?.fullName ?? tkn.patientId} ({tkn.patientId})
                    </p>
                    <p className="text-xs text-[#6B7A80]">
                      {doc?.name ?? tkn.doctorId} • {doc?.room}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {canManage && tkn.status === "Called" && (
                        <button
                          type="button"
                          onClick={() =>
                            onQueueAction({ action: "start", tokenId: tkn.id })
                          }
                          className={ACCENT_BTN_CLASS}
                        >
                          Start Consultation
                        </button>
                      )}
                      {canConsult && (
                        <button
                          type="button"
                          onClick={() => onOpenConsultation(tkn.id)}
                          className={PRIMARY_BTN_CLASS}
                        >
                          Open Consultation
                        </button>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            onQueueAction({ action: "skip", tokenId: tkn.id })
                          }
                          className={DANGER_BTN_CLASS}
                        >
                          Skip
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Completed & Skipped */}
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#14191B]">
                Completed
              </h3>
              <span className="rounded-full bg-[#6AB4A4] px-3 py-0.5 text-xs font-semibold text-white">
                {completed.length}
              </span>
            </div>
            <div className="space-y-2.5">
              {completed.length === 0 ? (
                <p className="rounded-[18px] bg-[#F8FAFA] p-4 text-center text-xs text-[#738288]">
                  No completed tokens yet.
                </p>
              ) : (
                completed.map((tkn) => {
                  const patient = patientMap.get(tkn.patientId);
                  const doc = doctorMap.get(tkn.doctorId);
                  return (
                    <div
                      key={tkn.id}
                      className="flex items-center justify-between rounded-[18px] bg-[#F8FAFA] px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#14191B]">
                          {tkn.tokenNumber} • {patient?.fullName ?? tkn.patientId}
                        </p>
                        <p className="text-[11px] text-[#6B7A80]">
                          {doc?.name ?? tkn.doctorId}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#6AB4A4] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        Done
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {skipped.length > 0 && (
            <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#14191B]">
                  Skipped
                </h3>
                <span className="rounded-full bg-[#EF5B3A] px-3 py-0.5 text-xs font-semibold text-white">
                  {skipped.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {skipped.map((tkn) => {
                  const patient = patientMap.get(tkn.patientId);
                  return (
                    <div
                      key={tkn.id}
                      className="flex items-center justify-between gap-2 rounded-[18px] bg-[#F8FAFA] px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#14191B]">
                          {tkn.tokenNumber} • {patient?.fullName ?? tkn.patientId}
                        </p>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            onQueueAction({
                              action: "requeue",
                              tokenId: tkn.id,
                            })
                          }
                          className={SECONDARY_BTN_CLASS}
                        >
                          Re-queue
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
