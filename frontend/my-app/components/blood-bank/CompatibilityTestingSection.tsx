"use client";

import React, { useState } from "react";
import type {
  BloodCompatibilityTest,
  BloodRequest,
  BloodUnit,
} from "@/lib/blood-bank/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getBloodBadgeClass,
} from "./ui";

interface CompatibilityTestingSectionProps {
  requests: BloodRequest[];
  units: BloodUnit[];
  tests: BloodCompatibilityTest[];
  canTest: boolean;
  canVerify: boolean;
  canAllocate: boolean;
  onRecordTest: (payload: {
    requestId: string;
    unitId: string;
    antibodyScreen: "Negative" | "Positive";
    testedBy: string;
    notes: string;
  }) => Promise<boolean>;
  onVerifyTest: (payload: {
    testId: string;
    verificationStatus: "Verified" | "Rejected";
  }) => Promise<void>;
  onAllocateUnit: (payload: {
    requestId: string;
    unitId: string;
    action: "reserve" | "issue";
  }) => Promise<void>;
}

export function CompatibilityTestingSection({
  requests,
  units,
  tests,
  canTest,
  canVerify,
  canAllocate,
  onRecordTest,
  onVerifyTest,
  onAllocateUnit,
}: CompatibilityTestingSectionProps) {
  const openRequests = requests.filter(
    (r) =>
      r.status !== "Fulfilled" &&
      r.status !== "Rejected" &&
      r.status !== "Cancelled"
  );
  const availableUnits = units.filter(
    (u) => u.status === "Available" && u.screeningStatus === "Cleared"
  );

  const [requestId, setRequestId] = useState(openRequests[0]?.id ?? "");
  const [unitId, setUnitId] = useState(availableUnits[0]?.id ?? "");
  const [antibodyScreen, setAntibodyScreen] = useState<"Negative" | "Positive">(
    "Negative"
  );
  const [testedBy, setTestedBy] = useState("Lab Tech Arjun");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rId = requestId || openRequests[0]?.id || "";
    const uId = unitId || availableUnits[0]?.id || "";
    if (!rId || !uId) return;
    setSubmitting(true);
    try {
      const ok = await onRecordTest({
        requestId: rId,
        unitId: uId,
        antibodyScreen,
        testedBy,
        notes,
      });
      if (ok) {
        setNotes("");
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
          Blood Grouping & Crossmatching
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Backend validates ABO/Rh component compatibility automatically. Only
          Verified & Compatible units can be reserved or issued.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Blood Request *</label>
            <select
              value={requestId || openRequests[0]?.id || ""}
              onChange={(e) => setRequestId(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canTest || openRequests.length === 0}
            >
              {openRequests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} — {r.patientName} ({r.requestedBloodGroup}{" "}
                  {r.component}, {r.urgency})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Cleared Available Donor Unit *</label>
            <select
              value={unitId || availableUnits[0]?.id || ""}
              onChange={(e) => setUnitId(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canTest || availableUnits.length === 0}
            >
              {availableUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id} — {u.bloodGroup} {u.component} (Exp {u.expiryDate})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Antibody Screen *</label>
              <select
                value={antibodyScreen}
                onChange={(e) =>
                  setAntibodyScreen(e.target.value as "Negative" | "Positive")
                }
                className={INPUT_CLASS}
                disabled={!canTest}
              >
                <option value="Negative">Negative</option>
                <option value="Positive">Positive (Incompatible)</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Tested By *</label>
              <input
                type="text"
                required
                value={testedBy}
                onChange={(e) => setTestedBy(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canTest}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Crossmatch Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Major & minor crossmatch, AHG phase..."
              className={INPUT_CLASS}
              disabled={!canTest}
            />
          </div>

          <button
            type="submit"
            disabled={
              !canTest ||
              submitting ||
              openRequests.length === 0 ||
              availableUnits.length === 0
            }
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Running Crossmatch..." : "Record Compatibility Test"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Compatibility Records & Unit Issuing ({tests.length})
        </h3>
        <div className="mt-4 space-y-3">
          {tests.map((t) => {
            const unit = units.find((u) => u.id === t.unitId);
            return (
              <div
                key={t.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {t.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBloodBadgeClass(t.crossmatchResult)}`}
                    >
                      {t.crossmatchResult}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBloodBadgeClass(t.verificationStatus)}`}
                    >
                      {t.verificationStatus}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B7A80]">
                    {formatDateTime(t.testedAt)}
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  Patient {t.patientName} ({t.patientBloodGroup}) ⇄ Unit{" "}
                  {t.unitId} ({t.donorBloodGroup} {t.component})
                </p>
                <p className="mt-0.5 text-[#546369]">
                  Request {t.requestId} • Antibody Screen: {t.antibodyScreen} •
                  Unit Status: <strong>{unit?.status ?? "—"}</strong>
                </p>
                {t.notes && (
                  <p className="mt-1 text-[#6B7A80]">{t.notes}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E6EDEF] pt-3">
                  {canVerify && t.verificationStatus === "Pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onVerifyTest({
                            testId: t.id,
                            verificationStatus: "Verified",
                          })
                        }
                        className={ACCENT_BTN_CLASS}
                      >
                        Verify Crossmatch
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onVerifyTest({
                            testId: t.id,
                            verificationStatus: "Rejected",
                          })
                        }
                        className={DANGER_BTN_CLASS}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {canAllocate &&
                    t.crossmatchResult === "Compatible" &&
                    t.verificationStatus === "Verified" &&
                    unit &&
                    (unit.status === "Available" ||
                      (unit.status === "Reserved" &&
                        unit.reservedForRequestId === t.requestId)) && (
                      <>
                        {unit.status === "Available" && (
                          <button
                            type="button"
                            onClick={() =>
                              onAllocateUnit({
                                requestId: t.requestId,
                                unitId: t.unitId,
                                action: "reserve",
                              })
                            }
                            className={ACCENT_BTN_CLASS}
                          >
                            Reserve Unit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onAllocateUnit({
                              requestId: t.requestId,
                              unitId: t.unitId,
                              action: "issue",
                            })
                          }
                          className={PRIMARY_BTN_CLASS}
                        >
                          Issue Blood Unit
                        </button>
                      </>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
