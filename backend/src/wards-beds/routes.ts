import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import {
  hasWardBedPermission,
  resolveWardBedRole,
  type WardBedAction,
} from "./permissions.js";
import {
  allocateBed,
  createBed,
  createWard,
  getWardBedState,
  transferBed,
  updateBedStatus,
  updateCleaningWorkflow,
  updateWard,
} from "./service.js";

function guard(c: Context, action: WardBedAction) {
  const role = resolveWardBedRole(c.req.header("x-ward-role"));
  if (!hasWardBedPermission(role, action)) {
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
      : "Unexpected Ward & Bed backend error.";
  return c.json({ error: message }, 500);
}

export const wardsBedsRoutes = new Hono();

wardsBedsRoutes.get("/state", async (c) => {
  const denied = guard(c, "ward:read");
  if (denied) return denied;
  try {
    return c.json(await getWardBedState());
  } catch (e) {
    return handleError(c, e);
  }
});

wardsBedsRoutes.post("/wards", async (c) => {
  const denied = guard(c, "ward:configure");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const ward = await createWard(body);
    return c.json({ ward }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

wardsBedsRoutes.patch("/wards", async (c) => {
  const denied = guard(c, "ward:configure");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const ward = await updateWard(body);
    return c.json({ ward });
  } catch (e) {
    return handleError(c, e);
  }
});

wardsBedsRoutes.post("/beds", async (c) => {
  const denied = guard(c, "ward:configure");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const bed = await createBed(body);
    return c.json({ bed }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

wardsBedsRoutes.patch("/beds", async (c) => {
  const denied = guard(c, "bed:status");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveWardBedRole(c.req.header("x-ward-role"));
    const bed = await updateBedStatus({
      ...body,
      actor: body.actor || role,
    });
    return c.json({ bed });
  } catch (e) {
    return handleError(c, e);
  }
});

wardsBedsRoutes.post("/allocations", async (c) => {
  const denied = guard(c, "bed:allocate");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveWardBedRole(c.req.header("x-ward-role"));
    const allocation = await allocateBed({
      ...body,
      allocatedBy: body.allocatedBy || role,
      role,
    });
    return c.json({ allocation }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

wardsBedsRoutes.post("/transfers", async (c) => {
  const denied = guard(c, "bed:transfer");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveWardBedRole(c.req.header("x-ward-role"));
    const transfer = await transferBed({
      ...body,
      role,
    });
    return c.json({ transfer }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

wardsBedsRoutes.patch("/cleaning", async (c) => {
  const denied = guard(c, "cleaning:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveWardBedRole(c.req.header("x-ward-role"));
    const cleaningLog = await updateCleaningWorkflow({
      ...body,
      responsibleStaff: body.responsibleStaff || role,
    });
    return c.json({ cleaningLog });
  } catch (e) {
    return handleError(c, e);
  }
});
