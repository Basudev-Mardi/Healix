import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Inventory & Supply Chain Manager Dashboard | Healix HMS",
  description: "Independent dashboard for Inventory & Supply Chain Manager role.",
};

export default function InventorySupplyChainManagerDashboardPage() {
  return (
    <DashboardView
      roleName="Inventory & Supply Chain Manager"
      category="Specialist Role"
      department="Central Stores & Medical Procurement"
      subtitle="Consumables stock levels, purchase orders, vendor deliveries, and departmental requisitions."
      kpis={[
        {
          label: "Active SKUs Tracked",
          value: "3,410",
          detail: "Surgical, lab, ICU, and general supplies",
          tone: "info",
        },
        {
          label: "Below Reorder Point",
          value: "14",
          detail: "3 critical surgical & lab items",
          tone: "danger",
        },
        {
          label: "Open Purchase Orders",
          value: "23",
          detail: "7 vendor shipments arriving today",
          tone: "warning",
        },
        {
          label: "Order Fill Rate",
          value: "97.8%",
          detail: "Departmental requisitions met on time",
          tone: "success",
        },
      ]}
      sections={[
        {
          title: "Critical Stock & Reorder Alerts",
          description: "Essential hospital consumables approaching safety stock limits.",
          items: [
            {
              title: "Sterile Nitrile Surgical Gloves (Size 7.5)",
              subtitle: "Central Store: 120 boxes • Daily burn: 45 boxes",
              meta: "PO #8841 placed",
              status: "Critical Low",
              tone: "danger",
            },
            {
              title: "Coagulation Lab Reagent Kits",
              subtitle: "Flagged by Laboratory Staff • Vendor ETA tomorrow",
              meta: "In transit",
              status: "Low Stock",
              tone: "warning",
            },
            {
              title: "Adult Ventilator Breathing Circuits",
              subtitle: "ICU par level replenished to 100%",
              meta: "Restocked 09:00",
              status: "Optimal",
              tone: "success",
            },
          ],
        },
        {
          title: "Deliveries & Departmental Requisitions",
          description: "Inbound receiving dock schedule and internal store issues.",
          items: [
            {
              title: "MedLine Medical Supplies • Shipment #SH-402",
              subtitle: "42 cartons IV sets & dressings at Receiving Dock",
              meta: "Inspecting",
              status: "Arrived",
              tone: "info",
            },
            {
              title: "OT Consumables Weekly Replenishment",
              subtitle: "Sutures, drapes, and catheters picked & staged",
              meta: "Dispatch 11:30",
              status: "Ready",
              tone: "success",
            },
            {
              title: "Monthly Expiry & Lot Audit",
              subtitle: "19 near-expiry items flagged for priority rotation",
              meta: "In progress",
              status: "Review",
              tone: "warning",
            },
          ],
        },
      ]}
    />
  );
}
