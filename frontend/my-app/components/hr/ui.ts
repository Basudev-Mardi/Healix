import type { HrPayroll } from "@/lib/hr/types";

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

export function getHrBadgeClass(status: string): string {
  switch (status) {
    case "Active":
    case "Present":
    case "Approved":
    case "Paid":
    case "Completed":
    case "Scheduled":
      return "bg-[#6AB4A4] text-white";
    case "Processed":
    case "Half Day":
    case "On Leave":
    case "Promotion":
      return "bg-[#8FC1CE] text-white";
    case "Pending":
    case "Late":
    case "Draft":
    case "Transfer":
      return "bg-[#EB9B52] text-white";
    case "Absent":
    case "Rejected":
    case "Suspended":
    case "Terminated":
    case "Cancelled":
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

export function printPayslipPdf(p: HrPayroll) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payslip ${escapeHtml(p.id)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #14191b; padding: 32px; max-width: 780px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #181c1e; padding-bottom: 12px; margin-bottom: 18px; }
    .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 20px; background: #f4f7f8; border: 1px solid #dce4e7; border-radius: 12px; padding: 14px; font-size: 12px; margin-bottom: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 18px; }
    th, td { border-bottom: 1px solid #dce4e7; padding: 9px 8px; text-align: left; }
    th { background: #edf2f3; text-transform: uppercase; font-size: 11px; color: #47565c; }
    .net { background: #181c1e; color: #fff; border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size:20px;font-weight:700;">Healix Hospital — Monthly Payslip</div>
      <div style="font-size:12px;color:#546369;">Pay Period: ${escapeHtml(p.payrollMonth)} • Status: ${escapeHtml(p.status)}</div>
    </div>
    <div style="text-align:right;font-size:12px;">
      <div><strong>Payslip ID:</strong> ${escapeHtml(p.id)}</div>
      <div><strong>Employee ID:</strong> ${escapeHtml(p.employeeId)}</div>
    </div>
  </div>
  <div class="meta">
    <div><strong>Employee:</strong> ${escapeHtml(p.employeeName)}</div>
    <div><strong>Department:</strong> ${escapeHtml(p.department)}</div>
    <div><strong>Job Title:</strong> ${escapeHtml(p.jobTitle)}</div>
    <div><strong>Approved By:</strong> ${escapeHtml(p.approvedBy || "Pending")}</div>
  </div>
  <table>
    <thead><tr><th>Earnings</th><th style="text-align:right;">Amount</th><th>Deductions</th><th style="text-align:right;">Amount</th></tr></thead>
    <tbody>
      <tr><td>Basic Pay</td><td style="text-align:right;">${formatMoney(p.basicPay)}</td><td>Income Tax</td><td style="text-align:right;">${formatMoney(p.taxDeduction)}</td></tr>
      <tr><td>Allowances</td><td style="text-align:right;">${formatMoney(p.allowances)}</td><td>Unpaid Leave</td><td style="text-align:right;">${formatMoney(p.unpaidLeaveDeduction)}</td></tr>
      <tr><td>Overtime (${p.overtimeHours} hrs)</td><td style="text-align:right;">${formatMoney(p.overtimePay)}</td><td>Other Deductions</td><td style="text-align:right;">${formatMoney(p.otherDeductions)}</td></tr>
      <tr><td>Bonus / Incentives</td><td style="text-align:right;">${formatMoney(p.bonus)}</td><td></td><td></td></tr>
      <tr><td><strong>Gross Earnings</strong></td><td style="text-align:right;"><strong>${formatMoney(p.grossPay)}</strong></td><td><strong>Total Deductions</strong></td><td style="text-align:right;"><strong>${formatMoney(p.taxDeduction + p.unpaidLeaveDeduction + p.otherDeductions)}</strong></td></tr>
    </tbody>
  </table>
  <div class="net"><span>Net Salary Payable</span><span>${formatMoney(p.netPay)}</span></div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=840,height=720");
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
