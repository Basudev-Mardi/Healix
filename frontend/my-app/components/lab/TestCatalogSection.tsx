"use client";

import React, { useState } from "react";
import type { LabTest } from "@/lib/lab/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  getLabBadgeClass,
} from "./ui";

interface TestCatalogSectionProps {
  tests: LabTest[];
  canManage: boolean;
  onCreateTest: (payload: {
    testCode: string;
    testName: string;
    category: string;
    description: string;
    specimenType: string;
    department: string;
    resultFormat: "Numerical" | "Qualitative";
    unit: string;
    refMin: number | null;
    refMax: number | null;
    referenceRangeLabel: string;
    price: number;
    turnaroundMinutes: number;
  }) => Promise<boolean>;
  onToggleActive: (testId: string, isActive: boolean) => Promise<void>;
}

export function TestCatalogSection({
  tests,
  canManage,
  onCreateTest,
  onToggleActive,
}: TestCatalogSectionProps) {
  const [form, setForm] = useState({
    testCode: "",
    testName: "",
    category: "Biochemistry",
    description: "",
    specimenType: "Serum",
    department: "Clinical Biochemistry",
    resultFormat: "Numerical" as "Numerical" | "Qualitative",
    unit: "mg/dL",
    refMin: "",
    refMax: "",
    referenceRangeLabel: "",
    price: 30,
    turnaroundMinutes: 60,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    try {
      const ok = await onCreateTest({
        testCode: form.testCode,
        testName: form.testName,
        category: form.category,
        description: form.description,
        specimenType: form.specimenType,
        department: form.department,
        resultFormat: form.resultFormat,
        unit: form.resultFormat === "Numerical" ? form.unit : "",
        refMin:
          form.resultFormat === "Numerical" && form.refMin !== ""
            ? Number(form.refMin)
            : null,
        refMax:
          form.resultFormat === "Numerical" && form.refMax !== ""
            ? Number(form.refMax)
            : null,
        referenceRangeLabel:
          form.referenceRangeLabel ||
          (form.resultFormat === "Numerical" && form.refMin && form.refMax
            ? `${form.refMin} - ${form.refMax} ${form.unit}`
            : "Negative"),
        price: Number(form.price),
        turnaroundMinutes: Number(form.turnaroundMinutes),
      });
      if (ok) {
        setForm({
          ...form,
          testCode: "",
          testName: "",
          description: "",
          refMin: "",
          refMax: "",
          referenceRangeLabel: "",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Add Test Form */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Add Laboratory Test
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Configure test code, specimen, pricing, turnaround time, and
            reference ranges.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Test Code *</label>
              <input
                type="text"
                required
                disabled={!canManage}
                value={form.testCode}
                onChange={(e) => setForm({ ...form, testCode: e.target.value })}
                placeholder="e.g., CRP-HS"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Category *</label>
              <select
                disabled={!canManage}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={INPUT_CLASS}
              >
                {[
                  "Hematology",
                  "Biochemistry",
                  "Microbiology",
                  "Immunology",
                  "Pathology",
                  "Serology",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Test Name *</label>
            <input
              type="text"
              required
              disabled={!canManage}
              value={form.testName}
              onChange={(e) => setForm({ ...form, testName: e.target.value })}
              placeholder="e.g., C-Reactive Protein (High Sensitivity)"
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Specimen Type *</label>
              <select
                disabled={!canManage}
                value={form.specimenType}
                onChange={(e) =>
                  setForm({ ...form, specimenType: e.target.value })
                }
                className={INPUT_CLASS}
              >
                {[
                  "Whole Blood (EDTA)",
                  "Serum",
                  "Plasma",
                  "Urine",
                  "Swab",
                  "CSF",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Department *</label>
              <input
                type="text"
                required
                disabled={!canManage}
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL_CLASS}>Format</label>
              <select
                disabled={!canManage}
                value={form.resultFormat}
                onChange={(e) =>
                  setForm({
                    ...form,
                    resultFormat: e.target.value as "Numerical" | "Qualitative",
                  })
                }
                className={INPUT_CLASS}
              >
                <option value="Numerical">Numerical</option>
                <option value="Qualitative">Qualitative</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Price ($)</label>
              <input
                type="number"
                step="0.5"
                min={0}
                disabled={!canManage}
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>TAT (mins)</label>
              <input
                type="number"
                min={5}
                disabled={!canManage}
                value={form.turnaroundMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    turnaroundMinutes: Number(e.target.value),
                  })
                }
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {form.resultFormat === "Numerical" && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL_CLASS}>Ref Min</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={!canManage}
                  value={form.refMin}
                  onChange={(e) => setForm({ ...form, refMin: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Ref Max</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={!canManage}
                  value={form.refMax}
                  onChange={(e) => setForm({ ...form, refMax: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Unit</label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Reference Range Label</label>
            <input
              type="text"
              disabled={!canManage}
              value={form.referenceRangeLabel}
              onChange={(e) =>
                setForm({ ...form, referenceRangeLabel: e.target.value })
              }
              placeholder="e.g., 0.0 - 3.0 mg/L or Negative"
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canManage || submitting}
              className={PRIMARY_BTN_CLASS}
            >
              {submitting ? "Adding..." : "Add to Test Catalog"}
            </button>
          </div>
        </form>
      </div>

      {/* Catalog List */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Laboratory Test Catalog
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Active tests are available for physician lab requests.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {tests.length} tests
          </span>
        </div>

        <div className="space-y-3">
          {tests.map((test) => (
            <div
              key={test.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {test.testCode}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getLabBadgeClass(
                        test.isActive ? "Active" : "Inactive"
                      )}`}
                    >
                      {test.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                      {test.category} • {test.resultFormat}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#14191B]">
                    {test.testName}
                  </p>
                  <p className="text-[#6B7A80]">
                    Specimen: {test.specimenType} • Ref:{" "}
                    <strong>{test.referenceRangeLabel}</strong> • ${test.price}{" "}
                    • TAT {test.turnaroundMinutes}m
                  </p>
                </div>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => onToggleActive(test.id, !test.isActive)}
                    className={SECONDARY_BTN_CLASS}
                  >
                    {test.isActive ? "Deactivate" : "Activate"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
