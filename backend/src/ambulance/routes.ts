import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import {
  hasAmbulancePermission,
  resolveAmbulanceRole,
  type AmbulanceAction,
} from "./permissions.js";
import {
  assignDispatch,
  createEmergencyRequest,
  getAmbulanceState,
  progressDispatch,
  registerDriver,
  registerVehicle,
  updateDriverStatus,
  updateEmergencyRequest,
  updateVehicleStatus,
} from "./service.js";

function guard(c: Context, action: AmbulanceAction) {
  const role = resolveAmbulanceRole(c.req.header("x-ambulance-role"));
  if (!hasAmbulancePermission(role, action)) {
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
      : "Unexpected Ambulance backend error.";
  return c.json({ error: message }, 500);
}

export const ambulanceRoutes = new Hono();

ambulanceRoutes.get("/state", async (c) => {
  const denied = guard(c, "ambulance:read");
  if (denied) return denied;
  try {
    return c.json(await getAmbulanceState());
  } catch (e) {
    return handleError(c, e);
  }
});

ambulanceRoutes.post("/vehicles", async (c) => {
  const denied = guard(c, "ambulance:vehicle:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveAmbulanceRole(c.req.header("x-ambulance-role"));
    const vehicle = await registerVehicle({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ vehicle }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

ambulanceRoutes.patch("/vehicles", async (c) => {
  const denied = guard(c, "ambulance:vehicle:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveAmbulanceRole(c.req.header("x-ambulance-role"));
    const vehicle = await updateVehicleStatus({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ vehicle });
  } catch (e) {
    return handleError(c, e);
  }
});

ambulanceRoutes.post("/drivers", async (c) => {
  const denied = guard(c, "ambulance:driver:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveAmbulanceRole(c.req.header("x-ambulance-role"));
    const driver = await registerDriver({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ driver }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

ambulanceRoutes.patch("/drivers", async (c) => {
  const denied = guard(c, "ambulance:driver:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveAmbulanceRole(c.req.header("x-ambulance-role"));
    const driver = await updateDriverStatus({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ driver });
  } catch (e) {
    return handleError(c, e);
  }
});

ambulanceRoutes.post("/requests", async (c) => {
  const denied = guard(c, "ambulance:request:create");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveAmbulanceRole(c.req.header("x-ambulance-role"));
    const request = await createEmergencyRequest({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ request }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

ambulanceRoutes.patch("/requests", async (c) => {
  const denied = guard(c, "ambulance:dispatch:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveAmbulanceRole(c.req.header("x-ambulance-role"));
    const request = await updateEmergencyRequest({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ request });
  } catch (e) {
    return handleError(c, e);
  }
});

ambulanceRoutes.post("/dispatches", async (c) => {
  const denied = guard(c, "ambulance:dispatch:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveAmbulanceRole(c.req.header("x-ambulance-role"));
    const dispatch = await assignDispatch({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ dispatch }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

ambulanceRoutes.patch("/dispatches", async (c) => {
  const denied = guard(c, "ambulance:trip:update");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveAmbulanceRole(c.req.header("x-ambulance-role"));
    const dispatch = await progressDispatch({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ dispatch });
  } catch (e) {
    return handleError(c, e);
  }
});
