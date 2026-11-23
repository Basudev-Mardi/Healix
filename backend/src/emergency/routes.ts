import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import {
  hasEmergencyPermission,
  resolveEmergencyRole,
  type EmergencyAction,
} from "./permissions.js";
import {
  createCriticalAlert,
  createEmergencyRegistration,
  createTransferRequest,
  createTreatmentRecord,
  getEmergencyState,
  saveTraumaRecord,
  saveTriageAssessment,
  updateCriticalAlert,
  updateEmergencyQueueStatus,
  updateTransferStatus,
  updateTraumaProgress,
} from "./service.js";

function guard(c: Context, action: EmergencyAction) {
  const role = resolveEmergencyRole(c.req.header("x-emergency-role"));
  if (!hasEmergencyPermission(role, action)) {
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
      { error: error.message },
      error.statusCode as 400 | 403 | 404 | 409 | 500
    );
  }
  const message =
    error instanceof Error
      ? error.message
      : "Unexpected Emergency backend error.";
  return c.json({ error: message }, 500);
}

export const emergencyRoutes = new Hono();

emergencyRoutes.get("/state", async (c) => {
  const denied = guard(c, "emergency:read");
  if (denied) return denied;
  try {
    return c.json(await getEmergencyState());
  } catch (e) {
    return handleError(c, e);
  }
});

emergencyRoutes.post("/registrations", async (c) => {
  const denied = guard(c, "registration:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveEmergencyRole(c.req.header("x-emergency-role"));
    const result = await createEmergencyRegistration({
      ...body,
      registeredBy: body.registeredBy || role,
    });
    return c.json(result, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

emergencyRoutes.post("/triage", async (c) => {
  const denied = guard(c, "triage:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveEmergencyRole(c.req.header("x-emergency-role"));
    const result = await saveTriageAssessment({
      ...body,
      assessedBy: body.assessedBy || role,
    });
    return c.json(result, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

emergencyRoutes.patch("/queue", async (c) => {
  const denied = guard(c, "queue:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const registration = await updateEmergencyQueueStatus(body);
    return c.json({ registration });
  } catch (e) {
    return handleError(c, e);
  }
});

emergencyRoutes.post("/trauma", async (c) => {
  const denied = guard(c, "trauma:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveEmergencyRole(c.req.header("x-emergency-role"));
    const trauma = await saveTraumaRecord({
      ...body,
      recordedBy: body.recordedBy || role,
    });
    return c.json({ trauma }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

emergencyRoutes.patch("/trauma", async (c) => {
  const denied = guard(c, "trauma:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const trauma = await updateTraumaProgress(
      body.traumaId,
      body.treatmentProgress
    );
    return c.json({ trauma });
  } catch (e) {
    return handleError(c, e);
  }
});

emergencyRoutes.post("/treatments", async (c) => {
  const denied = guard(c, "treatment:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const treatment = await createTreatmentRecord(body);
    return c.json({ treatment }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

emergencyRoutes.post("/alerts", async (c) => {
  const denied = guard(c, "alert:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveEmergencyRole(c.req.header("x-emergency-role"));
    const alert = await createCriticalAlert({
      ...body,
      triggeredBy: body.triggeredBy || role,
    });
    return c.json({ alert }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

emergencyRoutes.patch("/alerts", async (c) => {
  const denied = guard(c, "alert:acknowledge");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveEmergencyRole(c.req.header("x-emergency-role"));
    const alert = await updateCriticalAlert({
      ...body,
      actor: body.actor || role,
    });
    return c.json({ alert });
  } catch (e) {
    return handleError(c, e);
  }
});

emergencyRoutes.post("/transfers", async (c) => {
  const denied = guard(c, "transfer:request");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveEmergencyRole(c.req.header("x-emergency-role"));
    const transfer = await createTransferRequest({
      ...body,
      requestedBy: body.requestedBy || role,
    });
    return c.json({ transfer }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

emergencyRoutes.patch("/transfers", async (c) => {
  const denied = guard(c, "transfer:approve");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const transfer = await updateTransferStatus(body);
    return c.json({ transfer });
  } catch (e) {
    return handleError(c, e);
  }
});
