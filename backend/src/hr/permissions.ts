export type HrRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "HR Manager"
  | "Department Head"
  | "Payroll Officer"
  | "Employee";

export type HrAction =
  | "hr:read"
  | "hr:employee:manage"
  | "hr:attendance:manage"
  | "hr:shift:manage"
  | "hr:leave:apply"
  | "hr:leave:approve"
  | "hr:payroll:manage"
  | "hr:department:assign"
  | "hr:performance:manage";

const ALL_ACTIONS: HrAction[] = [
  "hr:read",
  "hr:employee:manage",
  "hr:attendance:manage",
  "hr:shift:manage",
  "hr:leave:apply",
  "hr:leave:approve",
  "hr:payroll:manage",
  "hr:department:assign",
  "hr:performance:manage",
];

const ROLE_PERMISSIONS: Record<HrRole, Set<HrAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  "HR Manager": new Set(ALL_ACTIONS),
  "Department Head": new Set([
    "hr:read",
    "hr:attendance:manage",
    "hr:shift:manage",
    "hr:leave:apply",
    "hr:leave:approve",
    "hr:department:assign",
    "hr:performance:manage",
  ]),
  "Payroll Officer": new Set(["hr:read", "hr:payroll:manage"]),
  Employee: new Set(["hr:read", "hr:leave:apply"]),
};

const VALID_ROLES = new Set<HrRole>(Object.keys(ROLE_PERMISSIONS) as HrRole[]);

export function resolveHrRole(headerValue: string | undefined): HrRole {
  if (headerValue && VALID_ROLES.has(headerValue as HrRole)) {
    return headerValue as HrRole;
  }
  return "HR Manager";
}

export function hasHrPermission(role: HrRole, action: HrAction): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
