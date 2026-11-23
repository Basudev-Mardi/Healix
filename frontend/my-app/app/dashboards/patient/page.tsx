import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Patient Dashboard | Healix HMS",
  description: "Independent dashboard for Patient role.",
};

export default function PatientDashboardPage() {
  return (
    <DashboardView
      roleName="Patient"
      category="Core Role"
      department="Patient Health Portal"
      subtitle="Upcoming appointments, active prescriptions, recent lab results, and billing summary."
      kpis={[
        {
          label: "Upcoming Appointments",
          value: "2",
          detail: "Next visit: Cardiology on Thu 10:30 AM",
          tone: "info",
        },
        {
          label: "Active Prescriptions",
          value: "3",
          detail: "1 refill available for pickup",
          tone: "success",
        },
        {
          label: "New Lab Reports",
          value: "1",
          detail: "HbA1c & Lipid Panel released",
          tone: "success",
        },
        {
          label: "Outstanding Balance",
          value: "$45.00",
          detail: "Outpatient co-pay due in 14 days",
          tone: "warning",
        },
      ]}
      sections={[
        {
          title: "Upcoming Visits",
          description: "Your scheduled consultations and diagnostic appointments.",
          items: [
            {
              title: "Cardiology Follow-Up • Dr. L. Chen",
              subtitle: "Healix Central • Outpatient Wing Floor 2",
              meta: "Thu, 10:30 AM",
              status: "Confirmed",
              tone: "success",
            },
            {
              title: "Routine Blood Draw • Central Lab",
              subtitle: "Fasting required 8 hours prior",
              meta: "Next Mon, 08:00 AM",
              status: "Scheduled",
              tone: "info",
            },
            {
              title: "Annual Wellness Check • Dr. R. Mehta",
              subtitle: "Internal Medicine Clinic",
              meta: "Completed last mo",
              status: "Past Visit",
              tone: "neutral",
            },
          ],
        },
        {
          title: "Medications & Recent Reports",
          description: "Current prescriptions and released clinical documents.",
          items: [
            {
              title: "Atorvastatin 20mg • Once Daily",
              subtitle: "30-day supply • 2 refills remaining",
              meta: "Active",
              status: "On Schedule",
              tone: "success",
            },
            {
              title: "Comprehensive Metabolic Panel",
              subtitle: "Reviewed by Dr. R. Mehta • All values in range",
              meta: "Released yesterday",
              status: "Normal",
              tone: "success",
            },
            {
              title: "Outpatient Visit Statement #ST-902",
              subtitle: "Insurance processed • Co-pay balance $45.00",
              meta: "Due Dec 7",
              status: "Unpaid",
              tone: "warning",
            },
          ],
        },
      ]}
    />
  );
}
