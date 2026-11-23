"use client";

import React, { useState } from "react";
import type { BedRecord, WardRecord } from "@/lib/wards-beds/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  getBedBadgeClass,
} from "./ui";

interface WardConfigurationSectionProps {
  wards: WardRecord[];
  beds: BedRecord[];
  canConfigure: boolean;
  onCreateWard: (payload: {
    name: string;
    wardType: string;
    department: string;
    location: string;
    capacity: number;
  }) => Promise<boolean>;
  onToggleWardActive: (wardId: string, isActive: boolean) => Promise<void>;
  onCreateBed: (payload: {
    wardId: string;
    room: string;
    bedNumber: string;
    bedType: string;
    isIsolation: boolean;
    isolationType: string;
  }) => Promise<boolean>;
}

export function WardConfigurationSection({
  wards,
  beds,
  canConfigure,
  onCreateWard,
  onToggleWardActive,
  onCreateBed,
}: WardConfigurationSectionProps) {
  const [wardForm, setWardForm] = useState({
    name: "",
    wardType: "General",
    department: "General Medicine",
    location: "",
    capacity: 10,
  });
  const [bedForm, setBedForm] = useState({
    wardId: wards[0]?.id ?? "",
    room: "",
    bedNumber: "",
    bedType: "General",
    isIsolation: false,
    isolationType: "Airborne / Negative Pressure",
  });
  const [submittingWard, setSubmittingWard] = useState(false);
  const [submittingBed, setSubmittingBed] = useState(false);

  const effectiveWardId = wards.some((w) => w.id === bedForm.wardId)
    ? bedForm.wardId
    : (wards[0]?.id ?? "");

  async function handleWardSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canConfigure) return;
    setSubmittingWard(true);
    try {
      const ok = await onCreateWard(wardForm);
      if (ok) {
        setWardForm({
          name: "",
          wardType: "General",
          department: "General Medicine",
          location: "",
          capacity: 10,
        });
      }
    } finally {
      setSubmittingWard(false);
    }
  }

  async function handleBedSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canConfigure || !effectiveWardId) return;
    setSubmittingBed(true);
    try {
      const ok = await onCreateBed({
        ...bedForm,
        wardId: effectiveWardId,
      });
      if (ok) {
        setBedForm({
          ...bedForm,
          room: "",
          bedNumber: "",
        });
      }
    } finally {
      setSubmittingBed(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Left: Create Ward + Add Bed Forms */}
      <div className="space-y-6 xl:col-span-5">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Create Hospital Ward
          </h2>
          <p className="mt-0.5 text-xs text-[#6B7A80]">
            Define ward type, department, physical location, and maximum bed
            capacity.
          </p>

          <form onSubmit={handleWardSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className={LABEL_CLASS}>Ward Name *</label>
              <input
                type="text"
                required
                disabled={!canConfigure}
                value={wardForm.name}
                onChange={(e) =>
                  setWardForm({ ...wardForm, name: e.target.value })
                }
                placeholder="e.g., Ward D (Surgical)"
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Ward Type *</label>
                <select
                  disabled={!canConfigure}
                  value={wardForm.wardType}
                  onChange={(e) =>
                    setWardForm({ ...wardForm, wardType: e.target.value })
                  }
                  className={INPUT_CLASS}
                >
                  {[
                    "General",
                    "Surgical",
                    "Cardiac",
                    "Orthopedic",
                    "Pediatric",
                    "ICU",
                    "Isolation",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Capacity (Beds) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  disabled={!canConfigure}
                  value={wardForm.capacity}
                  onChange={(e) =>
                    setWardForm({
                      ...wardForm,
                      capacity: Number(e.target.value),
                    })
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Department *</label>
                <input
                  type="text"
                  required
                  disabled={!canConfigure}
                  value={wardForm.department}
                  onChange={(e) =>
                    setWardForm({ ...wardForm, department: e.target.value })
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Location *</label>
                <input
                  type="text"
                  required
                  disabled={!canConfigure}
                  value={wardForm.location}
                  onChange={(e) =>
                    setWardForm({ ...wardForm, location: e.target.value })
                  }
                  placeholder="Wing & Floor"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!canConfigure || submittingWard}
                className={PRIMARY_BTN_CLASS}
              >
                {submittingWard ? "Creating..." : "Create Ward"}
              </button>
            </div>
          </form>
        </div>

        {/* Add Bed to Ward */}
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
          <h2 className="text-lg font-semibold text-[#14191B]">
            Configure Bed in Ward
          </h2>
          <p className="mt-0.5 text-xs text-[#6B7A80]">
            Add a standard or dedicated isolation bed within an active
            ward&apos;s capacity.
          </p>

          <form onSubmit={handleBedSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className={LABEL_CLASS}>Target Ward *</label>
              <select
                disabled={!canConfigure}
                value={effectiveWardId}
                onChange={(e) =>
                  setBedForm({ ...bedForm, wardId: e.target.value })
                }
                className={INPUT_CLASS}
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.department}) —{" "}
                    {w.isActive ? "Active" : "Inactive"}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL_CLASS}>Room *</label>
                <input
                  type="text"
                  required
                  disabled={!canConfigure}
                  value={bedForm.room}
                  onChange={(e) =>
                    setBedForm({ ...bedForm, room: e.target.value })
                  }
                  placeholder="Room 104"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Bed Number *</label>
                <input
                  type="text"
                  required
                  disabled={!canConfigure}
                  value={bedForm.bedNumber}
                  onChange={(e) =>
                    setBedForm({ ...bedForm, bedNumber: e.target.value })
                  }
                  placeholder="A-104"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Bed Type</label>
                <select
                  disabled={!canConfigure}
                  value={bedForm.bedType}
                  onChange={(e) =>
                    setBedForm({ ...bedForm, bedType: e.target.value })
                  }
                  className={INPUT_CLASS}
                >
                  {[
                    "General",
                    "Semi-Private",
                    "Private",
                    "Step-Down",
                    "ICU",
                    "Isolation",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-[#47565C]">
              <input
                type="checkbox"
                disabled={!canConfigure}
                checked={bedForm.isIsolation}
                onChange={(e) =>
                  setBedForm({ ...bedForm, isIsolation: e.target.checked })
                }
                className="h-4 w-4 accent-[#EF5B3A]"
              />
              Dedicated Isolation Bed
            </label>

            {bedForm.isIsolation && (
              <div>
                <label className={LABEL_CLASS}>Isolation Type</label>
                <select
                  disabled={!canConfigure}
                  value={bedForm.isolationType}
                  onChange={(e) =>
                    setBedForm({ ...bedForm, isolationType: e.target.value })
                  }
                  className={INPUT_CLASS}
                >
                  <option value="Airborne / Negative Pressure">
                    Airborne / Negative Pressure
                  </option>
                  <option value="Contact / Droplet">Contact / Droplet</option>
                  <option value="Protective / Neutropenic">
                    Protective / Neutropenic
                  </option>
                </select>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!canConfigure || submittingBed}
                className={ACCENT_BTN_CLASS}
              >
                {submittingBed ? "Adding Bed..." : "Add Bed to Ward"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right: Configured Wards Directory */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6 xl:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Configured Hospital Wards
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Total capacity, active bed count, and ward activation controls.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#47565C]">
            {wards.length} wards
          </span>
        </div>

        <div className="space-y-3">
          {wards.map((ward) => {
            const wardBeds = beds.filter(
              (b) => b.wardId === ward.id || b.ward === ward.name
            );
            const occupied = wardBeds.filter(
              (b) => b.status === "Occupied"
            ).length;
            return (
              <div
                key={ward.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {ward.id}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBedBadgeClass(
                          ward.isActive ? "Active" : "Inactive"
                        )}`}
                      >
                        {ward.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                        {ward.wardType}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#14191B]">
                      {ward.name} — {ward.department}
                    </p>
                    <p className="text-[#6B7A80]">
                      {ward.location} • Configured Beds: {wardBeds.length} /{" "}
                      {ward.capacity} capacity • Occupied: {occupied}
                    </p>
                  </div>

                  {canConfigure && (
                    <button
                      type="button"
                      onClick={() => onToggleWardActive(ward.id, !ward.isActive)}
                      className={SECONDARY_BTN_CLASS}
                    >
                      {ward.isActive ? "Deactivate" : "Activate"}
                    </button>
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
