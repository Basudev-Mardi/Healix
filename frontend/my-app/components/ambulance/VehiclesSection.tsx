"use client";

import React, { useState } from "react";
import type { AmbulanceVehicle } from "@/lib/ambulance/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  getAmbulanceBadgeClass,
} from "./ui";

interface VehiclesSectionProps {
  vehicles: AmbulanceVehicle[];
  canManage: boolean;
  onRegisterVehicle: (payload: {
    registrationNumber: string;
    vehicleType: string;
    model: string;
    capacity: number;
    equipmentDetails: string;
    insuranceExpiry: string;
    fitnessCertExpiry: string;
    registrationValidUntil: string;
  }) => Promise<boolean>;
  onUpdateVehicleStatus: (payload: {
    ambulanceId: string;
    operationalStatus:
      | "Available"
      | "Returning"
      | "Under Maintenance"
      | "Unavailable";
  }) => Promise<void>;
}

export function VehiclesSection({
  vehicles,
  canManage,
  onRegisterVehicle,
  onUpdateVehicleStatus,
}: VehiclesSectionProps) {
  const [form, setForm] = useState({
    registrationNumber: "",
    vehicleType: "ALS",
    model: "",
    capacity: "2",
    equipmentDetails: "Oxygen Cylinder, Stretcher, AED, Suction Unit",
    insuranceExpiry: "2027-12-31",
    fitnessCertExpiry: "2027-12-31",
    registrationValidUntil: "2030-12-31",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onRegisterVehicle({
        ...form,
        capacity: Number(form.capacity) || 2,
      });
      if (ok) {
        setForm({ ...form, registrationNumber: "", model: "" });
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
          Register Ambulance Vehicle
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Record vehicle registration, medical equipment, and compliance
          validity dates.
        </p>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Registration Number *</label>
              <input
                type="text"
                required
                value={form.registrationNumber}
                onChange={(e) =>
                  setForm({ ...form, registrationNumber: e.target.value })
                }
                placeholder="e.g. MH-12-EM-1084"
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Vehicle Type *</label>
              <select
                value={form.vehicleType}
                onChange={(e) =>
                  setForm({ ...form, vehicleType: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              >
                <option value="ALS">ALS (Advanced Life Support)</option>
                <option value="BLS">BLS (Basic Life Support)</option>
                <option value="ICU Mobile">ICU Mobile</option>
                <option value="Neonatal">Neonatal</option>
                <option value="Patient Transport">Patient Transport</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className={LABEL_CLASS}>Vehicle Model *</label>
              <input
                type="text"
                required
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="e.g. Force Traveller ALS"
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Capacity</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Onboard Medical Equipment</label>
            <textarea
              rows={2}
              value={form.equipmentDetails}
              onChange={(e) =>
                setForm({ ...form, equipmentDetails: e.target.value })
              }
              className={INPUT_CLASS}
              disabled={!canManage}
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className={LABEL_CLASS}>Insurance Exp *</label>
              <input
                type="date"
                required
                value={form.insuranceExpiry}
                onChange={(e) =>
                  setForm({ ...form, insuranceExpiry: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Fitness Exp *</label>
              <input
                type="date"
                required
                value={form.fitnessCertExpiry}
                onChange={(e) =>
                  setForm({ ...form, fitnessCertExpiry: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Reg Valid Until *</label>
              <input
                type="date"
                required
                value={form.registrationValidUntil}
                onChange={(e) =>
                  setForm({ ...form, registrationValidUntil: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canManage || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Registering..." : "Register Ambulance"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Fleet & Live Vehicle Availability ({vehicles.length})
        </h3>
        <div className="mt-4 space-y-3">
          {vehicles.map((v) => {
            const busy =
              v.operationalStatus === "Assigned" ||
              v.operationalStatus === "Dispatched" ||
              v.operationalStatus === "On-Trip";
            return (
              <div
                key={v.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {v.registrationNumber}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getAmbulanceBadgeClass(v.operationalStatus)}`}
                    >
                      {v.operationalStatus}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                      {v.id} • {v.vehicleType}
                    </span>
                  </div>
                  <span className="font-semibold text-[#4A90A4]">
                    {v.totalTrips} trips • {v.totalDistanceKm.toFixed(1)} km
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {v.model} (Capacity: {v.capacity})
                </p>
                <p className="mt-0.5 text-[#546369]">
                  Equipment: {v.equipmentDetails || "Standard"}
                </p>
                <p className="mt-1 text-[11px] text-[#6B7A80]">
                  Insurance: {v.insuranceExpiry} • Fitness:{" "}
                  {v.fitnessCertExpiry} • Reg Valid: {v.registrationValidUntil}
                </p>

                {canManage && !busy && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E6EDEF] pt-3">
                    {v.operationalStatus !== "Available" && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateVehicleStatus({
                            ambulanceId: v.id,
                            operationalStatus: "Available",
                          })
                        }
                        className={ACCENT_BTN_CLASS}
                      >
                        Mark Available
                      </button>
                    )}
                    {v.operationalStatus !== "Under Maintenance" && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateVehicleStatus({
                            ambulanceId: v.id,
                            operationalStatus: "Under Maintenance",
                          })
                        }
                        className={SECONDARY_BTN_CLASS}
                      >
                        Send to Maintenance
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
