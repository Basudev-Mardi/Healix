import { NextResponse } from "next/server";
import {
  hasOpdPermission,
  resolveRoleFromHeaders,
  type OpdAction,
} from "./permissions";
import { OpdValidationError } from "./store";

export function authorizeRequest(
  request: Request,
  action: OpdAction
): NextResponse | null {
  const role = resolveRoleFromHeaders(request.headers);
  if (!hasOpdPermission(role, action)) {
    return NextResponse.json(
      {
        error: `Access denied: role "${role}" does not have permission for "${action}".`,
      },
      { status: 403 }
    );
  }
  return null;
}

export function handleOpdError(error: unknown): NextResponse {
  if (error instanceof OpdValidationError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }
  const message =
    error instanceof Error ? error.message : "Unexpected OPD server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}
