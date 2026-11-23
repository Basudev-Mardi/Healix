import type { WardBedRole } from "./types";

export type WardBedAction =
  | "ward:read"
  | "ward:configure"
  | "bed:status"
  | "bed:allocate"
  | "bed:transfer"
  | "cleaning:manage"
  | "isolation:manage";

export const WARD_BED_ROLES: WardBedRole[] = [
  "Super Admin",
  "Hospital Administrator",
  "Ward Manager",
  "Doctor",
  "Nurse",
  "Housekeeping Supervisors",
  "Infection Control Officer",
];

const ALL_ACTIONS: WardBedAction[] = [
  "ward:read",
  "ward:configure",
  "bed:status",
  "bed:allocate",
  "bed:transfer",
  "cleaning:manage",
  "isolation:manage",
];

const ROLE_PERMISSIONS: Record<WardBedRole, Set<WardBedAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  "Ward Manager": new Set(ALL_ACTIONS),
  Doctor: new Set([
    "ward:read",
    "bed:allocate",
    "bed:transfer",
    "isolation:manage",
  ]),
  Nurse: new Set([
    "ward:read",
    "bed:status",
    "bed:transfer",
    "cleaning:manage",
  ]),
  "Housekeeping Supervisors": new Set(["ward:read", "cleaning:manage"]),
  "Infection Control Officer": new Set([
    "ward:read",
    "cleaning:manage",
    "isolation:manage",
  ]),
};

export function hasWardBedPermission(
  role: WardBedRole,
  action: WardBedAction
): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
