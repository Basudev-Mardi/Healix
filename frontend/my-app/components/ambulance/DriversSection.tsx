"use client";

import React, { useState } from "react";
import type { AmbulanceDriver, AmbulanceVehicle } from "@/lib/ambulance/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  getAmbulanceBadgeClass,
} from "./ui";

interface DriversSectionProps {
  drivers: AmbulanceDriver[];
  vehicles: AmbulanceVehicle[];
  canManage: boolean;
  onRegisterDriver: (payload: {
    fullName: string;
    phone: string;
    email: string;
    licenseNumber: string;
    licenseValidUntil: string;
    experienceYears: number;
    assignedVehicleId: string;
  }) => Promise<boolean>;
  onUpdateDriverStatus: (payload: {
    driverId: string;
    availabilityStatus: "Available" | "Off-Duty";
  }) => Promise<void>;
}

export function DriversSection({
  drivers,
  vehicles,
  canManage,
  onRegisterDriver,
  onUpdateDriverStatus,
}: DriversSectionProps) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    licenseNumber: "",
    licenseValidUntil: "2028-12-31",
    experienceYears: "4",
    assignedVehicleId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onRegisterDriver({
        ...form,
        experienceYears: Number(form.experienceYears) || 0,
      });
      if (ok) {
        setForm({
          ...form,
          fullName: "",
          phone: "",
          email: "",
          licenseNumber: "",
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
          Register Ambulance Driver
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Validates driving license uniqueness and expiry before permitting
          emergency dispatch assignment.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Driver Full Name *</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={INPUT_CLASS}
              disabled={!canManage}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Phone *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Driving License No. *</label>
              <input
                type="text"
                required
                value={form.licenseNumber}
                onChange={(e) =>
                  setForm({ ...form, licenseNumber: e.target.value })
                }
                placeholder="e.g. DL-MH12-2022-8812"
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>License Valid Until *</label>
              <input
                type="date"
                required
                value={form.licenseValidUntil}
                onChange={(e) =>
                  setForm({ ...form, licenseValidUntil: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Experience (Years)</label>
              <input
                type="number"
                min="0"
                value={form.experienceYears}
                onChange={(e) =>
                  setForm({ ...form, experienceYears: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Preferred Vehicle</label>
              <select
                value={form.assignedVehicleId}
                onChange={(e) =>
                  setForm({ ...form, assignedVehicleId: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManage}
              >
                <option value="">Unassigned</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} ({v.vehicleType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canManage || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Registering Driver..." : "Register Driver"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Ambulance Drivers Roster ({drivers.length})
        </h3>
        <div className="mt-4 space-y-3">
          {drivers.map((d) => {
            const busy =
              d.availabilityStatus === "Assigned" ||
              d.availabilityStatus === "On-Trip";
            return (
              <div
                key={d.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {d.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getAmbulanceBadgeClass(d.availabilityStatus)}`}
                    >
                      {d.availabilityStatus}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getAmbulanceBadgeClass(d.employmentStatus)}`}
                    >
                      {d.employmentStatus}
                    </span>
                  </div>
                  <span className="font-semibold text-[#4A90A4]">
                    {d.totalTrips} completed trip(s)
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {d.fullName} • {d.phone}
                </p>
                <p className="mt-0.5 text-[#546369]">
                  License: <strong>{d.licenseNumber}</strong> (Valid until{" "}
                  {d.licenseValidUntil}) • {d.experienceYears} yrs experience
                </p>

                {canManage && !busy && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E6EDEF] pt-3">
                    {d.availabilityStatus !== "Available" ? (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDriverStatus({
                            driverId: d.id,
                            availabilityStatus: "Available",
                          })
                        }
                        className={ACCENT_BTN_CLASS}
                      >
                        Mark On-Duty (Available)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDriverStatus({
                            driverId: d.id,
                            availabilityStatus: "Off-Duty",
                          })
                        }
                        className={SECONDARY_BTN_CLASS}
                      >
                        Mark Off-Duty
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
