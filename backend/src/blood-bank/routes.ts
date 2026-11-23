import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import {
  hasBloodBankPermission,
  resolveBloodBankRole,
  type BloodBankAction,
} from "./permissions.js";
import {
  collectBloodUnit,
  createBloodRequest,
  discardBloodUnit,
  getBloodBankState,
  recordCompatibilityTest,
  recordTransfusion,
  registerDonor,
  reserveOrIssueUnit,
  screenBloodUnit,
  separateComponent,
  updateBloodRequestStatus,
  verifyCompatibilityTest,
} from "./service.js";

function guard(c: Context, action: BloodBankAction) {
  const role = resolveBloodBankRole(c.req.header("x-bloodbank-role"));
  if (!hasBloodBankPermission(role, action)) {
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
      : "Unexpected Blood Bank backend error.";
  return c.json({ error: message }, 500);
}

export const bloodBankRoutes = new Hono();

bloodBankRoutes.get("/state", async (c) => {
  const denied = guard(c, "blood:read");
  if (denied) return denied;
  try {
    return c.json(await getBloodBankState());
  } catch (e) {
    return handleError(c, e);
  }
});

bloodBankRoutes.post("/donors", async (c) => {
  const denied = guard(c, "blood:donor:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBloodBankRole(c.req.header("x-bloodbank-role"));
    const donor = await registerDonor({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ donor }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

bloodBankRoutes.post("/units", async (c) => {
  const denied = guard(c, "blood:unit:collect");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBloodBankRole(c.req.header("x-bloodbank-role"));
    const unit = await collectBloodUnit({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ unit }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

bloodBankRoutes.patch("/units/screen", async (c) => {
  const denied = guard(c, "blood:unit:screen");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBloodBankRole(c.req.header("x-bloodbank-role"));
    const unit = await screenBloodUnit({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ unit });
  } catch (e) {
    return handleError(c, e);
  }
});

bloodBankRoutes.post("/components", async (c) => {
  const denied = guard(c, "blood:component:separate");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBloodBankRole(c.req.header("x-bloodbank-role"));
    const unit = await separateComponent({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ unit }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

bloodBankRoutes.post("/requests", async (c) => {
  const denied = guard(c, "blood:request:create");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBloodBankRole(c.req.header("x-bloodbank-role"));
    const request = await createBloodRequest({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ request }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

bloodBankRoutes.patch("/requests", async (c) => {
  const denied = guard(c, "blood:request:approve");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBloodBankRole(c.req.header("x-bloodbank-role"));
    const request = await updateBloodRequestStatus({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ request });
  } catch (e) {
    return handleError(c, e);
  }
});

bloodBankRoutes.post("/compatibility", async (c) => {
  const denied = guard(c, "blood:compatibility:test");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBloodBankRole(c.req.header("x-bloodbank-role"));
    const test = await recordCompatibilityTest({
      ...body,
      actorRole: role,
      testedBy: body.testedBy || role,
    });
    return c.json({ test }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

bloodBankRoutes.patch("/compatibility", async (c) => {
  const denied = guard(c, "blood:compatibility:verify");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBloodBankRole(c.req.header("x-bloodbank-role"));
    const test = await verifyCompatibilityTest({
      ...body,
      actorRole: role,
      verifiedBy: body.verifiedBy || role,
    });
    return c.json({ test });
  } catch (e) {
    return handleError(c, e);
  }
});

bloodBankRoutes.post("/allocate", async (c) => {
  const denied = guard(c, "blood:unit:issue");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBloodBankRole(c.req.header("x-bloodbank-role"));
    const result = await reserveOrIssueUnit({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json(result);
  } catch (e) {
    return handleError(c, e);
  }
});

bloodBankRoutes.post("/transfusions", async (c) => {
  const denied = guard(c, "blood:transfusion:record");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBloodBankRole(c.req.header("x-bloodbank-role"));
    const transfusion = await recordTransfusion({
      ...body,
      actorRole: role,
      administeringStaff: body.administeringStaff || role,
    });
    return c.json({ transfusion }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

bloodBankRoutes.patch("/units/discard", async (c) => {
  const denied = guard(c, "blood:unit:collect");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBloodBankRole(c.req.header("x-bloodbank-role"));
    const unit = await discardBloodUnit({
      ...body,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ unit });
  } catch (e) {
    return handleError(c, e);
  }
});
