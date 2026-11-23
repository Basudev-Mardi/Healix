import { NextResponse } from "next/server";
import {
  authorizeEmergencyRequest,
  handleEmergencyError,
} from "@/lib/emergency/http";
import { resolveEmergencyRole } from "@/lib/emergency/permissions";
import {
  createCriticalAlert,
  updateCriticalAlert,
} from "@/lib/emergency/store";

export async function POST(request: Request) {
  const denied = authorizeEmergencyRequest(request, "alert:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const role = resolveEmergencyRole(request.headers);
    const alert = createCriticalAlert({
      ...body,
      triggeredBy: body.triggeredBy || role,
    });
    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    return handleEmergencyError(error);
  }
}

export async function PATCH(request: Request) {
  const denied = authorizeEmergencyRequest(request, "alert:acknowledge");
  if (denied) return denied;

  try {
    const body = await request.json();
    const role = resolveEmergencyRole(request.headers);
    const alert = updateCriticalAlert({
      ...body,
      actor: body.actor || role,
    });
    return NextResponse.json({ alert });
  } catch (error) {
    return handleEmergencyError(error);
  }
}
