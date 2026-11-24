"use client";

import React, { useState } from "react";
import { apiUrl } from "@/lib/api";
import { INPUT_CLASS, LABEL_CLASS, PRIMARY_BTN_CLASS } from "./ui";

interface PatientAuthViewProps {
  onAuthenticated: (session: {
    token: string;
    patientId: string;
    fullName: string;
  }) => void;
}

export function PatientAuthView({ onAuthenticated }: PatientAuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("PAT-2026-0001");
  const [password, setPassword] = useState("patient123");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("1995-01-15");
  const [gender, setGender] = useState("Female");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [regPassword, setRegPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/patient-portal/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign in failed.");
      onAuthenticated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/patient-portal/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password: regPassword,
          dateOfBirth,
          gender,
          bloodGroup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      onAuthenticated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E2E9EB] px-4 py-10 text-[#14191B]">
      <div className="w-full max-w-md rounded-[32px] border border-white/85 bg-[#EDF2F3] p-7 shadow-sm">
        <div className="text-center">
          <span className="inline-block rounded-full bg-[#181C1E] px-3.5 py-1 text-[11px] font-semibold text-white">
            Healix Health • Patient Portal
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#14191B]">
            {mode === "login" ? "Patient Sign In" : "Create Patient Account"}
          </h1>
          <p className="mt-1 text-xs text-[#6B7A80]">
            Secure personal access to your appointments, live tokens, reports,
            prescriptions, admissions, and bills.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-full bg-white p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`rounded-full py-2 text-xs font-semibold transition ${
              mode === "login"
                ? "bg-[#181C1E] text-white"
                : "text-[#546369] hover:text-[#14191B]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`rounded-full py-2 text-xs font-semibold transition ${
              mode === "register"
                ? "bg-[#181C1E] text-white"
                : "text-[#546369] hover:text-[#14191B]"
            }`}
          >
            New Patient
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-[16px] bg-[#FCEBE7] px-3.5 py-2.5 text-xs font-semibold text-[#B8381B]">
            {error}
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
            <div>
              <label className={LABEL_CLASS}>Patient ID or Email *</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. PAT-2026-0001"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className={`${PRIMARY_BTN_CLASS} w-full`}
            >
              {busy ? "Signing In..." : "Access My Health Portal"}
            </button>

            <div className="rounded-[18px] border border-white/90 bg-[#F8FAFA] p-3 text-[11px] text-[#546369]">
              <p className="font-semibold text-[#14191B]">
                Registered Patient Accounts (Password: <code>patient123</code>):
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[
                  { id: "PAT-2026-0001", label: "Ananya Sharma" },
                  { id: "PAT-2026-0002", label: "Vikram Rao" },
                  { id: "PAT-2026-0003", label: "Meera Patel" },
                ].map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => {
                      setIdentifier(demo.id);
                      setPassword("patient123");
                    }}
                    className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#4A90A4] shadow-xs hover:bg-[#EDF2F3]"
                  >
                    {demo.id} ({demo.label})
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-5 space-y-3">
            <div>
              <label className={LABEL_CLASS}>Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Phone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={LABEL_CLASS}>DOB</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Blood</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(
                    (bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Password (min 6 chars) *</label>
              <input
                type="password"
                minLength={6}
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className={`${PRIMARY_BTN_CLASS} w-full`}
            >
              {busy ? "Creating Account..." : "Register & Sign In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
