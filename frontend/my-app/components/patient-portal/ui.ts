import type {
  PatientProfile,
  PortalInvoice,
  PortalPrescription,
} from "@/lib/patient-portal/types";

export function formatMoney(n: number): string {
  return `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateTime(iso: string): string {
  try {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return iso;
    return dt.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function getPortalBadgeClass(status: string): string {
  switch (status) {
    case "Scheduled":
    case "Confirmed":
    case "Completed":
    case "Paid":
    case "Verified":
    case "Approved":
    case "Settled":
    case "Resolved":
    case "Discharged":
      return "bg-[#6AB4A4] text-white";
    case "Waiting":
    case "Called":
    case "In Progress":
    case "Partially Paid":
    case "Partially Fulfilled":
    case "Rescheduled":
    case "Admitted":
    case "Submitted":
      return "bg-[#8FC1CE] text-white";
    case "Pending":
    case "Unpaid":
    case "Open":
    case "Skipped":
      return "bg-[#EB9B52] text-white";
    case "Cancelled":
    case "Rejected":
    case "Out of Range":
    case "Overdue":
      return "bg-[#EF5B3A] text-white";
    default:
      return "bg-[#DDE5E7] text-[#3B484D]";
  }
}

function escapeHtml(v: string): string {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function printDocumentHtml(title: string, bodyHtml: string) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #14191b; padding: 32px; max-width: 820px; margin: 0 auto; }
    .hdr { border-bottom: 2px solid #181c1e; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 16px 0; }
    th, td { border-bottom: 1px solid #dce4e7; padding: 8px; text-align: left; }
    th { background: #edf2f3; text-transform: uppercase; font-size: 11px; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;
  const win = window.open("", "_blank", "width=880,height=740");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
}

export function downloadPrescriptionPdf(
  profile: PatientProfile,
  rx: PortalPrescription
) {
  const rows = rx.items
    .map(
      (it) =>
        `<tr><td><strong>${escapeHtml(it.medicineName)}</strong> (${escapeHtml(it.medicineCode)})</td><td>${escapeHtml(it.dosage)}</td><td>${escapeHtml(it.frequency)}</td><td>${escapeHtml(it.duration)}</td><td>${escapeHtml(it.instructions)}</td></tr>`
    )
    .join("");
  printDocumentHtml(
    `Prescription ${rx.id}`,
    `<div class="hdr"><div><div style="font-size:20px;font-weight:700;">Healix Hospital — Digital Prescription</div><div style="font-size:12px;color:#546369;">Prescribing Doctor: ${escapeHtml(rx.doctorName)}</div></div><div style="text-align:right;font-size:12px;"><div><strong>${escapeHtml(rx.id)}</strong></div><div>${escapeHtml(formatDateTime(rx.prescribedAt))}</div></div></div>
    <p style="font-size:13px;"><strong>Patient:</strong> ${escapeHtml(profile.fullName)} (${escapeHtml(profile.id)}) • Blood Group: ${escapeHtml(profile.bloodGroup)}</p>
    <table><thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>${rows}</tbody></table>`
  );
}

export function downloadInvoicePdf(
  profile: PatientProfile,
  inv: PortalInvoice
) {
  const rows = inv.items
    .map(
      (it) =>
        `<tr><td>${escapeHtml(it.description)}</td><td style="text-align:right;">${it.quantity}</td><td style="text-align:right;">${formatMoney(it.unitPrice)}</td><td style="text-align:right;"><strong>${formatMoney(it.lineTotal)}</strong></td></tr>`
    )
    .join("");
  printDocumentHtml(
    `Invoice ${inv.id}`,
    `<div class="hdr"><div><div style="font-size:20px;font-weight:700;">Healix Hospital — Patient Invoice</div><div style="font-size:12px;color:#546369;">${escapeHtml(inv.category)} • ${escapeHtml(inv.billNumber)}</div></div><div style="text-align:right;font-size:12px;"><div><strong>${escapeHtml(inv.id)}</strong></div><div>Status: ${escapeHtml(inv.status)}</div></div></div>
    <p style="font-size:13px;"><strong>Patient:</strong> ${escapeHtml(profile.fullName)} (${escapeHtml(profile.id)})</p>
    <table><thead><tr><th>Charge</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Unit</th><th style="text-align:right;">Total</th></tr></thead><tbody>${rows}</tbody></table>
    <div style="text-align:right;font-size:13px;">
      <div>Subtotal: ${formatMoney(inv.subtotal)} • Discount: -${formatMoney(inv.discountAmount)} • Tax: ${formatMoney(inv.taxAmount)}</div>
      <div style="font-size:16px;font-weight:700;margin-top:6px;">Total: ${formatMoney(inv.totalAmount)} | Paid: ${formatMoney(inv.paidAmount)} | Due: ${formatMoney(inv.outstandingBalance)}</div>
    </div>`
  );
}

export const INPUT_CLASS =
  "w-full rounded-[16px] border border-[#DCE4E7] bg-white px-3.5 py-2.5 text-sm text-[#14191B] placeholder:text-[#8E9CA1] focus:border-[#4A90A4] focus:outline-none focus:ring-2 focus:ring-[#8FC1CE]/35 disabled:cursor-not-allowed disabled:bg-[#F2F5F6] disabled:text-[#8A989E]";

export const LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold text-[#47565C]";

export const PRIMARY_BTN_CLASS =
  "inline-flex items-center justify-center rounded-full bg-[#181C1E] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#2C3336] disabled:cursor-not-allowed disabled:opacity-45";

export const SECONDARY_BTN_CLASS =
  "inline-flex items-center justify-center rounded-full border border-[#D4DFE2] bg-white px-4 py-2 text-xs font-semibold text-[#222B2F] transition hover:bg-[#F2F6F7] disabled:cursor-not-allowed disabled:opacity-45";

export const ACCENT_BTN_CLASS =
  "inline-flex items-center justify-center rounded-full bg-[#4A90A4] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3B7B8E] disabled:cursor-not-allowed disabled:opacity-45";

export const DANGER_BTN_CLASS =
  "inline-flex items-center justify-center rounded-full bg-[#EF5B3A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#D94B2B] disabled:cursor-not-allowed disabled:opacity-45";
