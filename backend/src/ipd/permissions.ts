export type IpdRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Ward Manager"
  | "Doctor"
  | "Nurse"
  | "Billing Staff"
  | "Pharmacist"
  | "Receptionist";

export type IpdAction =
  | "ipd:read"
  | "admission:write"
  | "request:create"
  | "request:review"
  | "transfer:write"
  | "progress:write"
  | "treatment:write"
  | "discharge:request"
  | "discharge:approve"
  | "summary:write";

export const IPD_ROLES: IpdRole[] = [
  "Super Admin",
  "Hospital Administrator",
  "Ward Manager",
  "Doctor",
  "Nurse",
  "Billing Staff",
  "Pharmacist",
  "Receptionist",
];

const ALL_ACTIONS: IpdAction[] = [
  "ipd:read",
  "admission:write",
  "request:create",
  "request:review",
  "transfer:write",
  "progress:write",
  "treatment:write",
  "discharge:request",
  "discharge:approve",
  "summary:write",
];

const ROLE_PERMISSIONS: Record<IpdRole, Set<IpdAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  "Ward Manager": new Set([
    "ipd:read",
    "admission:write",
    "request:create",
    "request:review",
    "transfer:write",
    "discharge:request",
    "discharge:approve",
  ]),
  Doctor: new Set([
    "ipd:read",
    "admission:write",
    "request:create",
    "request:review",
    "transfer:write",
    "progress:write",
    "treatment:write",
    "discharge:request",
    "discharge:approve",
    "summary:write",
  ]),
  Nurse: new Set([
    "ipd:read",
    "request:create",
    "transfer:write",
    "progress:write",
    "discharge:request",
  ]),
  "Billing Staff": new Set(["ipd:read", "discharge:approve"]),
  Pharmacist: new Set(["ipd:read", "discharge:approve"]),
  Receptionist: new Set(["ipd:read", "admission:write", "request:create"]),
};

export function resolveIpdRole(raw: string | undefined): IpdRole {
  if (raw && (IPD_ROLES as string[]).includes(raw)) {
    return raw as IpdRole;
  }
  return "Ward Manager";
}

export function hasIpdPermission(role: IpdRole, action: IpdAction): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
