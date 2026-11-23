import { NextResponse } from "next/server";
import {
  authorizeEmergencyRequest,
  handleEmergencyError,
} from "@/lib/emergency/http";
import { resolveEmergencyRole } from "@/lib/emergency/permissions";
import { saveTriageAssessment } from "@/lib/emergency/store";

export async function POST(request: Request) {
  const denied = authorizeEmergencyRequest(request, "triage:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const role = resolveEmergencyRole(request.headers);
    const result = saveTriageAssessment({
      ...body,
      assessedBy: body.assessedBy || role,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleEmergencyError(error);
  }
}
