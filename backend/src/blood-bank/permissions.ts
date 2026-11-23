export type BloodBankRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "Blood Bank Staff"
  | "Laboratory Staff"
  | "Doctor"
  | "Nurse"
  | "Donor";

export type BloodBankAction =
  | "blood:read"
  | "blood:donor:manage"
  | "blood:unit:collect"
  | "blood:unit:screen"
  | "blood:component:separate"
  | "blood:request:create"
  | "blood:request:approve"
  | "blood:compatibility:test"
  | "blood:compatibility:verify"
  | "blood:unit:issue"
  | "blood:transfusion:record";

const ALL_ACTIONS: BloodBankAction[] = [
  "blood:read",
  "blood:donor:manage",
  "blood:unit:collect",
  "blood:unit:screen",
  "blood:component:separate",
  "blood:request:create",
  "blood:request:approve",
  "blood:compatibility:test",
  "blood:compatibility:verify",
  "blood:unit:issue",
  "blood:transfusion:record",
];

const ROLE_PERMISSIONS: Record<BloodBankRole, Set<BloodBankAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  "Blood Bank Staff": new Set([
    "blood:read",
    "blood:donor:manage",
    "blood:unit:collect",
    "blood:component:separate",
    "blood:request:approve",
    "blood:unit:issue",
  ]),
  "Laboratory Staff": new Set([
    "blood:read",
    "blood:unit:screen",
    "blood:component:separate",
    "blood:compatibility:test",
    "blood:compatibility:verify",
  ]),
  Doctor: new Set([
    "blood:read",
    "blood:request:create",
    "blood:compatibility:verify",
    "blood:transfusion:record",
  ]),
  Nurse: new Set(["blood:read", "blood:transfusion:record"]),
  Donor: new Set(["blood:read"]),
};

const VALID_ROLES = new Set<BloodBankRole>(
  Object.keys(ROLE_PERMISSIONS) as BloodBankRole[]
);

export function resolveBloodBankRole(
  headerValue: string | undefined
): BloodBankRole {
  if (headerValue && VALID_ROLES.has(headerValue as BloodBankRole)) {
    return headerValue as BloodBankRole;
  }
  return "Blood Bank Staff";
}

export function hasBloodBankPermission(
  role: BloodBankRole,
  action: BloodBankAction
): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
