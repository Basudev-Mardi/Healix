import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import {
  bookPatientAppointment,
  createSupportTicket,
  getPatientPortalState,
  loginPatient,
  logoutPatient,
  markNotificationRead,
  payPatientInvoice,
  registerPatientAccount,
  resolvePatientFromToken,
  updatePatientAppointment,
  updatePatientProfile,
} from "./service.js";

function handleError(c: Context, error: unknown) {
  if (error instanceof HttpError) {
    return c.json(
      { error: error.message },
      error.statusCode as 400 | 401 | 403 | 404 | 409 | 500
    );
  }
  const message =
    error instanceof Error
      ? error.message
      : "Unexpected Patient Portal error.";
  return c.json({ error: message }, 500);
}

export const patientPortalRoutes = new Hono();

patientPortalRoutes.post("/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    return c.json(await loginPatient(body));
  } catch (e) {
    return handleError(c, e);
  }
});

patientPortalRoutes.post("/auth/register", async (c) => {
  try {
    const body = await c.req.json();
    return c.json(await registerPatientAccount(body), 201);
  } catch (e) {
    return handleError(c, e);
  }
});

patientPortalRoutes.post("/auth/logout", async (c) => {
  try {
    const auth = c.req.header("Authorization");
    if (auth?.startsWith("Bearer ")) {
      await logoutPatient(auth.slice(7).trim());
    }
    return c.json({ ok: true });
  } catch (e) {
    return handleError(c, e);
  }
});

patientPortalRoutes.get("/state", async (c) => {
  try {
    const patientId = await resolvePatientFromToken(
      c.req.header("Authorization")
    );
    return c.json(await getPatientPortalState(patientId));
  } catch (e) {
    return handleError(c, e);
  }
});

patientPortalRoutes.patch("/profile", async (c) => {
  try {
    const patientId = await resolvePatientFromToken(
      c.req.header("Authorization")
    );
    const body = await c.req.json();
    return c.json(await updatePatientProfile(patientId, body));
  } catch (e) {
    return handleError(c, e);
  }
});

patientPortalRoutes.post("/appointments", async (c) => {
  try {
    const patientId = await resolvePatientFromToken(
      c.req.header("Authorization")
    );
    const body = await c.req.json();
    return c.json(await bookPatientAppointment(patientId, body), 201);
  } catch (e) {
    return handleError(c, e);
  }
});

patientPortalRoutes.patch("/appointments", async (c) => {
  try {
    const patientId = await resolvePatientFromToken(
      c.req.header("Authorization")
    );
    const body = await c.req.json();
    return c.json(await updatePatientAppointment(patientId, body));
  } catch (e) {
    return handleError(c, e);
  }
});

patientPortalRoutes.post("/payments", async (c) => {
  try {
    const patientId = await resolvePatientFromToken(
      c.req.header("Authorization")
    );
    const body = await c.req.json();
    return c.json(await payPatientInvoice(patientId, body), 201);
  } catch (e) {
    return handleError(c, e);
  }
});

patientPortalRoutes.patch("/notifications", async (c) => {
  try {
    const patientId = await resolvePatientFromToken(
      c.req.header("Authorization")
    );
    const body = await c.req.json();
    return c.json(await markNotificationRead(patientId, body.notificationId));
  } catch (e) {
    return handleError(c, e);
  }
});

patientPortalRoutes.post("/support", async (c) => {
  try {
    const patientId = await resolvePatientFromToken(
      c.req.header("Authorization")
    );
    const body = await c.req.json();
    return c.json(await createSupportTicket(patientId, body), 201);
  } catch (e) {
    return handleError(c, e);
  }
});
