"use client";

import React, { useState } from "react";
import type {
  AmbulanceDispatch,
  AmbulanceDriver,
  AmbulancePatient,
  AmbulanceRequest,
  AmbulanceVehicle,
} from "@/lib/ambulance/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getAmbulanceBadgeClass,
} from "./ui";

const NEXT_STAGE: Record<
  string,
  | "Dispatched"
  | "Arrived at Pickup"
  | "Patient Onboard"
  | "Arrived at Hospital"
  | "Completed"
  | undefined
> = {
  Assigned: "Dispatched",
  Dispatched: "Arrived at Pickup",
  "Arrived at Pickup": "Patient Onboard",
  "Patient Onboard": "Arrived at Hospital",
  "Arrived at Hospital": "Completed",
};

interface EmergencyDispatchSectionProps {
  patients: AmbulancePatient[];
  vehicles: AmbulanceVehicle[];
  drivers: AmbulanceDriver[];
  requests: AmbulanceRequest[];
  dispatches: AmbulanceDispatch[];
  canCreateRequest: boolean;
  canDispatch: boolean;
  canUpdateTrip: boolean;
  onCreateRequest: (payload: {
    patientId?: string;
    patientName: string;
    contactNumber: string;
    sourceChannel: string;
    pickupLocation: string;
    destinationHospital: string;
    emergencyType: string;
    priority: "Critical" | "High" | "Standard";
  }) => Promise<boolean>;
  onCancelRequest: (requestId: string) => Promise<void>;
  onAssignDispatch: (payload: {
    requestId: string;
    ambulanceId: string;
    driverId: string;
    estimatedArrivalMins: number;
  }) => Promise<boolean>;
  onProgressDispatch: (payload: {
    dispatchId: string;
    nextStatus:
      | "Dispatched"
      | "Arrived at Pickup"
      | "Patient Onboard"
      | "Arrived at Hospital"
      | "Completed";
    distanceKm?: number;
    fuelUsedLiters?: number;
    remarks?: string;
  }) => Promise<void>;
}

