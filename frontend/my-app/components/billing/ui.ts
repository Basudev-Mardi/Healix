import type {
  BillingInvoice,
  BillingPayment,
  BillingRefund,
} from "@/lib/billing/types";

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

export function getBillingBadgeClass(status: string): string {
  switch (status) {
    case "Paid":
    case "Settled":
    case "Approved":
    case "Active":
      return "bg-[#6AB4A4] text-white";
    case "Partially Paid":
    case "Submitted":
    case "Under Review":
    case "Advance":
      return "bg-[#8FC1CE] text-white";
    case "Unpaid":
    case "Pending":
    case "Pre-Auth Requested":
    case "Partial":
      return "bg-[#EB9B52] text-white";
    case "Overdue":
    case "Cancelled":
    case "Rejected":
    case "Refunded":
      return "bg-[#EF5B3A] text-white";
    default:
      return "bg-[#DDE5E7] text-[#3B484D]";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function printInvoicePdf(
  invoice: BillingInvoice,
  payments: BillingPayment[]
) {
  const rows = invoice.items
    .map(
      (it) => `<tr>
        <td>${escapeHtml(it.code || "—")}</td>
        <td>${escapeHtml(it.description)}</td>
        <td style="text-align:right;">${it.quantity}</td>
        <td style="text-align:right;">${formatMoney(it.unitPrice)}</td>
        <td style="text-align:right;"><strong>${formatMoney(it.lineTotal)}</strong></td>
      </tr>`
    )
    .join("");

  const payRows =
    payments.length > 0
      ? payments
          .map(
            (p) => `<tr>
              <td>${escapeHtml(p.id)}</td>
              <td>${escapeHtml(p.paymentType)} (${escapeHtml(p.paymentMethod)})</td>
              <td>${escapeHtml(p.referenceNumber || "—")}</td>
              <td>${escapeHtml(formatDateTime(p.paidAt))}</td>
              <td style="text-align:right;"><strong>${formatMoney(p.amount)}</strong></td>
            </tr>`
          )
          .join("")
      : `<tr><td colspan="5" style="text-align:center;color:#6b7a80;">No payments recorded yet</td></tr>`;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(invoice.id)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #14191b; padding: 32px; max-width: 860px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #181c1e; padding-bottom: 14px; margin-bottom: 18px; }
    .brand { font-size: 20px; font-weight: 700; }
    .sub { font-size: 12px; color: #546369; margin-top: 2px; }
    .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; background: #f4f7f8; border: 1px solid #dce4e7; border-radius: 12px; padding: 14px; font-size: 12px; margin-bottom: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 18px; }
    th, td { border-bottom: 1px solid #dce4e7; padding: 9px 8px; text-align: left; }
    th { background: #edf2f3; font-size: 11px; text-transform: uppercase; color: #47565c; }
    .totals { margin-left: auto; width: 320px; font-size: 12px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { border-top: 2px solid #181c1e; margin-top: 6px; padding-top: 8px; font-size: 14px; font-weight: 700; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Healix Hospital — Tax Invoice</div>
      <div class="sub">${escapeHtml(invoice.category)} Billing • Official Statement of Account</div>
    </div>
    <div style="text-align:right;font-size:12px;">
      <div><strong>Invoice:</strong> ${escapeHtml(invoice.id)}</div>
      <div><strong>Bill No:</strong> ${escapeHtml(invoice.billNumber)}</div>
      <div><strong>Status:</strong> ${escapeHtml(invoice.status)}</div>
    </div>
  </div>
  <div class="meta">
    <div><strong>Patient:</strong> ${escapeHtml(invoice.patientName)} (${escapeHtml(invoice.patientId)})</div>
    <div><strong>Source Reference:</strong> ${escapeHtml(invoice.sourceReferenceId || "Direct")}</div>
    <div><strong>Invoice Date:</strong> ${escapeHtml(formatDateTime(invoice.createdAt))}</div>
    <div><strong>Due Date:</strong> ${escapeHtml(invoice.dueDate || "Upon Receipt")}</div>
  </div>
  <table>
    <thead><tr><th>Code</th><th>Description</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${formatMoney(invoice.subtotal)}</span></div>
    <div><span>Discount (${invoice.discountPercent}%)</span><span>-${formatMoney(invoice.discountAmount)}</span></div>
    <div><span>Tax (${invoice.taxPercent}%)</span><span>${formatMoney(invoice.taxAmount)}</span></div>
    <div class="grand"><span>Total Payable</span><span>${formatMoney(invoice.totalAmount)}</span></div>
    <div><span>Paid Amount</span><span>${formatMoney(invoice.paidAmount)}</span></div>
    ${invoice.refundedAmount > 0 ? `<div><span>Refunded</span><span>-${formatMoney(invoice.refundedAmount)}</span></div>` : ""}
    <div><span><strong>Outstanding Balance</strong></span><span><strong>${formatMoney(invoice.outstandingBalance)}</strong></span></div>
  </div>
  <h4 style="font-size:12px;text-transform:uppercase;color:#47565c;margin-top:22px;">Payment History</h4>
  <table>
    <thead><tr><th>Receipt</th><th>Type / Method</th><th>Reference</th><th>Date</th><th style="text-align:right;">Amount</th></tr></thead>
    <tbody>${payRows}</tbody>
  </table>
</body>
</html>`;

  const win = window.open("", "_blank", "width=920,height=780");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
}

export function printRefundReceiptPdf(refund: BillingRefund) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Refund Receipt ${escapeHtml(refund.id)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #14191b; padding: 32px; max-width: 720px; margin: 0 auto; }
    .box { border: 2px solid #181c1e; border-radius: 16px; padding: 24px; }
    .title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 20px; margin: 18px 0; font-size: 13px; }
    .amt { background: #f4f7f8; border-radius: 12px; padding: 14px; font-size: 18px; font-weight: 700; text-align: center; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="box">
    <div class="title">Healix Hospital — Official Refund Receipt</div>
    <div style="font-size:12px;color:#546369;">Receipt ID: ${escapeHtml(refund.id)} • ${escapeHtml(formatDateTime(refund.refundedAt))}</div>
    <div class="amt">${escapeHtml(refund.refundType)} Refund Issued: ${formatMoney(refund.amount)}</div>
    <div class="grid">
      <div><strong>Patient:</strong> ${escapeHtml(refund.patientName)} (${escapeHtml(refund.patientId)})</div>
      <div><strong>Invoice ID:</strong> ${escapeHtml(refund.invoiceId)}</div>
      <div><strong>Refund Method:</strong> ${escapeHtml(refund.refundMethod)}</div>
      <div><strong>Authorized By:</strong> ${escapeHtml(refund.authorizedBy)}</div>
      <div style="grid-column:span 2;"><strong>Reason:</strong> ${escapeHtml(refund.reason)}</div>
    </div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=640");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
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
