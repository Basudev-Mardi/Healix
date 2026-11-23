export type OpdRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Receptionist"
  | "Doctor"
  | "Nurse"
  | "Patient";

export type OpdAction =
  | "patient:read"
  | "patient:write"
  | "appointment:read"
  | "appointment:write"
  | "walkin:write"
  | "token:read"
  | "token:write"
  | "queue:read"
  | "queue:manage"
  | "consultation:read"
  | "consultation:write"
  | "followup:read"
  | "followup:write"
  | "history:read";

export const OPD_ROLES: OpdRole[] = [
  "Super Admin",
  "Hospital Administrator",
  "Receptionist",
  "Doctor",
  "Nurse",
  "Patient",
];

const ALL_ACTIONS: OpdAction[] = [
  "patient:read",
  "patient:write",
  "appointment:read",
  "appointment:write",
  "walkin:write",
  "token:read",
  "token:write",
  "queue:read",
  "queue:manage",
  "consultation:read",
  "consultation:write",
  "followup:read",
  "followup:write",
  "history:read",
];

const ROLE_PERMISSIONS: Record<OpdRole, Set<OpdAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  Receptionist: new Set([
    "patient:read",
    "patient:write",
    "appointment:read",
    "appointment:write",
    "walkin:write",
    "token:read",
    "token:write",
    "queue:read",
    "queue:manage",
    "followup:read",
    "followup:write",
  ]),
  Doctor: new Set([
    "patient:read",
    "appointment:read",
    "token:read",
    "queue:read",
    "queue:manage",
    "consultation:read",
    "consultation:write",
    "followup:read",
    "followup:write",
    "history:read",
  ]),
  Nurse: new Set([
    "patient:read",
    "patient:write",
    "appointment:read",
    "walkin:write",
    "token:read",
    "token:write",
    "queue:read",
    "queue:manage",
    "consultation:read",
    "followup:read",
    "history:read",
  ]),
  Patient: new Set([
    "patient:read",
    "appointment:read",
    "token:read",
    "queue:read",
    "followup:read",
    "history:read",
  ]),
};

export function resolveOpdRole(raw: string | undefined): OpdRole {
  if (raw && (OPD_ROLES as string[]).includes(raw)) {
    return raw as OpdRole;
  }
  return "Receptionist";
}

export function hasOpdPermission(role: OpdRole, action: OpdAction): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
