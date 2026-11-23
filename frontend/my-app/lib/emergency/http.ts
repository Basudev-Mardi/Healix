import { NextResponse } from "next/server";
import {
  hasEmergencyPermission,
  resolveEmergencyRole,
  type EmergencyAction,
} from "./permissions";
import { EmergencyValidationError } from "./store";

export function authorizeEmergencyRequest(
  request: Request,
  action: EmergencyAction
): NextResponse | null {
  const role = resolveEmergencyRole(request.headers);
  if (!hasEmergencyPermission(role, action)) {
    return NextResponse.json(
      {
        error: `Access denied: role "${role}" does not have permission for "${action}".`,
      },
      { status: 403 }
    );
  }
  return null;
}

export function handleEmergencyError(error: unknown): NextResponse {
  if (error instanceof EmergencyValidationError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  const message =
    error instanceof Error
      ? error.message
      : "Unexpected Emergency Management server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}
