import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import {
  hasRadiologyPermission,
  resolveRadiologyRole,
  type RadiologyAction,
} from "./permissions.js";
import {
  createImagingAppointment,
  createRadiologyRequest,
  getRadiologyState,
  saveRadiologistReport,
  updateImagingAppointment,
  updateRadiologyRequest,
  uploadRadiologyImage,
} from "./service.js";

function guard(c: Context, action: RadiologyAction) {
  const role = resolveRadiologyRole(c.req.header("x-radiology-role"));
  if (!hasRadiologyPermission(role, action)) {
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
      : "Unexpected Radiology backend error.";
  return c.json({ error: message }, 500);
}

export const radiologyRoutes = new Hono();

radiologyRoutes.get("/state", async (c) => {
  const denied = guard(c, "radiology:read");
  if (denied) return denied;
  try {
    return c.json(await getRadiologyState());
  } catch (e) {
    return handleError(c, e);
  }
});

radiologyRoutes.post("/requests", async (c) => {
  const denied = guard(c, "radiology:request:create");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const request = await createRadiologyRequest(body);
    return c.json({ request }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

radiologyRoutes.patch("/requests", async (c) => {
  const denied = guard(c, "radiology:exam:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const request = await updateRadiologyRequest(body);
    return c.json({ request });
  } catch (e) {
    return handleError(c, e);
  }
});

radiologyRoutes.post("/appointments", async (c) => {
  const denied = guard(c, "radiology:appointment:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveRadiologyRole(c.req.header("x-radiology-role"));
    const appointment = await createImagingAppointment({
      ...body,
      staff: body.staff || role,
    });
    return c.json({ appointment }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

radiologyRoutes.patch("/appointments", async (c) => {
  const denied = guard(c, "radiology:appointment:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveRadiologyRole(c.req.header("x-radiology-role"));
    const appointment = await updateImagingAppointment({
      ...body,
      staff: body.staff || role,
    });
    return c.json({ appointment });
  } catch (e) {
    return handleError(c, e);
  }
});

radiologyRoutes.post("/images", async (c) => {
  const denied = guard(c, "radiology:image:upload");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveRadiologyRole(c.req.header("x-radiology-role"));
    const image = await uploadRadiologyImage({
      ...body,
      uploadedBy: body.uploadedBy || role,
    });
    return c.json({ image }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

radiologyRoutes.post("/reports", async (c) => {
  const denied = guard(c, "radiology:report:write");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveRadiologyRole(c.req.header("x-radiology-role"));
    const report = await saveRadiologistReport({
      ...body,
      radiologistName: body.radiologistName || role,
      canFinalize: hasRadiologyPermission(role, "radiology:report:finalize"),
    });
    return c.json({ report }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});
