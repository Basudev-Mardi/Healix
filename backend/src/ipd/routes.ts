import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import {
  hasIpdPermission,
  resolveIpdRole,
  type IpdAction,
} from "./permissions.js";
import {
  createAdmission,
  createAdmissionRequest,
  createDischargeRequest,
  createIpdTransfer,
  createProgressNote,
  createTreatmentPlan,
  getIpdState,
  reviewAdmissionRequest,
  saveDischargeSummary,
  updateDischarge,
  updateTreatmentPlanStatus,
} from "./service.js";

function guard(c: Context, action: IpdAction) {
  const role = resolveIpdRole(c.req.header("x-ipd-role"));
  if (!hasIpdPermission(role, action)) {
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
    error instanceof Error ? error.message : "Unexpected IPD backend error.";
  return c.json({ error: message }, 500);
}

export const ipdRoutes = new Hono();

ipdRoutes.get("/state", async (c) => {
  const denied = guard(c, "ipd:read");
  if (denied) return denied;
  try {
    return c.json(await getIpdState());
  } catch (e) {
    return handleError(c, e);
  }
});

ipdRoutes.post("/admissions", async (c) => {
  const denied = guard(c, "admission:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const result = await createAdmission(body);
    return c.json(result, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

ipdRoutes.post("/requests", async (c) => {
  const denied = guard(c, "request:create");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveIpdRole(c.req.header("x-ipd-role"));
    const request = await createAdmissionRequest({
      ...body,
      requestedBy: body.requestedBy || role,
    });
    return c.json({ request }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

ipdRoutes.patch("/requests", async (c) => {
  const denied = guard(c, "request:review");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveIpdRole(c.req.header("x-ipd-role"));
    const request = await reviewAdmissionRequest({
      ...body,
      reviewedBy: body.reviewedBy || role,
    });
    return c.json({ request });
  } catch (e) {
    return handleError(c, e);
  }
});

ipdRoutes.post("/transfers", async (c) => {
  const denied = guard(c, "transfer:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const transfer = await createIpdTransfer(body);
    return c.json({ transfer }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

ipdRoutes.post("/progress-notes", async (c) => {
  const denied = guard(c, "progress:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveIpdRole(c.req.header("x-ipd-role"));
    const note = await createProgressNote({
      ...body,
      recordedBy: body.recordedBy || role,
      recordedRole: role,
    });
    return c.json({ note }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

ipdRoutes.post("/treatment-plans", async (c) => {
  const denied = guard(c, "treatment:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const plan = await createTreatmentPlan(body);
    return c.json({ plan }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

ipdRoutes.patch("/treatment-plans", async (c) => {
  const denied = guard(c, "treatment:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const plan = await updateTreatmentPlanStatus(body.planId, body.status);
    return c.json({ plan });
  } catch (e) {
    return handleError(c, e);
  }
});

ipdRoutes.post("/discharges", async (c) => {
  const denied = guard(c, "discharge:request");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const discharge = await createDischargeRequest(body);
    return c.json({ discharge }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

ipdRoutes.patch("/discharges", async (c) => {
  const denied = guard(c, "discharge:approve");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveIpdRole(c.req.header("x-ipd-role"));
    const discharge = await updateDischarge({
      ...body,
      approvedBy: body.approvedBy || role,
    });
    return c.json({ discharge });
  } catch (e) {
    return handleError(c, e);
  }
});

ipdRoutes.post("/discharge-summaries", async (c) => {
  const denied = guard(c, "summary:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveIpdRole(c.req.header("x-ipd-role"));
    const summary = await saveDischargeSummary({
      ...body,
      authorizedBy: body.authorizedBy || role,
    });
    return c.json({ summary }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});
