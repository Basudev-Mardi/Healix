import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import {
  hasPharmacyPermission,
  resolvePharmacyRole,
  type PharmacyAction,
} from "./permissions.js";
import {
  adjustBatchStock,
  createBatch,
  createMedicine,
  createPrescription,
  createSupplier,
  dispenseMedicine,
  getPharmacyState,
  processPrescription,
  updateBatchExpiryStatus,
  updateMedicine,
  updateSupplier,
} from "./service.js";

function guard(c: Context, action: PharmacyAction) {
  const role = resolvePharmacyRole(c.req.header("x-pharmacy-role"));
  if (!hasPharmacyPermission(role, action)) {
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
      : "Unexpected Pharmacy backend error.";
  return c.json({ error: message }, 500);
}

export const pharmacyRoutes = new Hono();

pharmacyRoutes.get("/state", async (c) => {
  const denied = guard(c, "pharmacy:read");
  if (denied) return denied;
  try {
    return c.json(await getPharmacyState());
  } catch (e) {
    return handleError(c, e);
  }
});

pharmacyRoutes.post("/medicines", async (c) => {
  const denied = guard(c, "pharmacy:catalog:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const medicine = await createMedicine(body);
    return c.json({ medicine }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

pharmacyRoutes.patch("/medicines", async (c) => {
  const denied = guard(c, "pharmacy:catalog:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const medicine = await updateMedicine(body);
    return c.json({ medicine });
  } catch (e) {
    return handleError(c, e);
  }
});

pharmacyRoutes.post("/prescriptions", async (c) => {
  const denied = guard(c, "pharmacy:prescription:create");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const prescription = await createPrescription(body);
    return c.json({ prescription }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

pharmacyRoutes.patch("/prescriptions", async (c) => {
  const denied = guard(c, "pharmacy:prescription:process");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolvePharmacyRole(c.req.header("x-pharmacy-role"));
    const prescription = await processPrescription({
      ...body,
      staff: body.staff || role,
    });
    return c.json({ prescription });
  } catch (e) {
    return handleError(c, e);
  }
});

pharmacyRoutes.post("/dispense", async (c) => {
  const denied = guard(c, "pharmacy:dispense");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolvePharmacyRole(c.req.header("x-pharmacy-role"));
    const result = await dispenseMedicine({
      ...body,
      dispensedBy: body.dispensedBy || role,
    });
    return c.json(result, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

pharmacyRoutes.post("/batches", async (c) => {
  const denied = guard(c, "pharmacy:batch:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolvePharmacyRole(c.req.header("x-pharmacy-role"));
    const batch = await createBatch({
      ...body,
      performedBy: body.performedBy || role,
    });
    return c.json({ batch }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

pharmacyRoutes.patch("/stock", async (c) => {
  const denied = guard(c, "pharmacy:stock:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolvePharmacyRole(c.req.header("x-pharmacy-role"));
    const batch = await adjustBatchStock({
      ...body,
      performedBy: body.performedBy || role,
    });
    return c.json({ batch });
  } catch (e) {
    return handleError(c, e);
  }
});

pharmacyRoutes.patch("/expiry", async (c) => {
  const denied = guard(c, "pharmacy:expiry:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolvePharmacyRole(c.req.header("x-pharmacy-role"));
    const batch = await updateBatchExpiryStatus({
      ...body,
      staff: body.staff || role,
    });
    return c.json({ batch });
  } catch (e) {
    return handleError(c, e);
  }
});

pharmacyRoutes.post("/suppliers", async (c) => {
  const denied = guard(c, "pharmacy:supplier:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const supplier = await createSupplier(body);
    return c.json({ supplier }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

pharmacyRoutes.patch("/suppliers", async (c) => {
  const denied = guard(c, "pharmacy:supplier:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const supplier = await updateSupplier(body);
    return c.json({ supplier });
  } catch (e) {
    return handleError(c, e);
  }
});
