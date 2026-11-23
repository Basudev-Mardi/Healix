import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import { hasHrPermission, resolveHrRole, type HrAction } from "./permissions.js";
import {
  applyLeave,
  assignDepartment,
  createPerformanceReview,
  createShift,
  generatePayroll,
  getHrState,
  recordAttendance,
  registerEmployee,
  reviewLeave,
  updatePayrollStatus,
} from "./service.js";

function guard(c: Context, action: HrAction) {
  const role = resolveHrRole(c.req.header("x-hr-role"));
  if (!hasHrPermission(role, action)) {
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
    error instanceof Error ? error.message : "Unexpected HR backend error.";
  return c.json({ error: message }, 500);
}

export const hrRoutes = new Hono();

hrRoutes.get("/state", async (c) => {
  const denied = guard(c, "hr:read");
  if (denied) return denied;
  try {
    return c.json(await getHrState());
  } catch (e) {
    return handleError(c, e);
  }
});

hrRoutes.post("/employees", async (c) => {
  const denied = guard(c, "hr:employee:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveHrRole(c.req.header("x-hr-role"));
    const employee = await registerEmployee({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ employee }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

hrRoutes.post("/attendance", async (c) => {
  const denied = guard(c, "hr:attendance:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveHrRole(c.req.header("x-hr-role"));
    const attendance = await recordAttendance({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ attendance }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

hrRoutes.post("/shifts", async (c) => {
  const denied = guard(c, "hr:shift:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveHrRole(c.req.header("x-hr-role"));
    const shift = await createShift({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ shift }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

hrRoutes.post("/leaves", async (c) => {
  const denied = guard(c, "hr:leave:apply");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const leave = await applyLeave(body);
    return c.json({ leave }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

hrRoutes.patch("/leaves", async (c) => {
  const denied = guard(c, "hr:leave:approve");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveHrRole(c.req.header("x-hr-role"));
    const leave = await reviewLeave({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ leave });
  } catch (e) {
    return handleError(c, e);
  }
});

hrRoutes.post("/payroll", async (c) => {
  const denied = guard(c, "hr:payroll:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveHrRole(c.req.header("x-hr-role"));
    const payroll = await generatePayroll({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ payroll }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

hrRoutes.patch("/payroll", async (c) => {
  const denied = guard(c, "hr:payroll:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveHrRole(c.req.header("x-hr-role"));
    const payroll = await updatePayrollStatus({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ payroll });
  } catch (e) {
    return handleError(c, e);
  }
});

hrRoutes.post("/assignments", async (c) => {
  const denied = guard(c, "hr:department:assign");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveHrRole(c.req.header("x-hr-role"));
    const assignment = await assignDepartment({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ assignment }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

hrRoutes.post("/performance", async (c) => {
  const denied = guard(c, "hr:performance:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveHrRole(c.req.header("x-hr-role"));
    const review = await createPerformanceReview({
      ...body,
      actorRole: role,
      reviewerName: body.reviewerName || role,
    });
    return c.json({ review }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});
