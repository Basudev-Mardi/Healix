import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Super Admin Dashboard | Healix HMS",
  description: "Independent dashboard for Super Admin role.",
};

export default function SuperAdminDashboardPage() {
  return (
    <DashboardView
      roleName="Super Admin"
      category="Core Role"
      department="Platform Governance & Multi-Facility Oversight"
      subtitle="System-wide health, tenant facilities, security compliance, and role access overview."
      kpis={[
        {
          label: "Active Hospital Facilities",
          value: "12",
          detail: "All connected branches operational",
          tone: "success",
        },
        {
          label: "Total System Users",
          value: "4,820",
          detail: "25 role groups provisioned",
          tone: "info",
        },
        {
          label: "System Uptime",
          value: "99.98%",
          detail: "Last 30 days across all services",
          tone: "success",
        },
        {
          label: "Security Alerts",
          value: "2",
          detail: "Pending privileged access reviews",
          tone: "warning",
        },
      ]}
      sections={[
        {
          title: "Facility Status",
          description: "Live operational status of registered hospital campuses.",
          items: [
            {
              title: "Healix Central Medical Center",
              subtitle: "Main tertiary hospital • 640 beds",
              meta: "99.99% uptime",
              status: "Online",
              tone: "success",
            },
            {
              title: "Healix North Trauma Institute",
              subtitle: "Regional emergency & trauma campus",
              meta: "99.96% uptime",
              status: "Online",
              tone: "success",
            },
            {
              title: "Healix East Diagnostic Wing",
              subtitle: "Outpatient & imaging satellite",
              meta: "Sync delayed 2m",
              status: "Degraded",
              tone: "warning",
            },
          ],
        },
        {
          title: "Governance & Audit Queue",
          description: "High-level platform compliance and configuration items.",
          items: [
            {
              title: "Quarterly RBAC Policy Review",
              subtitle: "Permission matrix verification across 25 roles",
              meta: "Due in 3 days",
              status: "Pending",
              tone: "warning",
            },
            {
              title: "HIPAA & Data Retention Audit",
              subtitle: "Automated encrypted backup verification",
              meta: "Completed today",
              status: "Passed",
              tone: "success",
            },
            {
              title: "SSO Identity Provider Certificate",
              subtitle: "Enterprise SAML signing key rotation",
              meta: "Valid 48 days",
              status: "Scheduled",
              tone: "info",
            },
          ],
        },
      ]}
    />
  );
}
