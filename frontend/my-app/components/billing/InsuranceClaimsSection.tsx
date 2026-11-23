"use client";

import React, { useState } from "react";
import type {
  BillingInvoice,
  InsuranceClaim,
  InsuranceProvider,
} from "@/lib/billing/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  formatMoney,
  getBillingBadgeClass,
} from "./ui";

interface InsuranceClaimsSectionProps {
  providers: InsuranceProvider[];
  invoices: BillingInvoice[];
  claims: InsuranceClaim[];
  canManage: boolean;
  onCreateProvider: (payload: {
    name: string;
    tpaCode: string;
    contactPhone: string;
    contactEmail: string;
    coverageNotes: string;
  }) => Promise<boolean>;
  onCreateClaim: (payload: {
    invoiceId: string;
    providerId: string;
    policyNumber: string;
    coverageVerified: boolean;
    preAuthNumber: string;
    claimedAmount: number;
  }) => Promise<boolean>;
  onUpdateClaim: (payload: {
    claimId: string;
    status: "Submitted" | "Under Review" | "Approved" | "Rejected" | "Settled";
    approvedAmount?: number;
    settledAmount?: number;
    rejectionReason?: string;
  }) => Promise<void>;
}

export function InsuranceClaimsSection({
  providers,
  invoices,
  claims,
  canManage,
  onCreateProvider,
  onCreateClaim,
  onUpdateClaim,
}: InsuranceClaimsSectionProps) {
  const claimableInvoices = invoices.filter(
    (i) => i.status !== "Cancelled" && i.status !== "Refunded"
  );

  const [invoiceId, setInvoiceId] = useState(claimableInvoices[0]?.id ?? "");
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [policyNumber, setPolicyNumber] = useState("");
  const [preAuthNumber, setPreAuthNumber] = useState("");
  const [coverageVerified, setCoverageVerified] = useState(true);
  const [claimedAmount, setClaimedAmount] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const [provName, setProvName] = useState("");
  const [tpaCode, setTpaCode] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submittingProv, setSubmittingProv] = useState(false);

  const [rejectNoteById, setRejectNoteById] = useState<Record<string, string>>(
    {}
  );

  const activeInv = claimableInvoices.find(
    (i) => i.id === (invoiceId || claimableInvoices[0]?.id)
  );

  async function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeInv) return;
    setSubmittingClaim(true);
    try {
      const ok = await onCreateClaim({
        invoiceId: activeInv.id,
        providerId: providerId || providers[0]?.id || "",
        policyNumber,
        coverageVerified,
        preAuthNumber,
        claimedAmount:
          Number(claimedAmount) ||
          activeInv.outstandingBalance ||
          activeInv.totalAmount,
      });
      if (ok) {
        setPolicyNumber("");
        setPreAuthNumber("");
        setClaimedAmount("");
      }
    } finally {
      setSubmittingClaim(false);
    }
  }

  async function handleProviderSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingProv(true);
    try {
      const ok = await onCreateProvider({
        name: provName,
        tpaCode,
        contactPhone,
        contactEmail: "",
        coverageNotes: "Cashless & reimbursement supported",
      });
      if (ok) {
        setProvName("");
        setTpaCode("");
        setContactPhone("");
      }
    } finally {
      setSubmittingProv(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Submit Claim + Register Provider */}
      <div className="space-y-4 lg:col-span-5">
        <form
          onSubmit={handleClaimSubmit}
          className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5"
        >
          <h2 className="text-lg font-semibold text-[#14191B]">
            Submit Insurance Claim / Pre-Auth
          </h2>
          <p className="mt-0.5 text-xs text-[#6B7A80]">
            Verify coverage, attach pre-authorization, and track through
            approval and atomic settlement onto the invoice.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className={LABEL_CLASS}>Linked Invoice *</label>
              <select
                value={invoiceId || claimableInvoices[0]?.id || ""}
                onChange={(e) => setInvoiceId(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canManage}
              >
                {claimableInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} — {inv.patientName} ({inv.category},{" "}
                    {formatMoney(inv.totalAmount)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Insurance Provider / TPA *</label>
              <select
                value={providerId || providers[0]?.id || ""}
                onChange={(e) => setProviderId(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canManage}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.tpaCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Policy Number *</label>
                <input
                  type="text"
                  required
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  placeholder="e.g. POL-2026-4410"
                  className={INPUT_CLASS}
                  disabled={!canManage}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Pre-Auth Number</label>
                <input
                  type="text"
                  value={preAuthNumber}
                  onChange={(e) => setPreAuthNumber(e.target.value)}
                  placeholder="Optional PA #"
                  className={INPUT_CLASS}
                  disabled={!canManage}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Claimed Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={claimedAmount}
                onChange={(e) => setClaimedAmount(e.target.value)}
                placeholder={String(
                  activeInv?.outstandingBalance || activeInv?.totalAmount || ""
                )}
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-[#47565C]">
              <input
                type="checkbox"
                checked={coverageVerified}
                onChange={(e) => setCoverageVerified(e.target.checked)}
                disabled={!canManage}
              />
              Patient insurance coverage verified with TPA
            </label>

            <button
              type="submit"
              disabled={!canManage || submittingClaim || !activeInv}
              className={`${PRIMARY_BTN_CLASS} w-full`}
            >
              {submittingClaim ? "Submitting Claim..." : "Submit Insurance Claim"}
            </button>
          </div>
        </form>

        <form
          onSubmit={handleProviderSubmit}
          className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5"
        >
          <h3 className="text-base font-semibold text-[#14191B]">
            Add Insurance Provider ({providers.length})
          </h3>
          <div className="mt-3 space-y-2.5">
            <input
              type="text"
              required
              value={provName}
              onChange={(e) => setProvName(e.target.value)}
              placeholder="Provider / TPA Name"
              className={INPUT_CLASS}
              disabled={!canManage}
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                value={tpaCode}
                onChange={(e) => setTpaCode(e.target.value)}
                placeholder="TPA Code"
                className={INPUT_CLASS}
                disabled={!canManage}
              />
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Support Phone"
                className={INPUT_CLASS}
                disabled={!canManage}
              />
            </div>
            <button
              type="submit"
              disabled={!canManage || submittingProv}
              className={`${ACCENT_BTN_CLASS} w-full`}
            >
              {submittingProv ? "Saving..." : "Register Provider"}
            </button>
          </div>
        </form>
      </div>

      {/* Right: Claims Tracking & Settlement */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Insurance Claims Tracker ({claims.length})
        </h3>
        <div className="mt-4 space-y-3">
          {claims.map((clm) => (
            <div
              key={clm.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {clm.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBillingBadgeClass(clm.status)}`}
                  >
                    {clm.status}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                    Invoice {clm.invoiceId}
                  </span>
                </div>
                <span className="text-[11px] text-[#6B7A80]">
                  Policy: {clm.policyNumber}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {clm.patientName} ({clm.patientId}) • {clm.providerName}
              </p>

              <div className="mt-2 grid grid-cols-3 gap-2 rounded-[14px] bg-white p-2.5">
                <div>
                  <p className="text-[10px] text-[#7D8C92]">Claimed</p>
                  <p className="font-bold text-[#14191B]">
                    {formatMoney(clm.claimedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#7D8C92]">Approved</p>
                  <p className="font-bold text-[#4A90A4]">
                    {formatMoney(clm.approvedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#7D8C92]">Settled</p>
                  <p className="font-bold text-[#1F6355]">
                    {formatMoney(clm.settledAmount)}
                  </p>
                </div>
              </div>

              {clm.rejectionReason && (
                <p className="mt-2 rounded-[12px] bg-[#FCEBE7] px-3 py-1.5 font-medium text-[#B8381B]">
                  Rejection Reason: {clm.rejectionReason}
                </p>
              )}

              {canManage &&
                clm.status !== "Settled" &&
                clm.status !== "Rejected" && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#E6EDEF] pt-3">
                    {clm.status !== "Approved" && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateClaim({
                            claimId: clm.id,
                            status: "Approved",
                            approvedAmount: clm.claimedAmount,
                          })
                        }
                        className={ACCENT_BTN_CLASS}
                      >
                        Approve Claim
                      </button>
                    )}
                    {clm.status === "Approved" && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateClaim({
                            claimId: clm.id,
                            status: "Settled",
                            settledAmount:
                              clm.approvedAmount || clm.claimedAmount,
                          })
                        }
                        className={PRIMARY_BTN_CLASS}
                      >
                        Settle & Apply to Invoice
                      </button>
                    )}
                    <input
                      type="text"
                      value={rejectNoteById[clm.id] ?? ""}
                      onChange={(e) =>
                        setRejectNoteById((prev) => ({
                          ...prev,
                          [clm.id]: e.target.value,
                        }))
                      }
                      placeholder="Rejection reason..."
                      className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateClaim({
                          claimId: clm.id,
                          status: "Rejected",
                          rejectionReason:
                            rejectNoteById[clm.id] ||
                            "Policy exclusion / insufficient documentation",
                        })
                      }
                      className={DANGER_BTN_CLASS}
                    >
                      Reject
                    </button>
                  </div>
                )}

              {clm.history.length > 0 && (
                <div className="mt-2.5 space-y-1 border-t border-[#E6EDEF] pt-2 text-[11px] text-[#7D8C92]">
                  {clm.history.map((h, idx) => (
                    <p key={`${clm.id}-h-${idx}`}>
                      <strong>{h.status}</strong> ({formatDateTime(h.timestamp)}
                      ) — {h.staff}: {h.note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
