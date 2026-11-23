export type OtRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "OT Manager"
  | "Doctor"
  | "Nurse"
  | "ICU Staff"
  | "Ward Manager"
  | "Housekeeping Supervisors";

export type OtAction =
  | "ot:read"
  | "ot:schedule"
  | "ot:theatre:status"
  | "ot:assign"
  | "ot:checklist"
  | "ot:surgical:write"
  | "ot:anesthesia:write"
  | "ot:postop:write";

export const OT_ROLES: OtRole[] = [
  "Super Admin",
  "Hospital Administrator",
  "OT Manager",
  "Doctor",
  "Nurse",
  "ICU Staff",
  "Ward Manager",
  "Housekeeping Supervisors",
];

const ALL_ACTIONS: OtAction[] = [
  "ot:read",
  "ot:schedule",
  "ot:theatre:status",
  "ot:assign",
  "ot:checklist",
  "ot:surgical:write",
  "ot:anesthesia:write",
  "ot:postop:write",
];

const ROLE_PERMISSIONS: Record<OtRole, Set<OtAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  "OT Manager": new Set(ALL_ACTIONS),
  Doctor: new Set([
    "ot:read",
    "ot:schedule",
    "ot:assign",
    "ot:checklist",
    "ot:surgical:write",
    "ot:anesthesia:write",
    "ot:postop:write",
  ]),
  Nurse: new Set(["ot:read", "ot:checklist", "ot:postop:write"]),
  "ICU Staff": new Set(["ot:read", "ot:postop:write"]),
  "Ward Manager": new Set(["ot:read"]),
  "Housekeeping Supervisors": new Set(["ot:read", "ot:theatre:status"]),
};

export function resolveOtRole(raw: string | undefined): OtRole {
  if (raw && (OT_ROLES as string[]).includes(raw)) {
    return raw as OtRole;
  }
  return "OT Manager";
}

export function hasOtPermission(role: OtRole, action: OtAction): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
