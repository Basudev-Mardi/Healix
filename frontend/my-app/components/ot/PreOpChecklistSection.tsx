"use client";

import React, { useMemo, useState } from "react";
import type { OtPreOpChecklist, OtSurgery } from "@/lib/ot/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getOtBadgeClass,
} from "./ui";

interface PreOpChecklistSectionProps {
  surgeries: OtSurgery[];
  checklists: OtPreOpChecklist[];
  preselectedSurgeryId?: string;
  canEdit: boolean;
  onSaveChecklist: (payload: {
    surgeryId: string;
    identityVerified: boolean;
    procedureConfirmed: boolean;
    consentSigned: boolean;
    allergiesReviewed: boolean;
    allergiesNotes: string;
    npoConfirmed: boolean;
    preopLabsReady: boolean;
    anesthesiaClearance: boolean;
    siteMarked: boolean;
    preparationNotes: string;
  }) => Promise<boolean>;
}

export function PreOpChecklistSection({
  surgeries,
  checklists,
  preselectedSurgeryId,
  canEdit,
  onSaveChecklist,
}: PreOpChecklistSectionProps) {
  const [surgeryId, setSurgeryId] = useState(
    preselectedSurgeryId || surgeries[0]?.id || ""
  );
  const [submitting, setSubmitting] = useState(false);

  const effectiveSurgeryId =
    preselectedSurgeryId && surgeries.some((s) => s.id === preselectedSurgeryId)
      ? preselectedSurgeryId
      : surgeries.some((s) => s.id === surgeryId)
        ? surgeryId
        : (surgeries[0]?.id ?? "");

  const existing =
    checklists.find((c) => c.surgeryId === effectiveSurgeryId) ?? null;

  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        identityVerified: boolean;
        procedureConfirmed: boolean;
        consentSigned: boolean;
        allergiesReviewed: boolean;
        allergiesNotes: string;
        npoConfirmed: boolean;
        preopLabsReady: boolean;
        anesthesiaClearance: boolean;
        siteMarked: boolean;
        preparationNotes: string;
      }
    >
  >({});

  const form = useMemo(() => {
    if (drafts[effectiveSurgeryId]) return drafts[effectiveSurgeryId];
    if (existing) {
      return {
        identityVerified: existing.identityVerified,
        procedureConfirmed: existing.procedureConfirmed,
        consentSigned: existing.consentSigned,
        allergiesReviewed: existing.allergiesReviewed,
        allergiesNotes: existing.allergiesNotes,
        npoConfirmed: existing.npoConfirmed,
        preopLabsReady: existing.preopLabsReady,
        anesthesiaClearance: existing.anesthesiaClearance,
        siteMarked: existing.siteMarked,
        preparationNotes: existing.preparationNotes,
      };
    }
    return {
      identityVerified: false,
      procedureConfirmed: false,
      consentSigned: false,
      allergiesReviewed: false,
      allergiesNotes: "None",
      npoConfirmed: false,
      preopLabsReady: false,
      anesthesiaClearance: false,
      siteMarked: false,
      preparationNotes: "",
    };
  }, [drafts, effectiveSurgeryId, existing]);

  function updateField<K extends keyof typeof form>(
    key: K,
    val: (typeof form)[K]
  ) {
    setDrafts((prev) => ({
      ...prev,
      [effectiveSurgeryId]: { ...form, [key]: val },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit || !effectiveSurgeryId) return;
    setSubmitting(true);
    try {
      await onSaveChecklist({ surgeryId: effectiveSurgeryId, ...form });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#14191B]">
            Pre-operative Safety Checklist
          </h2>
          <p className="text-xs text-[#6B7A80]">
            All 7 mandatory checks must be verified before the surgery can be
            marked Ready or In Progress.
          </p>
        </div>
        {existing && (
          <span
            className={`w-fit rounded-full px-3.5 py-1 text-xs font-semibold ${getOtBadgeClass(existing.status)}`}
          >
            Status: {existing.status}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Select Surgery *</label>
          <select
            value={effectiveSurgeryId}
            onChange={(e) => setSurgeryId(e.target.value)}
            className={INPUT_CLASS}
          >
            {surgeries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.patientName} • {s.procedureName} ({s.status})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-[20px] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { key: "identityVerified", label: "Patient Identity Verified *" },
              {
                key: "procedureConfirmed",
                label: "Procedure & Consent Confirmed *",
              },
              { key: "consentSigned", label: "Surgical Consent Signed *" },
              { key: "allergiesReviewed", label: "Allergies Reviewed *" },
              { key: "npoConfirmed", label: "NPO Fasting Confirmed *" },
              { key: "preopLabsReady", label: "Pre-op Labs & Blood Ready *" },
              {
                key: "anesthesiaClearance",
                label: "Anesthesia Clearance Signed *",
              },
              { key: "siteMarked", label: "Surgical Site Marked" },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-center gap-2.5 rounded-[14px] bg-[#F8FAFA] p-3 text-xs font-semibold text-[#14191B]"
            >
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={form[item.key]}
                onChange={(e) => updateField(item.key, e.target.checked)}
                className="h-4 w-4 accent-[#181C1E]"
              />
              {item.label}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASS}>Allergies / Alerts</label>
            <input
              type="text"
              disabled={!canEdit}
              value={form.allergiesNotes}
              onChange={(e) => updateField("allergiesNotes", e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Pre-Op Preparation Notes</label>
            <input
              type="text"
              disabled={!canEdit}
              value={form.preparationNotes}
              onChange={(e) => updateField("preparationNotes", e.target.value)}
              placeholder="Antibiotic prophylaxis, IV access, sterile prep..."
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-xs text-[#6B7A80]">
            {existing?.verifiedBy
              ? `Verified by ${existing.verifiedBy} at ${formatDateTime(existing.verifiedAt ?? "")}`
              : "Complete all mandatory (*) checks to verify readiness."}
          </span>
          <button
            type="submit"
            disabled={!canEdit || submitting}
            className={PRIMARY_BTN_CLASS}
          >
            {submitting ? "Saving..." : "Save & Verify Checklist"}
          </button>
        </div>
      </form>
    </div>
  );
}
