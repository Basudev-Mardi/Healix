import { NextResponse } from "next/server";
import {
  authorizeEmergencyRequest,
  handleEmergencyError,
} from "@/lib/emergency/http";
import { resolveEmergencyRole } from "@/lib/emergency/permissions";
import { createEmergencyRegistration } from "@/lib/emergency/store";

export async function POST(request: Request) {
  const denied = authorizeEmergencyRequest(request, "registration:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const role = resolveEmergencyRole(request.headers);
    const result = createEmergencyRegistration({
      ...body,
      registeredBy: body.registeredBy || role,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleEmergencyError(error);
  }
}
