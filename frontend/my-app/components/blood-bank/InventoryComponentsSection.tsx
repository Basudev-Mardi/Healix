"use client";

import React, { useState } from "react";
import {
  BLOOD_COMPONENTS,
  type BloodComponent,
  type BloodDonor,
  type BloodUnit,
} from "@/lib/blood-bank/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  getBloodBadgeClass,
} from "./ui";

interface InventoryComponentsSectionProps {
  donors: BloodDonor[];
  units: BloodUnit[];
  canCollect: boolean;
  canScreen: boolean;
  canSeparate: boolean;
  onCollectUnit: (payload: {
    donorId: string;
    component: BloodComponent;
    collectionCenter: string;
    storageLocation: string;
  }) => Promise<boolean>;
  onScreenUnit: (payload: {
    unitId: string;
    screeningStatus: "Cleared" | "Reactive";
    storageLocation?: string;
  }) => Promise<void>;
  onSeparateComponent: (payload: {
    sourceUnitId: string;
    targetComponent: Exclude<BloodComponent, "Whole Blood">;
    storageLocation: string;
  }) => Promise<boolean>;
}

export function InventoryComponentsSection({
  donors,
  units,
  canCollect,
  canScreen,
  canSeparate,
  onCollectUnit,
  onScreenUnit,
  onSeparateComponent,
}: InventoryComponentsSectionProps) {
  const eligibleDonors = donors.filter(
    (d) => d.eligibilityStatus === "Eligible" && d.status === "Active"
  );
  const separableUnits = units.filter(
    (u) => u.screeningStatus === "Cleared" && u.status === "Available"
  );

  const [donorId, setDonorId] = useState(eligibleDonors[0]?.id ?? "");
  const [component, setComponent] = useState<BloodComponent>("Whole Blood");
  const [collectionCenter, setCollectionCenter] = useState(
    "Main Hospital Blood Center"
  );
  const [storageLocation, setStorageLocation] = useState("Cold Room Fridge A1");
  const [collecting, setCollecting] = useState(false);

  const [sourceUnitId, setSourceUnitId] = useState(separableUnits[0]?.id ?? "");
  const [targetComponent, setTargetComponent] =
    useState<Exclude<BloodComponent, "Whole Blood">>("RBC");
  const [compStorage, setCompStorage] = useState("Cold Room Fridge B2");
  const [separating, setSeparating] = useState(false);

  const [groupFilter, setGroupFilter] = useState("All");

  const filteredUnits = units.filter((u) =>
    groupFilter === "All" ? true : u.bloodGroup === groupFilter
  );

  async function handleCollect(e: React.FormEvent) {
    e.preventDefault();
    const dId = donorId || eligibleDonors[0]?.id || "";
    if (!dId) return;
    setCollecting(true);
    try {
      await onCollectUnit({
        donorId: dId,
        component,
        collectionCenter,
        storageLocation,
      });
    } finally {
      setCollecting(false);
    }
  }

  async function handleSeparate(e: React.FormEvent) {
    e.preventDefault();
    const sId = sourceUnitId || separableUnits[0]?.id || "";
    if (!sId) return;
    setSeparating(true);
    try {
      await onSeparateComponent({
        sourceUnitId: sId,
        targetComponent,
        storageLocation: compStorage,
      });
    } finally {
      setSeparating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Collect Donation + Separate Component */}
      <div className="space-y-4 lg:col-span-5">
        <form
          onSubmit={handleCollect}
          className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5"
        >
          <h2 className="text-lg font-semibold text-[#14191B]">
            Collect Blood Donation
          </h2>
          <p className="mt-0.5 text-xs text-[#6B7A80]">
            Collected units enter Testing quarantine until infectious disease
            screening is Cleared.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className={LABEL_CLASS}>Eligible Donor *</label>
              <select
                value={donorId || eligibleDonors[0]?.id || ""}
                onChange={(e) => setDonorId(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCollect || eligibleDonors.length === 0}
              >
                {eligibleDonors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.bloodGroup}) — {d.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Initial Component</label>
                <select
                  value={component}
                  onChange={(e) =>
                    setComponent(e.target.value as BloodComponent)
                  }
                  className={INPUT_CLASS}
                  disabled={!canCollect}
                >
                  {BLOOD_COMPONENTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Storage Location</label>
                <input
                  type="text"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className={INPUT_CLASS}
                  disabled={!canCollect}
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Collection Center</label>
              <input
                type="text"
                value={collectionCenter}
                onChange={(e) => setCollectionCenter(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCollect}
              />
            </div>
            <button
              type="submit"
              disabled={!canCollect || collecting || eligibleDonors.length === 0}
              className={`${PRIMARY_BTN_CLASS} w-full`}
            >
              {collecting ? "Recording Donation..." : "Record Blood Collection"}
            </button>
          </div>
        </form>

        <form
          onSubmit={handleSeparate}
          className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5"
        >
          <h3 className="text-base font-semibold text-[#14191B]">
            Component Separation (RBC / Platelets / Plasma / Cryo)
          </h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className={LABEL_CLASS}>Cleared Source Unit *</label>
              <select
                value={sourceUnitId || separableUnits[0]?.id || ""}
                onChange={(e) => setSourceUnitId(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canSeparate || separableUnits.length === 0}
              >
                {separableUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.id} — {u.bloodGroup} {u.component} (Donor {u.donorName})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Target Component</label>
                <select
                  value={targetComponent}
                  onChange={(e) =>
                    setTargetComponent(
                      e.target.value as Exclude<BloodComponent, "Whole Blood">
                    )
                  }
                  className={INPUT_CLASS}
                  disabled={!canSeparate}
                >
                  <option value="RBC">RBC (42d)</option>
                  <option value="Platelets">Platelets (5d)</option>
                  <option value="Plasma">Plasma (365d)</option>
                  <option value="Cryoprecipitate">Cryoprecipitate (365d)</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Target Storage</label>
                <input
                  type="text"
                  value={compStorage}
                  onChange={(e) => setCompStorage(e.target.value)}
                  className={INPUT_CLASS}
                  disabled={!canSeparate}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!canSeparate || separating || separableUnits.length === 0}
              className={`${ACCENT_BTN_CLASS} w-full`}
            >
              {separating ? "Separating..." : "Separate & Store Component"}
            </button>
          </div>
        </form>
      </div>

      {/* Right: Blood Units & Screening Queue */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-[#14191B]">
            Blood Units & Component Inventory ({filteredUnits.length})
          </h3>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
          >
            <option value="All">All Blood Groups</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-2.5">
          {filteredUnits.map((u) => (
            <div
              key={u.id}
              className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {u.bloodGroup} • {u.component}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBloodBadgeClass(u.status)}`}
                  >
                    {u.status}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBloodBadgeClass(u.screeningStatus)}`}
                  >
                    Screening: {u.screeningStatus}
                  </span>
                </div>
                <span className="font-semibold text-[#14191B]">
                  {u.id} ({u.volumeMl} mL)
                </span>
              </div>

              <p className="mt-2 text-[#546369]">
                Donor: <strong>{u.donorName}</strong> ({u.donorId}) • Donation{" "}
                {u.donationId}
                {u.sourceUnitId ? ` • Source ${u.sourceUnitId}` : ""}
              </p>
              <p className="mt-0.5 text-[#6B7A80]">
                Collected: {u.collectionDate} • <strong>Exp: {u.expiryDate}</strong>{" "}
                • {u.storageLocation} ({u.storageTemp})
              </p>

              {canScreen && u.status === "Testing" && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E6EDEF] pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      onScreenUnit({
                        unitId: u.id,
                        screeningStatus: "Cleared",
                        storageLocation: "Cold Room Fridge A1",
                      })
                    }
                    className={PRIMARY_BTN_CLASS}
                  >
                    Clear Screening → Make Available
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onScreenUnit({
                        unitId: u.id,
                        screeningStatus: "Reactive",
                      })
                    }
                    className={DANGER_BTN_CLASS}
                  >
                    Mark Reactive & Discard
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
