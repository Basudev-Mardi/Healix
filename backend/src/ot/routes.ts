import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import {
  hasOtPermission,
  resolveOtRole,
  type OtAction,
} from "./permissions.js";
import {
  assignSurgeon,
  createPostOpRecord,
  createSurgery,
  getOtState,
  removeSurgeonAssignment,
  saveAnesthesiaRecord,
  savePreOpChecklist,
  saveSurgicalRecord,
  updateSurgery,
  updateTheatreStatus,
} from "./service.js";

function guard(c: Context, action: OtAction) {
  const role = resolveOtRole(c.req.header("x-ot-role"));
  if (!hasOtPermission(role, action)) {
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
    error instanceof Error ? error.message : "Unexpected OT backend error.";
  return c.json({ error: message }, 500);
}

export const otRoutes = new Hono();

otRoutes.get("/state", async (c) => {
  const denied = guard(c, "ot:read");
  if (denied) return denied;
  try {
    return c.json(await getOtState());
  } catch (e) {
    return handleError(c, e);
  }
});

otRoutes.post("/surgeries", async (c) => {
  const denied = guard(c, "ot:schedule");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const surgery = await createSurgery(body);
    return c.json({ surgery }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

otRoutes.patch("/surgeries", async (c) => {
  const denied = guard(c, "ot:schedule");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const surgery = await updateSurgery(body);
    return c.json({ surgery });
  } catch (e) {
    return handleError(c, e);
  }
});

otRoutes.patch("/theatres", async (c) => {
  const denied = guard(c, "ot:theatre:status");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const theatre = await updateTheatreStatus(body.theatreId, body.status);
    return c.json({ theatre });
  } catch (e) {
    return handleError(c, e);
  }
});

otRoutes.post("/assignments", async (c) => {
  const denied = guard(c, "ot:assign");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveOtRole(c.req.header("x-ot-role"));
    const assignment = await assignSurgeon({
      ...body,
      assignedBy: body.assignedBy || role,
    });
    return c.json({ assignment }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

otRoutes.delete("/assignments/:id", async (c) => {
  const denied = guard(c, "ot:assign");
  if (denied) return denied;
  try {
    return c.json(await removeSurgeonAssignment(c.req.param("id")));
  } catch (e) {
    return handleError(c, e);
  }
});

otRoutes.post("/checklists", async (c) => {
  const denied = guard(c, "ot:checklist");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveOtRole(c.req.header("x-ot-role"));
    const checklist = await savePreOpChecklist({
      ...body,
      verifiedBy: body.verifiedBy || role,
    });
    return c.json({ checklist }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

otRoutes.post("/surgical-records", async (c) => {
  const denied = guard(c, "ot:surgical:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveOtRole(c.req.header("x-ot-role"));
    const record = await saveSurgicalRecord({
      ...body,
      recordedBy: body.recordedBy || role,
    });
    return c.json({ record }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

otRoutes.post("/anesthesia-records", async (c) => {
  const denied = guard(c, "ot:anesthesia:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const record = await saveAnesthesiaRecord(body);
    return c.json({ record }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

otRoutes.post("/postop", async (c) => {
  const denied = guard(c, "ot:postop:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveOtRole(c.req.header("x-ot-role"));
    const record = await createPostOpRecord({
      ...body,
      responsibleStaff: body.responsibleStaff || role,
    });
    return c.json({ record }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});
