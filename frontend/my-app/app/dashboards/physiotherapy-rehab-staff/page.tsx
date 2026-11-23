import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Physiotherapy & Rehab Staff Dashboard | Healix HMS",
  description: "Independent dashboard for Physiotherapy & Rehab Staff role.",
};

export default function PhysiotherapyRehabStaffDashboardPage() {
  return (
    <DashboardView
      roleName="Physiotherapy & Rehab Staff"
      category="Specialist Role"
      department="Physical Medicine & Rehabilitation"
      subtitle="Inpatient mobility rounds, post-surgical rehab sessions, outpatient therapy slots, and progress tracking."
      kpis={[
        {
          label: "Therapy Sessions Today",
          value: "38",
          detail: "21 inpatient bedside, 17 OPD gym",
          tone: "info",
        },
        {
          label: "Post-Op Ortho Mobilizations",
          value: "10",
          detail: "Day-1 knee & hip replacement protocols",
          tone: "success",
        },
        {
          label: "ICU Chest Physio Orders",
          value: "6",
          detail: "4 completed on morning round",
          tone: "warning",
        },
        {
          label: "Discharge Mobility Clearances",
          value: "5",
          detail: "Gait & stair safety evaluations",
          tone: "info",
        },
      ]}
      sections={[
        {
          title: "Upcoming Rehab Sessions",
          description: "Scheduled bedside and rehabilitation gym appointments.",
          items: [
            {
              title: "Ward B-14 • Post-TKR Ambulation",
              subtitle: "Walker-assisted gait training • Pain score 3/10",
              meta: "10:45 AM",
              status: "Next Up",
              tone: "info",
            },
            {
              title: "ICU-07 • Post-CABG Respiratory Physio",
              subtitle: "Incentive spirometry & airway clearance",
              meta: "11:15 AM",
              status: "Priority",
              tone: "warning",
            },
            {
              title: "Rehab Gym • Stroke Neuro-Rehab",
              subtitle: "Upper limb motor recovery • Session 8 of 12",
              meta: "Completed 10:00",
              status: "Logged",
              tone: "success",
            },
          ],
        },
        {
          title: "Equipment & Discharge Readiness",
          description: "Assistive devices issued and functional independence milestones.",
          items: [
            {
              title: "Mobility Clearance • Ward A-12",
              subtitle: "Independent transfer & safe stair ascent verified",
              meta: "Signed off",
              status: "Cleared",
              tone: "success",
            },
            {
              title: "CPM Knee Machine #PT-04",
              subtitle: "Assigned to Orthopedic Ward B-11",
              meta: "In use",
              status: "Active",
              tone: "info",
            },
            {
              title: "Home Exercise Plan Handouts",
              subtitle: "5 discharge patients awaiting final instruction",
              meta: "Afternoon",
              status: "Pending",
              tone: "neutral",
            },
          ],
        },
      ]}
    />
  );
}
