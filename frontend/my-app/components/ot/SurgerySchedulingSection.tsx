"use client";

import React, { useState } from "react";
import type { OtPatient, OtSurgery, OtTheatre } from "@/lib/ot/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  getOtBadgeClass,
  getTodayDate,
} from "./ui";

interface SurgerySchedulingSectionProps {
  patients: OtPatient[];
  theatres: OtTheatre[];
  surgeries: OtSurgery[];
  canSchedule: boolean;
  onCreateSurgery: (payload: {
    patientId: string;
    theatreId: string;
    diagnosis: string;
    surgeryType: string;
    procedureName: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    priority: string;
  }) => Promise<boolean>;
  onUpdateSurgery: (payload: {
    surgeryId: string;
    action: "reschedule" | "status" | "cancel";
    scheduledDate?: string;
    startTime?: string;
    endTime?: string;
    theatreId?: string;
    status?: string;
  }) => Promise<boolean>;
  onNavigateSurgery: (
    tab: "surgeons" | "checklist" | "surgical" | "anesthesia" | "postop",
    surgeryId: string
  ) => void;
}

export function SurgerySchedulingSection({
  patients,
  theatres,
  surgeries,
  canSchedule,
  onCreateSurgery,
  onUpdateSurgery,
  onNavigateSurgery,
}: SurgerySchedulingSectionProps) {
  const [form, setForm] = useState({
    patientId: patients[0]?.id ?? "",
    theatreId: theatres[0]?.id ?? "",
    diagnosis: "",
    surgeryType: "Elective",
    procedureName: "",
    scheduledDate: getTodayDate(),
    startTime: "13:00",
    endTime: "14:30",
    priority: "Normal",
  });
  const [submitting, setSubmitting] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    scheduledDate: getTodayDate(),
    startTime: "15:00",
    endTime: "16:30",
    theatreId: theatres[0]?.id ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSchedule) return;
    setSubmitting(true);
    try {
      const ok = await onCreateSurgery(form);
      if (ok) {
        setForm({ ...form, diagnosis: "", procedureName: "" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Schedule Surgery Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Schedule Operation Theatre Surgery
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Prevents overlapping OT bookings and auto-creates a linked
            Pre-operative Checklist.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Patient *</label>
            <select
              required
              disabled={!canSchedule}
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              className={INPUT_CLASS}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} — {p.fullName} ({p.gender})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Operation Theatre *</label>
              <select
                required
                disabled={!canSchedule}
                value={form.theatreId}
                onChange={(e) =>
                  setForm({ ...form, theatreId: e.target.value })
                }
                className={INPUT_CLASS}
              >
                {theatres.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                    disabled={t.status === "Maintenance"}
                  >
                    {t.name} [{t.status}]
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Surgery Type</label>
              <select
                disabled={!canSchedule}
                value={form.surgeryType}
                onChange={(e) =>
                  setForm({ ...form, surgeryType: e.target.value })
                }
                className={INPUT_CLASS}
              >
                <option value="Elective">Elective</option>
                <option value="Emergency">Emergency</option>
                <option value="Day-Care">Day-Care</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Diagnosis *</label>
            <input
              type="text"
              required
              disabled={!canSchedule}
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              placeholder="Pre-operative diagnosis"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Surgical Procedure *</label>
            <input
              type="text"
              required
              disabled={!canSchedule}
              value={form.procedureName}
              onChange={(e) =>
                setForm({ ...form, procedureName: e.target.value })
              }
              placeholder="e.g., Laparoscopic Cholecystectomy"
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2">
              <label className={LABEL_CLASS}>Date *</label>
              <input
                type="date"
                required
                disabled={!canSchedule}
                value={form.scheduledDate}
                onChange={(e) =>
                  setForm({ ...form, scheduledDate: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Start *</label>
              <input
                type="time"
                required
                disabled={!canSchedule}
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>End *</label>
              <input
                type="time"
                required
                disabled={!canSchedule}
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Priority</label>
            <select
              disabled={!canSchedule}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canSchedule || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Scheduling..." : "Book Operation Theatre"}
            </button>
          </div>
        </form>
      </div>

      {/* Scheduled Surgeries Board */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              OT Surgical Schedule
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Ready / In Progress requires a Verified Pre-operative Checklist.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {surgeries.length} surgeries
          </span>
        </div>

        <div className="space-y-3">
          {surgeries.map((sur) => {
            const isRescheduling = rescheduleId === sur.id;
            const canModify =
              canSchedule &&
              sur.status !== "Completed" &&
              sur.status !== "Cancelled";

            return (
              <div
                key={sur.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {sur.id}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getOtBadgeClass(sur.status)}`}
                      >
                        {sur.status}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getOtBadgeClass(sur.priority)}`}
                      >
                        {sur.priority}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                        {sur.theatreName}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-[#14191B]">
                      {sur.procedureName} — {sur.patientName} ({sur.patientId})
                    </p>
                    <p className="text-[#6B7A80]">
                      {sur.scheduledDate} • {sur.startTime}–{sur.endTime} •{" "}
                      {sur.surgeryType} • Dx: {sur.diagnosis}
                    </p>
                  </div>

                  {canModify && (
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {sur.status === "Scheduled" && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSurgery({
                              surgeryId: sur.id,
                              action: "status",
                              status: "Confirmed",
                            })
                          }
                          className={SECONDARY_BTN_CLASS}
                        >
                          Confirm
                        </button>
                      )}
                      {(sur.status === "Scheduled" ||
                        sur.status === "Confirmed") && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSurgery({
                              surgeryId: sur.id,
                              action: "status",
                              status: "Ready",
                            })
                          }
                          className={ACCENT_BTN_CLASS}
                        >
                          Mark Ready
                        </button>
                      )}
                      {sur.status === "Ready" && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSurgery({
                              surgeryId: sur.id,
                              action: "status",
                              status: "In Progress",
                            })
                          }
                          className={PRIMARY_BTN_CLASS}
                        >
                          Start Surgery
                        </button>
                      )}
                      {sur.status === "In Progress" && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSurgery({
                              surgeryId: sur.id,
                              action: "status",
                              status: "Completed",
                            })
                          }
                          className={PRIMARY_BTN_CLASS}
                        >
                          Complete
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleId(isRescheduling ? null : sur.id);
                          setRescheduleForm({
                            scheduledDate: sur.scheduledDate,
                            startTime: sur.startTime,
                            endTime: sur.endTime,
                            theatreId: sur.theatreId,
                          });
                        }}
                        className={SECONDARY_BTN_CLASS}
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSurgery({
                            surgeryId: sur.id,
                            action: "cancel",
                          })
                        }
                        className={DANGER_BTN_CLASS}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {isRescheduling && (
                  <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-[16px] bg-white p-3 sm:grid-cols-5">
                    <input
                      type="date"
                      value={rescheduleForm.scheduledDate}
                      onChange={(e) =>
                        setRescheduleForm({
                          ...rescheduleForm,
                          scheduledDate: e.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                    <input
                      type="time"
                      value={rescheduleForm.startTime}
                      onChange={(e) =>
                        setRescheduleForm({
                          ...rescheduleForm,
                          startTime: e.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                    <input
                      type="time"
                      value={rescheduleForm.endTime}
                      onChange={(e) =>
                        setRescheduleForm({
                          ...rescheduleForm,
                          endTime: e.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                    <select
                      value={rescheduleForm.theatreId}
                      onChange={(e) =>
                        setRescheduleForm({
                          ...rescheduleForm,
                          theatreId: e.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    >
                      {theatres.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await onUpdateSurgery({
                          surgeryId: sur.id,
                          action: "reschedule",
                          ...rescheduleForm,
                        });
                        if (ok) setRescheduleId(null);
                      }}
                      className={PRIMARY_BTN_CLASS}
                    >
                      Save
                    </button>
                  </div>
                )}

                {/* Workflow Handoffs */}
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#E6ECEE] pt-3">
                  {(
                    [
                      { tab: "surgeons", label: "Surgeons" },
                      { tab: "checklist", label: "Pre-Op Checklist" },
                      { tab: "surgical", label: "Surgical Record" },
                      { tab: "anesthesia", label: "Anesthesia" },
                      { tab: "postop", label: "Post-Op Monitoring" },
                    ] as const
                  ).map((btn) => (
                    <button
                      key={btn.tab}
                      type="button"
                      onClick={() => onNavigateSurgery(btn.tab, sur.id)}
                      className="rounded-full bg-[#EDF2F3] px-2.5 py-1 text-[11px] font-semibold text-[#3C4A50] hover:bg-[#DCE4E7]"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
