import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import {
  hasIcuPermission,
  resolveIcuRole,
  type IcuAction,
} from "./permissions.js";
import {
  createCareNote,
  createIcuAdmission,
  createIcuDisposition,
  createMonitoringRecord,
  createVentilatorRecord,
  getIcuState,
  prescribeMedication,
  recordVitalSigns,
  updateIcuDisposition,
  updateMedicationAdministration,
  updateVitalThresholds,
} from "./service.js";

function guard(c: Context, action: IcuAction) {
  const role = resolveIcuRole(c.req.header("x-icu-role"));
  if (!hasIcuPermission(role, action)) {
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
    error instanceof Error ? error.message : "Unexpected ICU backend error.";
  return c.json({ error: message }, 500);
}

export const icuRoutes = new Hono();

icuRoutes.get("/state", async (c) => {
  const denied = guard(c, "icu:read");
  if (denied) return denied;
  try {
    return c.json(await getIcuState());
  } catch (e) {
    return handleError(c, e);
  }
});

icuRoutes.post("/admissions", async (c) => {
  const denied = guard(c, "icu:admit");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    return c.json(await createIcuAdmission(body), 201);
  } catch (e) {
    return handleError(c, e);
  }
});

icuRoutes.post("/monitoring", async (c) => {
  const denied = guard(c, "icu:monitor");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveIcuRole(c.req.header("x-icu-role"));
    const record = await createMonitoringRecord({
      ...body,
      responsibleStaff: body.responsibleStaff || role,
    });
    return c.json({ record }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

icuRoutes.post("/vitals", async (c) => {
  const denied = guard(c, "icu:vitals");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveIcuRole(c.req.header("x-icu-role"));
    const vital = await recordVitalSigns({
      ...body,
      responsibleStaff: body.responsibleStaff || role,
    });
    return c.json({ vital }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

icuRoutes.patch("/thresholds", async (c) => {
  const denied = guard(c, "icu:thresholds");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const thresholds = await updateVitalThresholds(body);
    return c.json({ thresholds });
  } catch (e) {
    return handleError(c, e);
  }
});

icuRoutes.post("/care-notes", async (c) => {
  const denied = guard(c, "icu:notes");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveIcuRole(c.req.header("x-icu-role"));
    const note = await createCareNote({
      ...body,
      authorName: body.authorName || role,
      authorRole: role,
    });
    return c.json({ note }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

icuRoutes.post("/ventilators", async (c) => {
  const denied = guard(c, "icu:ventilator");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveIcuRole(c.req.header("x-icu-role"));
    const record = await createVentilatorRecord({
      ...body,
      responsibleStaff: body.responsibleStaff || role,
    });
    return c.json({ record }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

icuRoutes.post("/medications", async (c) => {
  const denied = guard(c, "icu:meds:prescribe");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const medication = await prescribeMedication(body);
    return c.json({ medication }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

icuRoutes.patch("/medications", async (c) => {
  const denied = guard(c, "icu:meds:administer");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveIcuRole(c.req.header("x-icu-role"));
    const medication = await updateMedicationAdministration({
      ...body,
      administeringStaff: body.administeringStaff || role,
    });
    return c.json({ medication });
  } catch (e) {
    return handleError(c, e);
  }
});

icuRoutes.post("/dispositions", async (c) => {
  const denied = guard(c, "icu:disposition:request");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const disposition = await createIcuDisposition(body);
    return c.json({ disposition }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

icuRoutes.patch("/dispositions", async (c) => {
  const denied = guard(c, "icu:disposition:approve");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveIcuRole(c.req.header("x-icu-role"));
    const disposition = await updateIcuDisposition({
      ...body,
      approvedBy: body.approvedBy || role,
    });
    return c.json({ disposition });
  } catch (e) {
    return handleError(c, e);
  }
});
