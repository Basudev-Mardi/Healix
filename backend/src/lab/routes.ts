import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import {
  hasLabPermission,
  resolveLabRole,
  type LabAction,
} from "./permissions.js";
import {
  collectSample,
  createLabRequest,
  createLabTest,
  generateDigitalReport,
  getLabState,
  saveTestResult,
  updateLabRequestStatus,
  updateLabTest,
  updateSampleTracking,
  verifyTestResult,
} from "./service.js";

function guard(c: Context, action: LabAction) {
  const role = resolveLabRole(c.req.header("x-lab-role"));
  if (!hasLabPermission(role, action)) {
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
    error instanceof Error ? error.message : "Unexpected Lab backend error.";
  return c.json({ error: message }, 500);
}

export const labRoutes = new Hono();

labRoutes.get("/state", async (c) => {
  const denied = guard(c, "lab:read");
  if (denied) return denied;
  try {
    return c.json(await getLabState());
  } catch (e) {
    return handleError(c, e);
  }
});

labRoutes.post("/tests", async (c) => {
  const denied = guard(c, "lab:catalog:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const test = await createLabTest(body);
    return c.json({ test }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

labRoutes.patch("/tests", async (c) => {
  const denied = guard(c, "lab:catalog:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const test = await updateLabTest(body);
    return c.json({ test });
  } catch (e) {
    return handleError(c, e);
  }
});

labRoutes.post("/requests", async (c) => {
  const denied = guard(c, "lab:request:create");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const request = await createLabRequest(body);
    return c.json({ request }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

labRoutes.patch("/requests", async (c) => {
  const denied = guard(c, "lab:sample:track");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const request = await updateLabRequestStatus(body.requestId, body.status);
    return c.json({ request });
  } catch (e) {
    return handleError(c, e);
  }
});

labRoutes.post("/samples", async (c) => {
  const denied = guard(c, "lab:sample:collect");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveLabRole(c.req.header("x-lab-role"));
    const sample = await collectSample({
      ...body,
      collectedBy: body.collectedBy || role,
    });
    return c.json({ sample }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

labRoutes.patch("/samples", async (c) => {
  const denied = guard(c, "lab:sample:track");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveLabRole(c.req.header("x-lab-role"));
    const sample = await updateSampleTracking({
      ...body,
      staff: body.staff || role,
    });
    return c.json({ sample });
  } catch (e) {
    return handleError(c, e);
  }
});

labRoutes.post("/results", async (c) => {
  const denied = guard(c, "lab:process");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveLabRole(c.req.header("x-lab-role"));
    const result = await saveTestResult({
      ...body,
      processedBy: body.processedBy || role,
    });
    return c.json({ result }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

labRoutes.patch("/results", async (c) => {
  const denied = guard(c, "lab:verify");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveLabRole(c.req.header("x-lab-role"));
    const result = await verifyTestResult({
      ...body,
      verifiedBy: body.verifiedBy || role,
    });
    return c.json({ result });
  } catch (e) {
    return handleError(c, e);
  }
});

labRoutes.post("/reports", async (c) => {
  const denied = guard(c, "lab:report:generate");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveLabRole(c.req.header("x-lab-role"));
    const report = await generateDigitalReport({
      requestId: body.requestId,
      generatedBy: body.generatedBy || role,
    });
    return c.json({ report }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});
