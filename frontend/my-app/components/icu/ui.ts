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

export function getIcuBadgeClass(status: string): string {
  switch (status) {
    case "Stable":
    case "Administered":
    case "Approved":
    case "Completed":
    case "Discharged":
    case "Transferred":
    case "Extubated / Off":
    case "Step-Down Ready":
      return "bg-[#6AB4A4] text-white";
    case "Active":
    case "Stabilizing":
    case "Continuous Telemetry":
    case "Weaning / SBT":
    case "Weaning Observation":
      return "bg-[#8FC1CE] text-white";
    case "Guarded":
    case "Pending":
    case "Requested":
    case "Transfer Requested":
    case "Discharge Requested":
    case "1:1 Nursing":
    case "Withheld":
      return "bg-[#EB9B52] text-white";
    case "Critical":
    case "Unstable":
    case "Abnormal":
    case "Missed":
    case "Cancelled":
      return "bg-[#EF5B3A] text-white";
    default:
      return "bg-[#DDE5E7] text-[#3B484D]";
  }
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