export function EmergencyDispatchSection({
  patients,
  vehicles,
  drivers,
  requests,
  dispatches,
  canCreateRequest,
  canDispatch,
  canUpdateTrip,
  onCreateRequest,
  onCancelRequest,
  onAssignDispatch,
  onProgressDispatch,
}: EmergencyDispatchSectionProps) {
  const availableVehicles = vehicles.filter(
    (v) => v.operationalStatus === "Available"
  );
  const availableDrivers = drivers.filter(
    (d) =>
      d.availabilityStatus === "Available" && d.employmentStatus === "Active"
  );
  const unassignedRequests = requests.filter((r) => r.status === "Requested");

  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [sourceChannel, setSourceChannel] = useState("Emergency Dept");
  const [pickupLocation, setPickupLocation] = useState("");
  const [destinationHospital, setDestinationHospital] = useState(
    "Healix Main Hospital"
  );
  const [emergencyType, setEmergencyType] = useState("Cardiac Emergency");
  const [priority, setPriority] = useState<"Critical" | "High" | "Standard">(
    "Critical"
  );
  const [creating, setCreating] = useState(false);

  // Dispatch assignment state
  const [assignReqId, setAssignReqId] = useState(
    unassignedRequests[0]?.id ?? ""
  );
  const [assignVehId, setAssignVehId] = useState(
    availableVehicles[0]?.id ?? ""
  );
  const [assignDrvId, setAssignDrvId] = useState(availableDrivers[0]?.id ?? "");
  const [etaMins, setEtaMins] = useState("12");
  const [assigning, setAssigning] = useState(false);

  // Completion metrics per dispatch
  const [distanceById, setDistanceById] = useState<Record<string, string>>({});
  const [fuelById, setFuelById] = useState<Record<string, string>>({});

  function handleSelectPatient(id: string) {
    setPatientId(id);
    const p = patients.find((x) => x.id === id);
    if (p) {
      setPatientName(p.fullName);
      setContactNumber(p.phone);
    }
  }

  async function handleCreateReq(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const ok = await onCreateRequest({
        patientId: patientId || undefined,
        patientName,
        contactNumber,
        sourceChannel,
        pickupLocation,
        destinationHospital,
        emergencyType,
        priority,
      });
      if (ok) {
        setPatientName("");
        setContactNumber("");
        setPickupLocation("");
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    const rId = assignReqId || unassignedRequests[0]?.id || "";
    const vId = assignVehId || availableVehicles[0]?.id || "";
    const dId = assignDrvId || availableDrivers[0]?.id || "";
    if (!rId || !vId || !dId) return;
    setAssigning(true);
    try {
      await onAssignDispatch({
        requestId: rId,
        ambulanceId: vId,
        driverId: dId,
        estimatedArrivalMins: Number(etaMins) || 15,
      });
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Emergency Request + Dispatch Assignment */}
      <div className="space-y-4 lg:col-span-5">
        <form
          onSubmit={handleCreateReq}
          className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5"
        >
          <h2 className="text-lg font-semibold text-[#14191B]">
            Log Emergency Ambulance Request
          </h2>
          <div className="mt-3 space-y-3">
            <div>
              <label className={LABEL_CLASS}>Existing Patient (Optional)</label>
              <select
                value={patientId}
                onChange={(e) => handleSelectPatient(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreateRequest}
              >
                <option value="">— External / Walk-in Caller —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Patient Name *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className={INPUT_CLASS}
                  disabled={!canCreateRequest}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className={INPUT_CLASS}
                  disabled={!canCreateRequest}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Emergency Type *</label>
                <input
                  type="text"
                  required
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className={INPUT_CLASS}
                  disabled={!canCreateRequest}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Priority *</label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(
                      e.target.value as "Critical" | "High" | "Standard"
                    )
                  }
                  className={INPUT_CLASS}
                  disabled={!canCreateRequest}
                >
                  <option value="Critical">Critical (Code Red)</option>
                  <option value="High">High</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Pickup Location *</label>
              <input
                type="text"
                required
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Street address, landmark..."
                className={INPUT_CLASS}
                disabled={!canCreateRequest}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Destination Hospital</label>
                <input
                  type="text"
                  value={destinationHospital}
                  onChange={(e) => setDestinationHospital(e.target.value)}
                  className={INPUT_CLASS}
                  disabled={!canCreateRequest}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Channel</label>
                <select
                  value={sourceChannel}
                  onChange={(e) => setSourceChannel(e.target.value)}
                  className={INPUT_CLASS}
                  disabled={!canCreateRequest}
                >
                  <option value="Emergency Dept">Emergency Dept</option>
                  <option value="IPD">IPD Transfer</option>
                  <option value="External Call 108">External Call 108</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canCreateRequest || creating}
              className={`${PRIMARY_BTN_CLASS} w-full`}
            >
              {creating ? "Logging Request..." : "Create Emergency Request"}
            </button>
          </div>
        </form>

        <form
          onSubmit={handleAssign}
          className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5"
        >
          <h3 className="text-base font-semibold text-[#14191B]">
            Assign Available Ambulance & Driver
          </h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className={LABEL_CLASS}>Pending Request *</label>
              <select
                value={assignReqId || unassignedRequests[0]?.id || ""}
                onChange={(e) => setAssignReqId(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canDispatch || unassignedRequests.length === 0}
              >
                {unassignedRequests.length === 0 ? (
                  <option value="">No unassigned requests</option>
                ) : (
                  unassignedRequests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} — {r.patientName} ({r.priority})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Available Ambulance *</label>
                <select
                  value={assignVehId || availableVehicles[0]?.id || ""}
                  onChange={(e) => setAssignVehId(e.target.value)}
                  className={INPUT_CLASS}
                  disabled={!canDispatch || availableVehicles.length === 0}
                >
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.vehicleType})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Available Driver *</label>
                <select
                  value={assignDrvId || availableDrivers[0]?.id || ""}
                  onChange={(e) => setAssignDrvId(e.target.value)}
                  className={INPUT_CLASS}
                  disabled={!canDispatch || availableDrivers.length === 0}
                >
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Estimated Arrival (mins)</label>
              <input
                type="number"
                min="1"
                value={etaMins}
                onChange={(e) => setEtaMins(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canDispatch}
              />
            </div>
            <button
              type="submit"
              disabled={
                !canDispatch ||
                assigning ||
                unassignedRequests.length === 0 ||
                availableVehicles.length === 0 ||
                availableDrivers.length === 0
              }
              className={`${ACCENT_BTN_CLASS} w-full`}
            >
              {assigning ? "Dispatching..." : "Assign & Create Dispatch"}
            </button>
          </div>
        </form>
      </div>

      {/* Right: Live Dispatches & Requests Queue */}
      <div className="space-y-4 lg:col-span-7">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
          <h3 className="text-base font-semibold text-[#14191B]">
            Live Dispatch Tracking ({dispatches.length})
          </h3>
          <div className="mt-4 space-y-3">
            {dispatches.map((dsp) => {
              const next = NEXT_STAGE[dsp.status];
              return (
                <div
                  key={dsp.id}
                  className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {dsp.id}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getAmbulanceBadgeClass(dsp.status)}`}
                      >
                        {dsp.status}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                        {dsp.registrationNumber} • {dsp.driverName}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#6B7A80]">
                      ETA: {dsp.estimatedArrivalMins} mins
                    </span>
                  </div>

                  <p className="mt-2 font-semibold text-[#14191B]">
                    {dsp.pickupLocation} → {dsp.destinationHospital}
                  </p>
                  <p className="mt-0.5 text-[#6B7A80]">
                    Request {dsp.requestId} • Assigned{" "}
                    {formatDateTime(dsp.assignedAt)}
                  </p>

                  {canUpdateTrip && next && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#E6EDEF] pt-3">
                      {next === "Completed" && (
                        <>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={distanceById[dsp.id] ?? "12.5"}
                            onChange={(e) =>
                              setDistanceById((prev) => ({
                                ...prev,
                                [dsp.id]: e.target.value,
                              }))
                            }
                            placeholder="Distance (km)"
                            className="w-24 rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
                          />
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={fuelById[dsp.id] ?? "2.0"}
                            onChange={(e) =>
                              setFuelById((prev) => ({
                                ...prev,
                                [dsp.id]: e.target.value,
                              }))
                            }
                            placeholder="Fuel (L)"
                            className="w-24 rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
                          />
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onProgressDispatch({
                            dispatchId: dsp.id,
                            nextStatus: next,
                            distanceKm:
                              next === "Completed"
                                ? Number(distanceById[dsp.id] ?? 12.5)
                                : undefined,
                            fuelUsedLiters:
                              next === "Completed"
                                ? Number(fuelById[dsp.id] ?? 2.0)
                                : undefined,
                          })
                        }
                        className={PRIMARY_BTN_CLASS}
                      >
                        Advance → {next}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
          <h3 className="text-base font-semibold text-[#14191B]">
            Emergency Requests Queue ({requests.length})
          </h3>
          <div className="mt-3 space-y-2.5">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] border border-white/90 bg-[#F8FAFA] p-3.5 text-xs"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-[#14191B]">{req.id}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getAmbulanceBadgeClass(req.priority)}`}
                    >
                      {req.priority}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getAmbulanceBadgeClass(req.status)}`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold text-[#14191B]">
                    {req.patientName} • {req.emergencyType}
                  </p>
                  <p className="text-[11px] text-[#6B7A80]">
                    {req.pickupLocation} → {req.destinationHospital}
                  </p>
                </div>
                {canDispatch &&
                  req.status !== "Completed" &&
                  req.status !== "Cancelled" && (
                    <button
                      type="button"
                      onClick={() => onCancelRequest(req.id)}
                      className={DANGER_BTN_CLASS}
                    >
                      Cancel
                    </button>
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
