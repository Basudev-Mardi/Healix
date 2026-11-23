import { NextResponse } from "next/server";
import {
  authorizeEmergencyRequest,
  handleEmergencyError,
} from "@/lib/emergency/http";
import { resolveEmergencyRole } from "@/lib/emergency/permissions";
import { saveTraumaRecord, updateTraumaProgress } from "@/lib/emergency/store";

export async function POST(request: Request) {
  const denied = authorizeEmergencyRequest(request, "trauma:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const role = resolveEmergencyRole(request.headers);
    const trauma = saveTraumaRecord({
      ...body,
      recordedBy: body.recordedBy || role,
    });
    return NextResponse.json({ trauma }, { status: 201 });
  } catch (error) {
    return handleEmergencyError(error);
  }
}

export async function PATCH(request: Request) {
  const denied = authorizeEmergencyRequest(request, "trauma:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const trauma = updateTraumaProgress(body.traumaId, body.treatmentProgress);
    return NextResponse.json({ trauma });
  } catch (error) {
    return handleEmergencyError(error);
  }
}
