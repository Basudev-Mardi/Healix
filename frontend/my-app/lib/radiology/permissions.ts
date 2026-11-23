import type { RadiologyRole } from "./types";

export type RadiologyAction =
  | "radiology:read"
  | "radiology:request:create"
  | "radiology:exam:manage"
  | "radiology:appointment:manage"
  | "radiology:image:upload"
  | "radiology:report:write"
  | "radiology:report:finalize";

export const RADIOLOGY_ROLES: RadiologyRole[] = [
  "Super Admin",
  "Hospital Administrator",
  "Radiologist",
  "Radiology Technician",
  "Doctor",
  "Nurse",
  "Patient",
];

const ALL_ACTIONS: RadiologyAction[] = [
  "radiology:read",
  "radiology:request:create",
  "radiology:exam:manage",
  "radiology:appointment:manage",
  "radiology:image:upload",
  "radiology:report:write",
  "radiology:report:finalize",
];

const ROLE_PERMISSIONS: Record<RadiologyRole, Set<RadiologyAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  Radiologist: new Set([
    "radiology:read",
    "radiology:request:create",
    "radiology:exam:manage",
    "radiology:image:upload",
    "radiology:report:write",
    "radiology:report:finalize",
  ]),
  "Radiology Technician": new Set([
    "radiology:read",
    "radiology:request:create",
    "radiology:exam:manage",
    "radiology:appointment:manage",
    "radiology:image:upload",
  ]),
  Doctor: new Set(["radiology:read", "radiology:request:create"]),
  Nurse: new Set(["radiology:read", "radiology:appointment:manage"]),
  Patient: new Set(["radiology:read"]),
};

export function hasRadiologyPermission(
  role: RadiologyRole,
  action: RadiologyAction
): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
