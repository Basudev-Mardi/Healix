import { Hono, type Context } from "hono";
import {
  hasOpdPermission,
  resolveOpdRole,
  type OpdAction,
} from "./permissions.js";
import {
  HttpError,
  createAppointment,
  generateTokenForAppointment,
  getOpdState,
  registerPatient,
  registerWalkIn,
  saveConsultation,
  scheduleFollowUp,
  searchPatients,
  updateAppointment,
  updateFollowUpStatus,
  updateQueueToken,
} from "./service.js";

function guard(c: Context, action: OpdAction) {
  const role = resolveOpdRole(c.req.header("x-opd-role"));
  if (!hasOpdPermission(role, action)) {
    return c.json(
      {
        error: `Access denied: role "${role}" does not have permission for "${action}".`,
      },
      403
    );
  }
  return null;
}

function handleError(c: Context, error: unknown) {
  if (error instanceof HttpError) {
    return c.json(
      { error: error.message, details: error.details },
      error.statusCode as 400 | 403 | 404 | 409 | 500
    );
  }
  const message =
    error instanceof Error ? error.message : "Unexpected OPD backend error.";
  return c.json({ error: message }, 500);
}

export const opdRoutes = new Hono();

opdRoutes.get("/state", async (c) => {
  const denied = guard(c, "patient:read");
  if (denied) return denied;
  try {
    return c.json(await getOpdState());
  } catch (e) {
    return handleError(c, e);
  }
});

opdRoutes.get("/patients", async (c) => {
  const denied = guard(c, "patient:read");
  if (denied) return denied;
  try {
    const q = c.req.query("q") ?? "";
    return c.json({ patients: await searchPatients(q) });
  } catch (e) {
    return handleError(c, e);
  }
});

opdRoutes.post("/patients", async (c) => {
  const denied = guard(c, "patient:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const patient = await registerPatient(body);
    return c.json({ patient }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

opdRoutes.post("/appointments", async (c) => {
  const denied = guard(c, "appointment:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const appointment = await createAppointment(body);
    return c.json({ appointment }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

opdRoutes.patch("/appointments", async (c) => {
  const denied = guard(c, "appointment:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const { appointmentId, ...rest } = body;
    const appointment = await updateAppointment(appointmentId, rest);
    return c.json({ appointment });
  } catch (e) {
    return handleError(c, e);
  }
});

opdRoutes.post("/walk-ins", async (c) => {
  const denied = guard(c, "walkin:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const result = await registerWalkIn(body);
    return c.json(result, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

opdRoutes.post("/tokens", async (c) => {
  const denied = guard(c, "token:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const result = await generateTokenForAppointment(
      body.appointmentId,
      body.priority
    );
    return c.json(result, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

opdRoutes.patch("/queue", async (c) => {
  const denied = guard(c, "queue:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const token = await updateQueueToken(body);
    return c.json({ token });
  } catch (e) {
    return handleError(c, e);
  }
});

opdRoutes.post("/consultations", async (c) => {
  const denied = guard(c, "consultation:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const consultation = await saveConsultation(body);
    return c.json({ consultation }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

opdRoutes.post("/follow-ups", async (c) => {
  const denied = guard(c, "followup:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const result = await scheduleFollowUp(body);
    return c.json(result, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

opdRoutes.patch("/follow-ups", async (c) => {
  const denied = guard(c, "followup:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const followUp = await updateFollowUpStatus(body.followUpId, body.status);
    return c.json({ followUp });
  } catch (e) {
    return handleError(c, e);
  }
});
