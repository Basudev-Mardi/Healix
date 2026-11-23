import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Dietitian & Nutrition Staff Dashboard | Healix HMS",
  description: "Independent dashboard for Dietitian & Nutrition Staff role.",
};

export default function DietitianNutritionStaffDashboardPage() {
  return (
    <DashboardView
      roleName="Dietitian & Nutrition Staff"
      category="Specialist Role"
      department="Clinical Nutrition & Dietary Services"
      subtitle="Therapeutic meal plans, inpatient allergy flags, enteral/parenteral nutrition orders, and consults."
      kpis={[
        {
          label: "Active Therapeutic Diets",
          value: "312",
          detail: "Diabetic, renal, cardiac, and soft diets",
          tone: "info",
        },
        {
          label: "Enteral / TPN Orders",
          value: "18",
          detail: "14 ICU tube feeds, 4 TPN regimens",
          tone: "warning",
        },
        {
          label: "New Nutrition Consults",
          value: "9",
          detail: "Referred by Oncology & Medicine wards",
          tone: "info",
        },
        {
          label: "Allergy Tray Checks",
          value: "100%",
          detail: "All lunch trays double-verified",
          tone: "success",
        },
      ]}
      sections={[
        {
          title: "Clinical Nutrition Consult Queue",
          description: "Inpatient dietary assessments and specialized feed adjustments.",
          items: [
            {
              title: "ICU-03 • Enteral Feed Titration",
              subtitle: "High-protein polymeric formula • Caloric target review",
              meta: "Priority",
              status: "Review",
              tone: "warning",
            },
            {
              title: "Ward C-05 • Renal Low-Potassium Diet",
              subtitle: "CKD Stage 4 • Updated fluid restriction 1.2L/day",
              meta: "Updated 09:50",
              status: "Active",
              tone: "success",
            },
            {
              title: "Ward A-09 • Post-Bariatric Clear Liquids",
              subtitle: "Day 1 post-op progression plan",
              meta: "Scheduled 12:00",
              status: "Prepared",
              tone: "info",
            },
          ],
        },
        {
          title: "Meal Dispatch & Safety Controls",
          description: "Kitchen production status and allergen verification.",
          items: [
            {
              title: "Lunch Therapeutic Tray Dispatch",
              subtitle: "312 patient trays staged by wing",
              meta: "Dispatch 12:15 PM",
              status: "On Time",
              tone: "success",
            },
            {
              title: "Severe Allergen Flagged Trays (14)",
              subtitle: "Nut, gluten, and dairy-free isolated prep",
              meta: "Verified",
              status: "Safe",
              tone: "success",
            },
            {
              title: "NPO (Nil Per Os) Hold List",
              subtitle: "11 patients held for afternoon procedures",
              meta: "Synced with OT",
              status: "Held",
              tone: "warning",
            },
          ],
        },
      ]}
    />
  );
}
