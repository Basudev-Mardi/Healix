import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getPool } from "./db/client.js";
import { emergencyRoutes } from "./emergency/routes.js";
import { ipdRoutes } from "./ipd/routes.js";
import { opdRoutes } from "./opd/routes.js";

const app = new Hono();

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(
  "/api/*",
  cors({
    origin: corsOrigin,
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "x-opd-role", "x-emergency-role", "x-ipd-role"],
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

const port = Number(process.env.PORT || 4000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Healix Backend API listening on http://localhost:${info.port}`);
});
