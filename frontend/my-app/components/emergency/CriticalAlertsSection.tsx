"use client";

import React, { useState } from "react";
import type {
  AlertSeverity,
  CriticalAlert,
  EmergencyRegistration,
} from "@/lib/emergency/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  SECONDARY_BTN_CLASS,
  formatTimeShort,
  getEmergencyBadgeClass,
} from "./ui";

interface CriticalAlertsSectionProps {
  registrations: EmergencyRegistration[];
  alerts: CriticalAlert[];
  preselectedEmergencyId?: string;
  canTrigger: boolean;
  canAcknowledge: boolean;
  onCreateAlert: (payload: {
    emergencyId: string;
    alertType: string;
    severity: AlertSeverity;
    conditionSummary: string;
    notifiedGroups: string[];
  }) => Promise<boolean>;
  onUpdateAlert: (payload: {
    alertId: string;
    action: "acknowledge" | "resolve";
    resolutionNotes?: string;
  }) => Promise<void>;
}

const NOTIFY_GROUPS = [
  "Emergency Physicians",
  "Trauma Team",
  "ICU Team",
  "Cardiology STAT",
  "Blood Bank",
  "OT Emergency",
  "Radiology STAT",
];

export function CriticalAlertsSection({
  registrations,
  alerts,
  preselectedEmergencyId,
  canTrigger,
  canAcknowledge,
  onCreateAlert,
  onUpdateAlert,
}: CriticalAlertsSectionProps) {
  const [emergencyId, setEmergencyId] = useState(
    preselectedEmergencyId || registrations[0]?.id || ""
  );
  const [alertType, setAlertType] = useState("Code Blue / Deterioration");
  const [severity, setSeverity] = useState<AlertSeverity>("Critical");
  const [conditionSummary, setConditionSummary] = useState("");
  const [notifiedGroups, setNotifiedGroups] = useState<string[]>([
    "Emergency Physicians",
    "ICU Team",
  ]);
  const [submitting, setSubmitting] = useState(false);

  const effectiveEmergencyId =
    preselectedEmergencyId &&
    registrations.some((r) => r.id === preselectedEmergencyId)
      ? preselectedEmergencyId
      : registrations.some((r) => r.id === emergencyId)
        ? emergencyId
        : (registrations[0]?.id ?? "");

  function toggleGroup(group: string) {
    setNotifiedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canTrigger || !effectiveEmergencyId) return;
    setSubmitting(true);
    try {
      const ok = await onCreateAlert({
        emergencyId: effectiveEmergencyId,
        alertType,
        severity,
        conditionSummary,
        notifiedGroups,
      });
      if (ok) {
        setConditionSummary("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const unresolvedCount = alerts.filter((a) => a.status === "Unresolved").length;
  const ackCount = alerts.filter((a) => a.status === "Acknowledged").length;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Trigger Critical Alert */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Broadcast Critical Alert
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Notify emergency physicians, trauma, ICU, OT, or blood bank teams
            immediately.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Emergency Patient *</label>
            <select
              value={effectiveEmergencyId}
              onChange={(e) => setEmergencyId(e.target.value)}
              disabled={!canTrigger}
              className={INPUT_CLASS}
            >
              {registrations.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.id} — {reg.patientName} ({reg.assignedBay})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Alert Code / Type *</label>
              <input
                type="text"
                required
                disabled={!canTrigger}
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                placeholder="e.g., Code Stroke, Code Trauma"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Severity *</label>
              <select
                disabled={!canTrigger}
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                className={INPUT_CLASS}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Notify Teams</label>
            <div className="flex flex-wrap gap-2 rounded-[20px] bg-white p-3">
              {NOTIFY_GROUPS.map((grp) => {
                const active = notifiedGroups.includes(grp);
                return (
                  <button
                    key={grp}
                    type="button"
                    disabled={!canTrigger}
                    onClick={() => toggleGroup(grp)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-[#EF5B3A] text-white"
                        : "bg-[#EDF2F3] text-[#4C5B61]"
                    }`}
                  >
                    {grp}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Critical Condition Details *</label>
            <textarea
              rows={3}
              required
              disabled={!canTrigger}
              value={conditionSummary}
              onChange={(e) => setConditionSummary(e.target.value)}
              placeholder="Sudden SpO2 drop, cardiac arrest, active hemorrhage..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!canTrigger || submitting}
              className={DANGER_BTN_CLASS}
            >
              {submitting ? "Dispatching..." : "Trigger Critical Alert"}
            </button>
          </div>
        </form>
      </div>

      {/* Live Critical Alert Feed */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Critical Alert Monitor
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Track unresolved, acknowledged, and resolved critical emergency
              alerts.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-[#EF5B3A] px-3 py-1 text-xs font-semibold text-white">
              {unresolvedCount} Unresolved
            </span>
            <span className="rounded-full bg-[#EB9B52] px-3 py-1 text-xs font-semibold text-white">
              {ackCount} Acknowledged
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map((alt) => (
            <div
              key={alt.id}
              className={`rounded-[22px] border p-4 ${
                alt.status === "Unresolved"
                  ? "border-[#EF5B3A]/50 bg-white"
                  : "border-white/90 bg-[#F8FAFA]"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {alt.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getEmergencyBadgeClass(alt.severity)}`}
                    >
                      {alt.severity}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getEmergencyBadgeClass(alt.status)}`}
                    >
                      {alt.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#14191B]">
                    {alt.alertType} — {alt.patientName} ({alt.patientId})
                  </p>
                  <p className="text-xs text-[#6B7A80]">
                    {alt.emergencyId} • {alt.assignedBay} • Triggered by{" "}
                    {alt.triggeredBy} ({formatTimeShort(alt.triggeredAt)})
                  </p>
                  <p className="mt-1.5 text-xs text-[#4C5B61]">
                    {alt.conditionSummary}
                  </p>
                  <p className="mt-1 text-[11px] text-[#6B7A80]">
                    <strong>Notified:</strong> {alt.notifiedGroups.join(", ")}
                  </p>
                  {alt.acknowledgedBy && (
                    <p className="mt-1 text-[11px] text-[#4A90A4]">
                      Acknowledged by {alt.acknowledgedBy} (
                      {formatTimeShort(alt.acknowledgedAt ?? "")})
                    </p>
                  )}
                  {alt.resolvedBy && (
                    <p className="mt-0.5 text-[11px] text-[#3E8E7E]">
                      Resolved by {alt.resolvedBy}: {alt.resolutionNotes}
                    </p>
                  )}
                </div>

                {canAcknowledge && alt.status !== "Resolved" && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {alt.status === "Unresolved" && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateAlert({
                            alertId: alt.id,
                            action: "acknowledge",
                          })
                        }
                        className={ACCENT_BTN_CLASS}
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateAlert({
                          alertId: alt.id,
                          action: "resolve",
                          resolutionNotes: "Stabilized and team engaged",
                        })
                      }
                      className={SECONDARY_BTN_CLASS}
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
