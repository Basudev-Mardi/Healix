import type { LabRole } from "./types";

export type LabAction =
  | "lab:read"
  | "lab:catalog:manage"
  | "lab:request:create"
  | "lab:sample:collect"
  | "lab:sample:track"
  | "lab:process"
  | "lab:verify"
  | "lab:report:generate";

export const LAB_ROLES: LabRole[] = [
  "Super Admin",
  "Hospital Administrator",
  "Laboratory Staff",
  "Doctor",
  "Nurse",
  "Patient",
];

const ALL_ACTIONS: LabAction[] = [
  "lab:read",
  "lab:catalog:manage",
  "lab:request:create",
  "lab:sample:collect",
  "lab:sample:track",
  "lab:process",
  "lab:verify",
  "lab:report:generate",
];

const ROLE_PERMISSIONS: Record<LabRole, Set<LabAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  "Laboratory Staff": new Set(ALL_ACTIONS),
  Doctor: new Set([
    "lab:read",
    "lab:request:create",
    "lab:verify",
    "lab:report:generate",
  ]),
  Nurse: new Set(["lab:read", "lab:sample:collect"]),
  Patient: new Set(["lab:read"]),
};

export function hasLabPermission(role: LabRole, action: LabAction): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
