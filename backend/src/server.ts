import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { billingRoutes } from "./billing/routes.js";
import { getPool } from "./db/client.js";
import { emergencyRoutes } from "./emergency/routes.js";
import { icuRoutes } from "./icu/routes.js";
import { ipdRoutes } from "./ipd/routes.js";
import { labRoutes } from "./lab/routes.js";
import { opdRoutes } from "./opd/routes.js";
import { otRoutes } from "./ot/routes.js";
import { pharmacyRoutes } from "./pharmacy/routes.js";
import { radiologyRoutes } from "./radiology/routes.js";
import { wardsBedsRoutes } from "./wards-beds/routes.js";

const app = new Hono();

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(
  "/api/*",
  cors({
    origin: corsOrigin,
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "x-opd-role",
      "x-emergency-role",
      "x-ipd-role",
      "x-ward-role",
      "x-icu-role",
      "x-ot-role",
      "x-lab-role",
      "x-radiology-role",
      "x-pharmacy-role",
      "x-billing-role",
    ],
  })
);

app.get("/health", async (c) => {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    return c.json({ status: "ok", database: "neon-lakebase-postgres" });
  } catch (error) {
    return c.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "DB connection failed",
      },
      500
    );
  }
});

app.route("/api/opd", opdRoutes);
app.route("/api/emergency", emergencyRoutes);
app.route("/api/ipd", ipdRoutes);
app.route("/api/wards-beds", wardsBedsRoutes);
app.route("/api/icu", icuRoutes);
app.route("/api/ot", otRoutes);
app.route("/api/lab", labRoutes);
app.route("/api/radiology", radiologyRoutes);
app.route("/api/pharmacy", pharmacyRoutes);
app.route("/api/billing", billingRoutes);

const port = Number(process.env.PORT || 4000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Healix Backend API listening on http://localhost:${info.port}`);
});
