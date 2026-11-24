"use client";

import React, { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import type { PatientPortalState } from "@/lib/patient-portal/types";
import { PatientAuthView } from "./PatientAuthView";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  downloadInvoicePdf,
  downloadPrescriptionPdf,
  formatDateTime,
  formatMoney,
  getPortalBadgeClass,
  printDocumentHtml,
} from "./ui";

type PortalSection =
  | "dashboard"
  | "profile"
  | "appointments"
  | "tokens"
  | "records"
  | "prescriptions"
  | "labs"
  | "admissions"
  | "billing"
  | "insurance"
  | "notifications"
  | "support";

const NAV_ITEMS: { id: PortalSection; label: string }[] = [
  { id: "dashboard", label: "1. Dashboard" },
  { id: "profile", label: "2. My Profile" },
  { id: "appointments", label: "3. Appointments" },
  { id: "tokens", label: "4. My Tokens" },
  { id: "records", label: "5. Medical Records" },
  { id: "prescriptions", label: "6. Prescriptions" },
  { id: "labs", label: "7. Lab Reports" },
  { id: "admissions", label: "8. Admissions" },
  { id: "billing", label: "9. Billing" },
  { id: "insurance", label: "10. Insurance" },
  { id: "notifications", label: "11. Notifications" },
  { id: "support", label: "12. Support" },
];

const SESSION_KEY = "healix_patient_portal_token";

