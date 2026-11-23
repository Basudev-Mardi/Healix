import type { AmbulanceRole } from "./types";

export type AmbulanceAction =
  | "ambulance:read"
  | "ambulance:vehicle:manage"
  | "ambulance:driver:manage"
  | "ambulance:request:create"
  | "ambulance:dispatch:manage"
  | "ambulance:trip:update";

export const AMBULANCE_ROLES: AmbulanceRole[] = [
  "Super Admin",
  "Hospital Administrator",
  "Ambulance Coordinator",
  "Driver",
  "Emergency Staff",
  "Doctor",
];

const ALL_ACTIONS: AmbulanceAction[] = [
  "ambulance:read",
  "ambulance:vehicle:manage",
  "ambulance:driver:manage",
  "ambulance:request:create",
  "ambulance:dispatch:manage",
  "ambulance:trip:update",
];

const ROLE_PERMISSIONS: Record<AmbulanceRole, Set<AmbulanceAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  "Ambulance Coordinator": new Set(ALL_ACTIONS),
  Driver: new Set(["ambulance:read", "ambulance:trip:update"]),
  "Emergency Staff": new Set([
    "ambulance:read",
    "ambulance:request:create",
    "ambulance:dispatch:manage",
  ]),
  Doctor: new Set(["ambulance:read", "ambulance:request:create"]),
};

export function hasAmbulancePermission(
  role: AmbulanceRole,
  action: AmbulanceAction
): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
