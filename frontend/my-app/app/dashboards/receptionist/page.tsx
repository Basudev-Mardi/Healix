import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Receptionist Dashboard | Healix HMS",
  description: "Independent dashboard for Receptionist role.",
};

export default function ReceptionistDashboardPage() {
  return (
    <DashboardView
      roleName="Receptionist"
      category="Core Role"
      department="Front Desk & Patient Registration"
      subtitle="Patient check-ins, appointment queue, new registrations, and lobby wait times."
      kpis={[
        {
          label: "Scheduled Appointments",
          value: "184",
          detail: "112 checked in so far today",
          tone: "info",
        },
        {
          label: "Waiting Lobby Queue",
          value: "17",
          detail: "Average wait time: 11 mins",
          tone: "success",
        },
        {
          label: "New Registrations",
          value: "29",
          detail: "ID & demographics verified",
          tone: "success",
        },
        {
          label: "Unconfirmed Walk-ins",
          value: "5",
          detail: "Awaiting slot assignment",
          tone: "warning",
        },
      ]}
      sections={[
        {
          title: "Upcoming Check-In Queue",
          description: "Patients arriving at the front desk for outpatient visits.",
          items: [
            {
              title: "Ananya Sharma • Token #A-104",
              subtitle: "Dr. R. Mehta (Internal Medicine)",
              meta: "10:30 AM",
              status: "Checked In",
              tone: "success",
            },
            {
              title: "Daniel Brooks • Token #A-105",
              subtitle: "Dr. S. Kapoor (Orthopedics)",
              meta: "10:45 AM",
              status: "Arrived",
              tone: "info",
            },
            {
              title: "Priya Nair • Token #A-106",
              subtitle: "Dr. L. Chen (Cardiology)",
              meta: "11:00 AM",
              status: "Pending ID",
              tone: "warning",
            },
          ],
        },
        {
          title: "Front Desk Inquiries & Transfers",
          description: "Visitor passes, department directions, and admission handoffs.",
          items: [
            {
              title: "IPD Admission Handoff • MRN-44921",
              subtitle: "Forwarded to Ward B reception",
              meta: "10:12 AM",
              status: "Transferred",
              tone: "info",
            },
            {
              title: "Follow-Up Reschedule Request",
              subtitle: "Dermatology clinic afternoon slot",
              meta: "10:20 AM",
              status: "Open",
              tone: "warning",
            },
            {
              title: "Visitor Pass Issuance",
              subtitle: "28 active inpatient visitor badges",
              meta: "Updated live",
              status: "Active",
              tone: "neutral",
            },
          ],
        },
      ]}
    />
  );
}
