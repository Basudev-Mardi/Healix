export function formatTimeShort(iso: string): string {
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

export function getNowLocalInput(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function getEmergencyBadgeClass(label: string): string {
  switch (label) {
    case "Level 1 - Resuscitation":
    case "Critical":
    case "Unresolved":
    case "Cancelled":
    case "Deceased":
      return "bg-[#EF5B3A] text-white";
    case "Level 2 - Emergent":
    case "High":
    case "Severe":
    case "Under Treatment":
    case "Active Resuscitation":
    case "Ongoing":
    case "Requested":
    case "In Transit":
    case "Acknowledged":
      return "bg-[#EB9B52] text-white";
    case "Level 3 - Urgent":
    case "Moderate":
    case "Waiting":
    case "Approved":
    case "In Surgery":
    case "Post-Op Monitoring":
    case "Admitted / Transferred":
    case "Transferred":
      return "bg-[#8FC1CE] text-white";
    case "Level 4 - Less Urgent":
    case "Level 5 - Non-Urgent":
    case "Minor":
    case "Stabilized":
    case "Completed":
    case "Discharged":
    case "Resolved":
      return "bg-[#6AB4A4] text-white";
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