export function PatientPortalWorkspace() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SESSION_KEY);
  });
  const [active, setActive] = useState<PortalSection>("dashboard");
  const [state, setState] = useState<PatientPortalState | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    phone: "",
    email: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    allergies: "",
  });

  // Appointment booking state
  const [bookDocId, setBookDocId] = useState("");
  const [bookDate, setBookDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [bookSlot, setBookSlot] = useState("10:00");
  const [bookReason, setBookReason] = useState("");
  const [reschedDateById, setReschedDateById] = useState<Record<string, string>>(
    {}
  );
  const [reschedSlotById, setReschedSlotById] = useState<Record<string, string>>(
    {}
  );

  // Billing payment state
  const [payMethodById, setPayMethodById] = useState<
    Record<string, "Card" | "UPI" | "Bank Transfer">
  >({});

  // Support ticket state
  const [supSubject, setSupSubject] = useState("");
  const [supCategory, setSupCategory] = useState("General Inquiry");
  const [supMessage, setSupMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl("/api/patient-portal/state"), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (res.status === 401) {
          window.localStorage.removeItem(SESSION_KEY);
          if (!cancelled) {
            setToken(null);
            setState(null);
          }
          return;
        }
        if (!res.ok) throw new Error(data.error || "Failed to load portal.");
        if (!cancelled) {
          const s = data as PatientPortalState;
          setState(s);
          setProfileForm({
            phone: s.profile.phone,
            email: s.profile.email,
            address: s.profile.address,
            emergencyContactName: s.profile.emergencyContactName,
            emergencyContactPhone: s.profile.emergencyContactPhone,
            allergies: s.profile.allergies,
          });
          if (s.doctors.length > 0) {
            setBookDocId((prev) => prev || s.doctors[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setBanner({
            type: "error",
            text: err instanceof Error ? err.message : "Could not load portal.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function refreshPortal() {
    if (!token) return;
    const res = await fetch(apiUrl("/api/patient-portal/state"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();
    if (res.ok) {
      setState(data as PatientPortalState);
    }
  }

  async function mutate(
    path: string,
    method: "POST" | "PATCH",
    body: unknown,
    successText: string
  ): Promise<boolean> {
    if (!token) return false;
    setBanner(null);
    try {
      const res = await fetch(apiUrl(path), {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");
      await refreshPortal();
      setBanner({ type: "success", text: successText });
      return true;
    } catch (err) {
      setBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Action failed.",
      });
      return false;
    }
  }

  async function handleLogout() {
    if (token) {
      await fetch(apiUrl("/api/patient-portal/auth/logout"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    window.localStorage.removeItem(SESSION_KEY);
    setToken(null);
    setState(null);
  }

  if (!token) {
    return (
      <PatientAuthView
        onAuthenticated={(session) => {
          window.localStorage.setItem(SESSION_KEY, session.token);
          setToken(session.token);
        }}
      />
    );
  }

  if (loading || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E2E9EB] text-sm text-[#546369]">
        Loading your personal Healix Patient Portal...
      </div>
    );
  }

  const unreadCount = state.notifications.filter((n) => !n.isRead).length;
  const upcomingAppointments = state.appointments.filter(
    (a) => a.status !== "Cancelled" && a.status !== "Completed"
  );
  const outstandingTotal = state.invoices
    .filter((i) => i.status !== "Cancelled")
    .reduce((s, i) => s + i.outstandingBalance, 0);
  const activeAdmission = state.admissions.find((a) => a.status === "Admitted");
  const selectedDoctor = state.doctors.find((d) => d.id === bookDocId);

  return (
    <div className="min-h-screen bg-[#E2E9EB] px-4 py-6 text-[#14191B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Patient-only Header (Zero staff links or admin controls) */}
        <header className="flex flex-col gap-4 rounded-[30px] border border-white/80 bg-[#EDF2F3] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#181C1E] px-3 py-1 text-[11px] font-semibold text-white">
                Healix Patient Portal
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#4A90A4]">
                Patient ID: {state.profile.id}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#14191B]">
              Welcome, {state.profile.fullName}
            </h1>
            <p className="text-xs text-[#6B7A80]">
              Blood Group: {state.profile.bloodGroup || "—"} • Private,
              encrypted access to your personal health records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActive("notifications")}
              className={SECONDARY_BTN_CLASS}
            >
              Notifications ({unreadCount} unread)
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className={PRIMARY_BTN_CLASS}
            >
              Sign Out
            </button>
          </div>
        </header>

        {banner && (
          <div
            className={`flex items-center justify-between rounded-[20px] px-4 py-3 text-xs font-semibold ${
              banner.type === "success"
                ? "bg-[#E4F4F0] text-[#1F6355]"
                : "bg-[#FCEBE7] text-[#B8381B]"
            }`}
          >
            <span>{banner.text}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="ml-4 opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main 12-Section Layout */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left Navigation Sidebar */}
          <aside className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-3 lg:col-span-3">
            <nav className="flex flex-wrap gap-1.5 lg:flex-col">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  className={`flex items-center justify-between rounded-full px-4 py-2.5 text-left text-xs font-semibold transition ${
                    active === item.id
                      ? "bg-[#181C1E] text-white"
                      : "text-[#47565C] hover:bg-white/80"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.id === "notifications" && unreadCount > 0 && (
                    <span className="rounded-full bg-[#EF5B3A] px-2 py-0.5 text-[10px] text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Right Content Panel */}
          <main className="space-y-5 lg:col-span-9">
            {/* 1. DASHBOARD */}
            {active === "dashboard" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      label: "Upcoming Visits",
                      value: String(upcomingAppointments.length),
                      accent: "bg-[#8FC1CE]",
                      go: "appointments" as PortalSection,
                    },
                    {
                      label: "Active Tokens",
                      value: String(
                        state.tokens.filter((t) => t.status !== "Completed")
                          .length
                      ),
                      accent: "bg-[#6AB4A4]",
                      go: "tokens" as PortalSection,
                    },
                    {
                      label: "Verified Reports",
                      value: String(
                        state.labReports.length +
                          state.verifiedLabResults.length +
                          state.radiologyReports.length
                      ),
                      accent: "bg-[#4A90A4]",
                      go: "labs" as PortalSection,
                    },
                    {
                      label: "Outstanding Bills",
                      value: formatMoney(outstandingTotal),
                      accent: "bg-[#EB9B52]",
                      go: "billing" as PortalSection,
                    },
                  ].map((card) => (
                    <button
                      key={card.label}
                      type="button"
                      onClick={() => setActive(card.go)}
                      className="rounded-[24px] border border-white/85 bg-[#EDF2F3] p-4 text-left transition hover:bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6B7A80]">
                          {card.label}
                        </span>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${card.accent}`}
                        />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-[#14191B]">
                        {card.value}
                      </p>
                    </button>
                  ))}
                </div>

                {activeAdmission && (
                  <div className="rounded-[24px] border border-white/85 bg-[#E4F4F0] p-4 text-xs text-[#1F6355]">
                    <p className="font-bold">
                      Current Inpatient Admission: {activeAdmission.id}
                    </p>
                    <p className="mt-0.5">
                      {activeAdmission.department} • {activeAdmission.ward} •
                      Room {activeAdmission.room} / Bed{" "}
                      {activeAdmission.bedLabel} • Dr.{" "}
                      {activeAdmission.admittingDoctor}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-[26px] border border-white/80 bg-[#EDF2F3] p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold">
                        Recent Prescriptions
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActive("prescriptions")}
                        className="text-xs font-semibold text-[#4A90A4]"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      {state.prescriptions.slice(0, 3).map((rx) => (
                        <div
                          key={rx.id}
                          className="rounded-[18px] bg-[#F8FAFA] p-3"
                        >
                          <p className="font-semibold">
                            {rx.id} • {rx.doctorName}
                          </p>
                          <p className="text-[#6B7A80]">
                            {rx.items.map((i) => i.medicineName).join(", ")}
                          </p>
                        </div>
                      ))}
                      {state.prescriptions.length === 0 && (
                        <p className="text-[#7D8C92]">No prescriptions yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-white/80 bg-[#EDF2F3] p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold">
                        Recent Notifications
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActive("notifications")}
                        className="text-xs font-semibold text-[#4A90A4]"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      {state.notifications.slice(0, 3).map((n) => (
                        <div
                          key={n.id}
                          className="rounded-[18px] bg-[#F8FAFA] p-3"
                        >
                          <p className="font-semibold">{n.title}</p>
                          <p className="text-[#6B7A80]">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MY PROFILE */}
            {active === "profile" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutate(
                    "/api/patient-portal/profile",
                    "PATCH",
                    profileForm,
                    "Your profile and emergency contact details have been updated."
                  );
                }}
                className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6"
              >
                <h2 className="text-lg font-semibold">My Personal Profile</h2>
                <p className="text-xs text-[#6B7A80]">
                  Identity fields (Patient ID, DOB, Blood Group) are protected
                  by hospital medical records.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 rounded-[20px] bg-white p-4 text-xs sm:grid-cols-4">
                  <div>
                    <p className="text-[#7D8C92]">Patient ID</p>
                    <p className="font-bold">{state.profile.id}</p>
                  </div>
                  <div>
                    <p className="text-[#7D8C92]">Full Name</p>
                    <p className="font-bold">{state.profile.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[#7D8C92]">Date of Birth</p>
                    <p className="font-bold">
                      {state.profile.dateOfBirth || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7D8C92]">Blood Group</p>
                    <p className="font-bold">
                      {state.profile.bloodGroup || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLASS}>Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          phone: e.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          email: e.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Residential Address</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          address: e.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Emergency Contact Name</label>
                    <input
                      type="text"
                      value={profileForm.emergencyContactName}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          emergencyContactName: e.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>
                      Emergency Contact Phone
                    </label>
                    <input
                      type="text"
                      value={profileForm.emergencyContactPhone}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          emergencyContactPhone: e.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Known Allergies</label>
                    <input
                      type="text"
                      value={profileForm.allergies}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          allergies: e.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <button type="submit" className={`${PRIMARY_BTN_CLASS} mt-4`}>
                  Save Profile Updates
                </button>
              </form>
            )}

            {/* 3. APPOINTMENTS */}
            {active === "appointments" && (
              <div className="space-y-5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    mutate(
                      "/api/patient-portal/appointments",
                      "POST",
                      {
                        doctorId: bookDocId,
                        appointmentDate: bookDate,
                        timeSlot: bookSlot,
                        reason: bookReason,
                      },
                      "Appointment booked and synced with OPD schedule."
                    ).then((ok) => {
                      if (ok) setBookReason("");
                    });
                  }}
                  className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5"
                >
                  <h2 className="text-lg font-semibold">
                    Book an OPD Appointment
                  </h2>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className={LABEL_CLASS}>
                        Doctor & Department *
                      </label>
                      <select
                        value={bookDocId}
                        onChange={(e) => setBookDocId(e.target.value)}
                        className={INPUT_CLASS}
                      >
                        {state.doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} — {d.department} ({d.room})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Date *</label>
                      <input
                        type="date"
                        required
                        value={bookDate}
                        onChange={(e) => setBookDate(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Time Slot *</label>
                      <select
                        value={bookSlot}
                        onChange={(e) => setBookSlot(e.target.value)}
                        className={INPUT_CLASS}
                      >
                        {(
                          selectedDoctor?.slots ?? [
                            "09:00",
                            "10:00",
                            "11:00",
                            "14:00",
                            "15:00",
                          ]
                        ).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={bookReason}
                      onChange={(e) => setBookReason(e.target.value)}
                      placeholder="Reason for visit (optional)..."
                      className={`${INPUT_CLASS} sm:flex-1`}
                    />
                    <button type="submit" className={PRIMARY_BTN_CLASS}>
                      Confirm Booking
                    </button>
                  </div>
                </form>

                <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
                  <h3 className="text-base font-semibold">
                    My Appointments ({state.appointments.length})
                  </h3>
                  <div className="mt-3 space-y-3">
                    {state.appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                              {apt.id}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPortalBadgeClass(apt.status)}`}
                            >
                              {apt.status}
                            </span>
                          </div>
                          <span className="font-semibold">
                            {apt.appointmentDate} • {apt.timeSlot}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold">
                          {apt.doctorName} — {apt.department}{" "}
                          {apt.room ? `(${apt.room})` : ""}
                        </p>
                        <p className="mt-0.5 text-[#6B7A80]">{apt.reason}</p>

                        {apt.status !== "Cancelled" &&
                          apt.status !== "Completed" && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#E6EDEF] pt-3">
                              <input
                                type="date"
                                value={
                                  reschedDateById[apt.id] ?? apt.appointmentDate
                                }
                                onChange={(e) =>
                                  setReschedDateById((prev) => ({
                                    ...prev,
                                    [apt.id]: e.target.value,
                                  }))
                                }
                                className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
                              />
                              <select
                                value={reschedSlotById[apt.id] ?? apt.timeSlot}
                                onChange={(e) =>
                                  setReschedSlotById((prev) => ({
                                    ...prev,
                                    [apt.id]: e.target.value,
                                  }))
                                }
                                className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
                              >
                                {[
                                  "09:00",
                                  "09:30",
                                  "10:00",
                                  "10:30",
                                  "11:00",
                                  "14:00",
                                  "15:00",
                                  "16:00",
                                ].map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() =>
                                  mutate(
                                    "/api/patient-portal/appointments",
                                    "PATCH",
                                    {
                                      appointmentId: apt.id,
                                      action: "reschedule",
                                      appointmentDate:
                                        reschedDateById[apt.id] ??
                                        apt.appointmentDate,
                                      timeSlot:
                                        reschedSlotById[apt.id] ?? apt.timeSlot,
                                    },
                                    `Appointment ${apt.id} rescheduled.`
                                  )
                                }
                                className={ACCENT_BTN_CLASS}
                              >
                                Reschedule
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  mutate(
                                    "/api/patient-portal/appointments",
                                    "PATCH",
                                    {
                                      appointmentId: apt.id,
                                      action: "cancel",
                                    },
                                    `Appointment ${apt.id} cancelled.`
                                  )
                                }
                                className={DANGER_BTN_CLASS}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. MY TOKENS */}
            {active === "tokens" && (
              <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Live OPD Tokens & Queue Position
                    </h2>
                    <p className="text-xs text-[#6B7A80]">
                      Synced live with OPD Queue Management.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshPortal}
                    className={SECONDARY_BTN_CLASS}
                  >
                    Refresh Queue
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {state.tokens.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#181C1E] px-3 py-1 text-sm font-bold text-white">
                            Token {t.tokenNumber}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPortalBadgeClass(t.status)}`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold">
                          {t.doctorName} • {t.department} ({t.room})
                        </p>
                        <p className="text-[#6B7A80]">
                          Date: {t.tokenDate} • Appointment {t.appointmentId}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-white px-4 py-3 text-center">
                        <p className="text-[10px] uppercase text-[#7D8C92]">
                          Patients Ahead
                        </p>
                        <p className="text-2xl font-bold text-[#4A90A4]">
                          {t.status === "Waiting" ? t.aheadInQueue : 0}
                        </p>
                      </div>
                    </div>
                  ))}
                  {state.tokens.length === 0 && (
                    <p className="rounded-[18px] bg-[#F8FAFA] py-8 text-center text-xs text-[#7D8C92]">
                      No OPD queue tokens issued for your account yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 5. MEDICAL RECORDS */}
            {active === "records" && (
              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
                  <h2 className="text-lg font-semibold">
                    Consultation & Clinical History ({state.consultations.length}
                    )
                  </h2>
                  <div className="mt-4 space-y-3">
                    {state.consultations.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold">
                            {c.visitDate} • {c.doctorName} ({c.department})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              printDocumentHtml(
                                `Clinical Record ${c.id}`,
                                `<h2>Clinical Consultation Summary (${c.id})</h2><p><strong>Patient:</strong> ${state.profile.fullName} (${state.profile.id})</p><p><strong>Doctor:</strong> ${c.doctorName} (${c.department}) • ${c.visitDate}</p><p><strong>Symptoms:</strong> ${c.symptoms}</p><p><strong>Diagnosis:</strong> ${c.diagnosis}</p><p><strong>Treatment:</strong> ${c.treatment}</p>`
                              )
                            }
                            className={SECONDARY_BTN_CLASS}
                          >
                            Download PDF
                          </button>
                        </div>
                        <p className="mt-2">
                          <strong>Diagnosis:</strong> {c.diagnosis}
                        </p>
                        <p className="mt-0.5 text-[#546369]">
                          <strong>Treatment:</strong> {c.treatment}
                        </p>
                      </div>
                    ))}
                    {state.consultations.length === 0 && (
                      <p className="text-xs text-[#7D8C92]">
                        No completed consultations recorded yet.
                      </p>
                    )}
                  </div>
                </div>

                {state.radiologyReports.length > 0 && (
                  <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
                    <h3 className="text-base font-semibold">
                      Finalized Radiology Reports (
                      {state.radiologyReports.length})
                    </h3>
                    <div className="mt-3 space-y-2.5 text-xs">
                      {state.radiologyReports.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-[18px] bg-[#F8FAFA] p-4"
                        >
                          <p className="font-bold">
                            {r.id} • {r.modality} — {r.examType} ({r.bodyRegion})
                          </p>
                          <p className="mt-1">
                            <strong>Impression:</strong> {r.impression}
                          </p>
                          <p className="mt-0.5 text-[#6B7A80]">
                            Radiologist: {r.radiologistName}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. PRESCRIPTIONS */}
            {active === "prescriptions" && (
              <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
                <h2 className="text-lg font-semibold">
                  Digital Prescriptions ({state.prescriptions.length})
                </h2>
                <div className="mt-4 space-y-3">
                  {state.prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                            {rx.id}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPortalBadgeClass(rx.status)}`}
                          >
                            {rx.status}
                          </span>
                          <span className="text-[#6B7A80]">
                            {rx.doctorName} • {formatDateTime(rx.prescribedAt)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            downloadPrescriptionPdf(state.profile, rx)
                          }
                          className={ACCENT_BTN_CLASS}
                        >
                          Download PDF
                        </button>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        {rx.items.map((it) => (
                          <div
                            key={`${rx.id}-${it.medicineCode}`}
                            className="rounded-[14px] bg-white px-3 py-2"
                          >
                            <p className="font-semibold">{it.medicineName}</p>
                            <p className="text-[#6B7A80]">
                              {it.dosage} • {it.frequency} • {it.duration}{" "}
                              {it.instructions ? `• ${it.instructions}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {state.prescriptions.length === 0 && (
                    <p className="text-xs text-[#7D8C92]">
                      No digital prescriptions issued yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 7. LAB REPORTS */}
            {active === "labs" && (
              <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
                <h2 className="text-lg font-semibold">
                  Verified Laboratory Reports & Results (
                  {state.labReports.length + state.verifiedLabResults.length})
                </h2>
                <p className="text-xs text-[#6B7A80]">
                  Only Pathologist-verified results and finalized reports are
                  displayed.
                </p>

                <div className="mt-4 space-y-3">
                  {state.verifiedLabResults.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                            {r.testCode}
                          </span>
                          <span className="font-bold">{r.testName}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPortalBadgeClass(r.isOutOfRange ? "Out of Range" : "Verified")}`}
                          >
                            {r.isOutOfRange ? "Out of Range" : "Verified"}
                          </span>
                        </div>
                        <p className="mt-1 text-[#546369]">
                          Result:{" "}
                          <strong>
                            {r.resultValue} {r.unit}
                          </strong>{" "}
                          (Ref: {r.referenceRange}) • Verified by {r.verifiedBy}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          printDocumentHtml(
                            `Lab Result ${r.id}`,
                            `<h2>Verified Laboratory Result (${r.id})</h2><p><strong>Patient:</strong> ${state.profile.fullName} (${state.profile.id})</p><p><strong>Test:</strong> ${r.testCode} — ${r.testName}</p><p><strong>Result:</strong> ${r.resultValue} ${r.unit} (Reference: ${r.referenceRange})</p><p><strong>Verified By:</strong> ${r.verifiedBy}</p>`
                          )
                        }
                        className={SECONDARY_BTN_CLASS}
                      >
                        Download PDF
                      </button>
                    </div>
                  ))}
                  {state.verifiedLabResults.length === 0 &&
                    state.labReports.length === 0 && (
                      <p className="text-xs text-[#7D8C92]">
                        No finalized lab reports available yet.
                      </p>
                    )}
                </div>
              </div>
            )}

            {/* 8. ADMISSIONS */}
            {active === "admissions" && (
              <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
                <h2 className="text-lg font-semibold">
                  Inpatient Admissions & Discharge Summaries (
                  {state.admissions.length})
                </h2>
                <div className="mt-4 space-y-3">
                  {state.admissions.map((adm) => {
                    const summary = state.dischargeSummaries.find(
                      (s) => s.admissionId === adm.id
                    );
                    return (
                      <div
                        key={adm.id}
                        className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                              {adm.id}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPortalBadgeClass(adm.status)}`}
                            >
                              {adm.status}
                            </span>
                          </div>
                          <span className="text-[#6B7A80]">
                            Admitted {formatDateTime(adm.admissionDate)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold">
                          {adm.department} • {adm.ward} • Room {adm.room} / Bed{" "}
                          {adm.bedLabel}
                        </p>
                        <p className="mt-0.5 text-[#546369]">
                          Doctor: {adm.admittingDoctor} • Diagnosis:{" "}
                          {adm.diagnosis}
                        </p>
                        {summary && (
                          <div className="mt-2 rounded-[14px] bg-white p-3">
                            <p className="font-semibold text-[#4A90A4]">
                              Discharge Summary ({summary.dischargeDate})
                            </p>
                            <p className="mt-0.5">{summary.followUpInstructions}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {state.admissions.length === 0 && (
                    <p className="text-xs text-[#7D8C92]">
                      No hospital admissions on file.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 9. BILLING */}
            {active === "billing" && (
              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
                  <h2 className="text-lg font-semibold">
                    My Hospital Bills & Online Payments ({state.invoices.length})
                  </h2>
                  <div className="mt-4 space-y-3">
                    {state.invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                              {inv.id} • {inv.category}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPortalBadgeClass(inv.status)}`}
                            >
                              {inv.status}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              downloadInvoicePdf(state.profile, inv)
                            }
                            className={SECONDARY_BTN_CLASS}
                          >
                            Download PDF Invoice
                          </button>
                        </div>

                        <div className="mt-2 grid grid-cols-3 gap-2 rounded-[14px] bg-white p-2.5">
                          <div>
                            <p className="text-[10px] text-[#7D8C92]">Total</p>
                            <p className="font-bold">
                              {formatMoney(inv.totalAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#7D8C92]">Paid</p>
                            <p className="font-bold text-[#1F6355]">
                              {formatMoney(inv.paidAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#7D8C92]">
                              Balance Due
                            </p>
                            <p className="font-bold text-[#B8381B]">
                              {formatMoney(inv.outstandingBalance)}
                            </p>
                          </div>
                        </div>

                        {inv.outstandingBalance > 0 &&
                          inv.status !== "Cancelled" && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#E6EDEF] pt-3">
                              <select
                                value={payMethodById[inv.id] ?? "UPI"}
                                onChange={(e) =>
                                  setPayMethodById((prev) => ({
                                    ...prev,
                                    [inv.id]: e.target.value as
                                      | "Card"
                                      | "UPI"
                                      | "Bank Transfer",
                                  }))
                                }
                                className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
                              >
                                <option value="UPI">UPI</option>
                                <option value="Card">Debit / Credit Card</option>
                                <option value="Bank Transfer">
                                  Net Banking / Transfer
                                </option>
                              </select>
                              <button
                                type="button"
                                onClick={() =>
                                  mutate(
                                    "/api/patient-portal/payments",
                                    "POST",
                                    {
                                      invoiceId: inv.id,
                                      amount: inv.outstandingBalance,
                                      paymentMethod:
                                        payMethodById[inv.id] ?? "UPI",
                                    },
                                    `Payment of ${formatMoney(inv.outstandingBalance)} received for ${inv.id}.`
                                  )
                                }
                                className={PRIMARY_BTN_CLASS}
                              >
                                Pay {formatMoney(inv.outstandingBalance)} Now
                              </button>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 10. INSURANCE */}
            {active === "insurance" && (
              <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
                <h2 className="text-lg font-semibold">
                  Insurance Coverage & Claims ({state.insuranceClaims.length})
                </h2>
                <div className="mt-4 space-y-3">
                  {state.insuranceClaims.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                            {c.id}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPortalBadgeClass(c.status)}`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <span className="text-[#6B7A80]">
                          Policy: {c.policyNumber}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold">
                        {c.providerName} • Invoice {c.invoiceId}
                      </p>
                      <p className="mt-0.5 text-[#546369]">
                        Claimed: {formatMoney(c.claimedAmount)} • Approved:{" "}
                        {formatMoney(c.approvedAmount)} • Settled:{" "}
                        {formatMoney(c.settledAmount)}
                      </p>
                    </div>
                  ))}
                  {state.insuranceClaims.length === 0 && (
                    <p className="text-xs text-[#7D8C92]">
                      No insurance claims submitted for your account.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 11. NOTIFICATIONS */}
            {active === "notifications" && (
              <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
                <h2 className="text-lg font-semibold">
                  Notifications & Reminders ({state.notifications.length})
                </h2>
                <div className="mt-4 space-y-2.5">
                  {state.notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex flex-wrap items-center justify-between gap-2 rounded-[20px] border p-4 text-xs ${
                        n.isRead
                          ? "border-white/80 bg-[#F8FAFA] opacity-75"
                          : "border-[#8FC1CE] bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#EDF2F3] px-2.5 py-0.5 text-[10px] font-semibold text-[#47565C]">
                            {n.category}
                          </span>
                          <span className="font-bold text-[#14191B]">
                            {n.title}
                          </span>
                        </div>
                        <p className="mt-1 text-[#546369]">{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-[#7D8C92]">
                          {formatDateTime(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() =>
                            mutate(
                              "/api/patient-portal/notifications",
                              "PATCH",
                              { notificationId: n.id },
                              "Notification marked as read."
                            )
                          }
                          className={SECONDARY_BTN_CLASS}
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 12. SUPPORT */}
            {active === "support" && (
              <div className="space-y-5">
                <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 text-xs">
                  <h2 className="text-lg font-semibold text-[#14191B]">
                    Healix Hospital Patient Helpdesk
                  </h2>
                  <p className="mt-1 text-[#546369]">
                    24×7 Emergency Helpline: <strong>+91-1800-108-4325</strong>{" "}
                    • Front Desk: <strong>+91-20-6610-4000</strong> • Email:{" "}
                    <strong>care@healixhospital.org</strong>
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    mutate(
                      "/api/patient-portal/support",
                      "POST",
                      {
                        subject: supSubject,
                        category: supCategory,
                        message: supMessage,
                      },
                      "Support request submitted. Our team will respond shortly."
                    ).then((ok) => {
                      if (ok) {
                        setSupSubject("");
                        setSupMessage("");
                      }
                    });
                  }}
                  className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5"
                >
                  <h3 className="text-base font-semibold">
                    Submit a Support Query
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      required
                      value={supSubject}
                      onChange={(e) => setSupSubject(e.target.value)}
                      placeholder="Subject *"
                      className={INPUT_CLASS}
                    />
                    <select
                      value={supCategory}
                      onChange={(e) => setSupCategory(e.target.value)}
                      className={INPUT_CLASS}
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Appointments">Appointments</option>
                      <option value="Lab Reports">Lab Reports</option>
                      <option value="Billing & Insurance">
                        Billing & Insurance
                      </option>
                      <option value="Medical Records">Medical Records</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={supMessage}
                    onChange={(e) => setSupMessage(e.target.value)}
                    placeholder="Describe your question or request..."
                    className={`${INPUT_CLASS} mt-3`}
                  />
                  <button type="submit" className={`${PRIMARY_BTN_CLASS} mt-3`}>
                    Submit Support Ticket
                  </button>
                </form>

                <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
                  <h3 className="text-base font-semibold">
                    My Support Tickets ({state.supportTickets.length})
                  </h3>
                  <div className="mt-3 space-y-2.5 text-xs">
                    {state.supportTickets.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold">
                            {t.id} • {t.subject}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getPortalBadgeClass(t.status)}`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <p className="mt-1 text-[#546369]">{t.message}</p>
                        {t.staffResponse && (
                          <p className="mt-2 rounded-[12px] bg-[#E4F4F0] px-3 py-2 text-[#1F6355]">
                            <strong>Hospital Response:</strong>{" "}
                            {t.staffResponse}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
