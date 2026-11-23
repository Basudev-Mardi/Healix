export type EmergencyRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Emergency Staff"
  | "Doctor"
  | "Nurse"
  | "ICU Staff"
  | "Ward Manager"
  | "OT Manager"
  | "Ambulance Operators";

export type EmergencyAction =
  | "emergency:read"
  | "registration:write"
  | "triage:write"
  | "queue:manage"
  | "trauma:write"
  | "treatment:write"
  | "alert:write"
  | "alert:acknowledge"
  | "transfer:request"
  | "transfer:approve";

export const EMERGENCY_ROLES: EmergencyRole[] = [
  "Super Admin",
  "Hospital Administrator",
  "Emergency Staff",
  "Doctor",
  "Nurse",
  "ICU Staff",
  "Ward Manager",
  "OT Manager",
  "Ambulance Operators",
];

const ALL_ACTIONS: EmergencyAction[] = [
  "emergency:read",
  "registration:write",
  "triage:write",
  "queue:manage",
  "trauma:write",
  "treatment:write",
  "alert:write",
  "alert:acknowledge",
  "transfer:request",
  "transfer:approve",
];

const ROLE_PERMISSIONS: Record<EmergencyRole, Set<EmergencyAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  "Emergency Staff": new Set(ALL_ACTIONS),
  Doctor: new Set([
    "emergency:read",
    "triage:write",
    "queue:manage",
    "trauma:write",
    "treatment:write",
    "alert:write",
    "alert:acknowledge",
    "transfer:request",
    "transfer:approve",
  ]),
  Nurse: new Set([
    "emergency:read",
    "registration:write",
    "triage:write",
    "queue:manage",
    "trauma:write",
    "treatment:write",
    "alert:write",
    "alert:acknowledge",
    "transfer:request",
  ]),
  "ICU Staff": new Set([
    "emergency:read",
    "alert:acknowledge",
    "transfer:approve",
  ]),
  "Ward Manager": new Set(["emergency:read", "transfer:approve"]),
  "OT Manager": new Set([
    "emergency:read",
    "alert:acknowledge",
    "transfer:approve",
  ]),
  "Ambulance Operators": new Set([
    "emergency:read",
    "registration:write",
    "alert:write",
  ]),
};

export function resolveEmergencyRole(raw: string | undefined): EmergencyRole {
  if (raw && (EMERGENCY_ROLES as string[]).includes(raw)) {
    return raw as EmergencyRole;
  }
  return "Emergency Staff";
}

export function hasEmergencyPermission(
  role: EmergencyRole,
  action: EmergencyAction
): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
