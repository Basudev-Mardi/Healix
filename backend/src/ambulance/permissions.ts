export type AmbulanceRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Ambulance Coordinator"
  | "Driver"
  | "Emergency Staff"
  | "Doctor";

export type AmbulanceAction =
  | "ambulance:read"
  | "ambulance:vehicle:manage"
  | "ambulance:driver:manage"
  | "ambulance:request:create"
  | "ambulance:dispatch:manage"
  | "ambulance:trip:update";

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

const VALID_ROLES = new Set<AmbulanceRole>(
  Object.keys(ROLE_PERMISSIONS) as AmbulanceRole[]
);

export function resolveAmbulanceRole(
  headerValue: string | undefined
): AmbulanceRole {
  if (headerValue && VALID_ROLES.has(headerValue as AmbulanceRole)) {
    return headerValue as AmbulanceRole;
  }
  return "Ambulance Coordinator";
}

export function hasAmbulancePermission(
  role: AmbulanceRole,
  action: AmbulanceAction
): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
