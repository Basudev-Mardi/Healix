export type IcuRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "ICU Staff"
  | "Doctor"
  | "Nurse"
  | "Ward Manager"
  | "Pharmacist";

export type IcuAction =
  | "icu:read"
  | "icu:admit"
  | "icu:monitor"
  | "icu:vitals"
  | "icu:thresholds"
  | "icu:notes"
  | "icu:ventilator"
  | "icu:meds:prescribe"
  | "icu:meds:administer"
  | "icu:disposition:request"
  | "icu:disposition:approve";

export const ICU_ROLES: IcuRole[] = [
  "Super Admin",
  "Hospital Administrator",
  "ICU Staff",
  "Doctor",
  "Nurse",
  "Ward Manager",
  "Pharmacist",
];

const ALL_ACTIONS: IcuAction[] = [
  "icu:read",
  "icu:admit",
  "icu:monitor",
  "icu:vitals",
  "icu:thresholds",
  "icu:notes",
  "icu:ventilator",
  "icu:meds:prescribe",
  "icu:meds:administer",
  "icu:disposition:request",
  "icu:disposition:approve",
];

const ROLE_PERMISSIONS: Record<IcuRole, Set<IcuAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  "ICU Staff": new Set(ALL_ACTIONS),
  Doctor: new Set([
    "icu:read",
    "icu:admit",
    "icu:monitor",
    "icu:vitals",
    "icu:thresholds",
    "icu:notes",
    "icu:ventilator",
    "icu:meds:prescribe",
    "icu:disposition:request",
    "icu:disposition:approve",
  ]),
  Nurse: new Set([
    "icu:read",
    "icu:monitor",
    "icu:vitals",
    "icu:notes",
    "icu:ventilator",
    "icu:meds:administer",
    "icu:disposition:request",
  ]),
  "Ward Manager": new Set(["icu:read", "icu:admit", "icu:disposition:approve"]),
  Pharmacist: new Set(["icu:read", "icu:meds:prescribe"]),
};

export function resolveIcuRole(raw: string | undefined): IcuRole {
  if (raw && (ICU_ROLES as string[]).includes(raw)) {
    return raw as IcuRole;
  }
  return "ICU Staff";
}

export function hasIcuPermission(role: IcuRole, action: IcuAction): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
