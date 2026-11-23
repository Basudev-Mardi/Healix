import { Hono, type Context } from "hono";
import { HttpError } from "../opd/service.js";
import {
  hasBillingPermission,
  resolveBillingRole,
  type BillingAction,
} from "./permissions.js";
import {
  cancelInvoice,
  collectPayment,
  createInsuranceClaim,
  createInsuranceProvider,
  createInvoice,
  getBillingState,
  processRefund,
  updateInsuranceClaim,
} from "./service.js";

function guard(c: Context, action: BillingAction) {
  const role = resolveBillingRole(c.req.header("x-billing-role"));
  if (!hasBillingPermission(role, action)) {
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
      : "Unexpected Billing backend error.";
  return c.json({ error: message }, 500);
}

export const billingRoutes = new Hono();

billingRoutes.get("/state", async (c) => {
  const denied = guard(c, "billing:read");
  if (denied) return denied;
  try {
    return c.json(await getBillingState());
  } catch (e) {
    return handleError(c, e);
  }
});

billingRoutes.post("/invoices", async (c) => {
  const denied = guard(c, "billing:invoice:create");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBillingRole(c.req.header("x-billing-role"));
    const invoice = await createInvoice({
      ...body,
      createdBy: body.createdBy || role,
      actorRole: role,
    });
    return c.json({ invoice }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

billingRoutes.patch("/invoices/cancel", async (c) => {
  const denied = guard(c, "billing:invoice:cancel");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBillingRole(c.req.header("x-billing-role"));
    const invoice = await cancelInvoice({
      invoiceId: body.invoiceId,
      reason: body.reason,
      actorRole: role,
      actorName: body.actorName || role,
    });
    return c.json({ invoice });
  } catch (e) {
    return handleError(c, e);
  }
});

billingRoutes.post("/payments", async (c) => {
  const denied = guard(c, "billing:payment:collect");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBillingRole(c.req.header("x-billing-role"));
    const payment = await collectPayment({
      ...body,
      receivedBy: body.receivedBy || role,
      actorRole: role,
    });
    return c.json({ payment }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

billingRoutes.post("/providers", async (c) => {
  const denied = guard(c, "billing:insurance:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const provider = await createInsuranceProvider(body);
    return c.json({ provider }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

billingRoutes.post("/claims", async (c) => {
  const denied = guard(c, "billing:insurance:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBillingRole(c.req.header("x-billing-role"));
    const claim = await createInsuranceClaim({
      ...body,
      submittedBy: body.submittedBy || role,
      actorRole: role,
    });
    return c.json({ claim }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

billingRoutes.patch("/claims", async (c) => {
  const denied = guard(c, "billing:insurance:manage");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBillingRole(c.req.header("x-billing-role"));
    const claim = await updateInsuranceClaim({
      ...body,
      staff: body.staff || role,
      actorRole: role,
    });
    return c.json({ claim });
  } catch (e) {
    return handleError(c, e);
  }
});

billingRoutes.post("/refunds", async (c) => {
  const denied = guard(c, "billing:refund:authorize");
  if (denied) return denied;
  try {
    const body = await c.req.json();
    const role = resolveBillingRole(c.req.header("x-billing-role"));
    const refund = await processRefund({
      ...body,
      authorizedBy: body.authorizedBy || role,
      processedBy: body.processedBy || role,
      actorRole: role,
    });
    return c.json({ refund }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});
