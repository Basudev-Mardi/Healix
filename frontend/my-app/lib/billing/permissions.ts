import type { BillingRole } from "./types";

export type BillingAction =
  | "billing:read"
  | "billing:invoice:create"
  | "billing:invoice:cancel"
  | "billing:payment:collect"
  | "billing:insurance:manage"
  | "billing:refund:authorize"
  | "billing:reports:view";

export const BILLING_ROLES: BillingRole[] = [
  "Super Admin",
  "Hospital Administrator",
  "Finance Manager",
  "Billing Staff",
  "Insurance Coordinator",
  "Doctor",
  "Patient",
];

const ALL_ACTIONS: BillingAction[] = [
  "billing:read",
  "billing:invoice:create",
  "billing:invoice:cancel",
  "billing:payment:collect",
  "billing:insurance:manage",
  "billing:refund:authorize",
  "billing:reports:view",
];

const ROLE_PERMISSIONS: Record<BillingRole, Set<BillingAction>> = {
  "Super Admin": new Set(ALL_ACTIONS),
  "Hospital Administrator": new Set(ALL_ACTIONS),
  "Finance Manager": new Set(ALL_ACTIONS),
  "Billing Staff": new Set([
    "billing:read",
    "billing:invoice:create",
    "billing:payment:collect",
    "billing:insurance:manage",
    "billing:reports:view",
  ]),
  "Insurance Coordinator": new Set([
    "billing:read",
    "billing:insurance:manage",
    "billing:reports:view",
  ]),
  Doctor: new Set(["billing:read"]),
  Patient: new Set(["billing:read"]),
};

export function hasBillingPermission(
  role: BillingRole,
  action: BillingAction
): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}
