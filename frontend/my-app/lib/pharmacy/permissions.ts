import type { PharmacyRole } from "./types";

export type PharmacyAction =
  | "pharmacy:read"
  | "pharmacy:catalog:manage"
  | "pharmacy:prescription:create"
  | "pharmacy:prescription:process"
  | "pharmacy:dispense"
  | "pharmacy:stock:manage"
  | "pharmacy:batch:manage"
  | "pharmacy:expiry:manage"
  | "pharmacy:supplier:manage";

export const PHARMACY_ROLES: PharmacyRole[] = [
  "Super Admin",
  "Hospital Administrator",
  "Pharmacist",
  "Pharmacy Technician",
  "Doctor",
  "Nurse",
  "Patient",
];

const ALL_ACTIONS: PharmacyAction[] = [
  "pharmacy:read",
  "pharmacy:catalog:manage",
  "pharmacy:prescription:create",
  "pharmacy:prescription:process",
  "pharmacy:dispense",
  "pharmacy:stock:manage",
  "pharmacy:batch:manage",
  "pharmacy:expiry:manage",
  "pharmacy:supplier:manage",
];

const ROLE_PERMISSIONS: Record<PharmacyRole, Set<PharmacyAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  Pharmacist: new Set(ALL_ACTIONS),
  "Pharmacy Technician": new Set([
    "pharmacy:read",
    "pharmacy:prescription:process",
    "pharmacy:dispense",
    "pharmacy:stock:manage",
    "pharmacy:batch:manage",
    "pharmacy:expiry:manage",
  ]),
  Doctor: new Set(["pharmacy:read", "pharmacy:prescription:create"]),
  Nurse: new Set(["pharmacy:read"]),
  Patient: new Set(["pharmacy:read"]),
};

export function hasPharmacyPermission(
  role: PharmacyRole,
  action: PharmacyAction
): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
