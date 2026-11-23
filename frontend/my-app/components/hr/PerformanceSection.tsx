"use client";

import React, { useState } from "react";
import type { HrEmployee, HrPerformanceReview } from "@/lib/hr/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getHrBadgeClass,
} from "./ui";

interface PerformanceSectionProps {
  employees: HrEmployee[];
  reviews: HrPerformanceReview[];
  canManage: boolean;
  onCreateReview: (payload: {
    employeeId: string;
    reviewPeriod: string;
    rating: number;
    targets: string;
    achievements: string;
    feedback: string;
    disciplinaryNotes: string;
    appraisalDecision: string;
  }) => Promise<boolean>;
}

export function PerformanceSection({
  employees,
  reviews,
  canManage,
  onCreateReview,
}: PerformanceSectionProps) {
  const [form, setForm] = useState({
    employeeId: employees[0]?.id ?? "",
    reviewPeriod: "H2 2026",
    rating: "4.5",
    targets: "",
    achievements: "",
    feedback: "",
    disciplinaryNotes: "",
    appraisalDecision: "Met Expectations",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const empId = form.employeeId || employees[0]?.id || "";
    if (!empId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateReview({
        ...form,
        employeeId: empId,
        rating: Number(form.rating) || 4,
      });
      if (ok) {
        setForm({
          ...form,
          targets: "",
          achievements: "",
          feedback: "",
          disciplinaryNotes: "",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
      >
        <h2 className="text-lg font-semibold text-[#14191B]">
          Record Performance Evaluation
        </h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Employee *</label>
            <select
              value={form.employeeId || employees[0]?.id || ""}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className={INPUT_CLASS}
              disabled={!canManage}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Review Period *</label>
              <input
                type="text"
                required
                value={form.reviewPeriod}
                onChange={(e) =>
                  setForm({ ...form, reviewPeriod: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Rating (1.0 – 5.0) *</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                required
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Appraisal Decision *</label>
            <select
              value={form.appraisalDecision}
              onChange={(e) =>
                setForm({ ...form, appraisalDecision: e.target.value })
              }
              className={INPUT_CLASS}
              disabled={!canManage}
            >
              <option value="Met Expectations">Met Expectations</option>
              <option value="Exceeds Expectations">Exceeds Expectations</option>
              <option value="Salary Increment">Salary Increment</option>
              <option value="Promotion Recommended">
                Promotion Recommended
              </option>
              <option value="Performance Improvement Plan">
                Performance Improvement Plan
              </option>
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Targets & Achievements</label>
            <textarea
              rows={2}
              value={form.achievements}
              onChange={(e) =>
                setForm({ ...form, achievements: e.target.value })
              }
              placeholder="Key clinical or operational milestones achieved..."
              className={INPUT_CLASS}
              disabled={!canManage}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Manager Feedback</label>
            <textarea
              rows={2}
              value={form.feedback}
              onChange={(e) => setForm({ ...form, feedback: e.target.value })}
              className={INPUT_CLASS}
              disabled={!canManage}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Disciplinary Notes (if any)</label>
            <input
              type="text"
              value={form.disciplinaryNotes}
              onChange={(e) =>
                setForm({ ...form, disciplinaryNotes: e.target.value })
              }
              className={INPUT_CLASS}
              disabled={!canManage}
            />
          </div>

          <button
            type="submit"
            disabled={!canManage || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Saving Evaluation..." : "Submit Appraisal Record"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Appraisal & Performance History ({reviews.length})
        </h3>
        <div className="mt-4 space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {r.rating.toFixed(1)} / 5.0
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getHrBadgeClass(r.status)}`}
                  >
                    {r.appraisalDecision}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                    {r.reviewPeriod}
                  </span>
                </div>
                <span className="text-[11px] text-[#6B7A80]">
                  {formatDateTime(r.reviewedAt)}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {r.employeeName} ({r.department})
              </p>
              {r.achievements && (
                <p className="mt-1 text-[#546369]">
                  Achievements: {r.achievements}
                </p>
              )}
              {r.feedback && (
                <p className="mt-0.5 text-[#6B7A80]">Feedback: {r.feedback}</p>
              )}
              {r.disciplinaryNotes && (
                <p className="mt-1 font-medium text-[#B8381B]">
                  Disciplinary: {r.disciplinaryNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
