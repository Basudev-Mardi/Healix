import { NextResponse } from "next/server";
import {
  authorizeEmergencyRequest,
  handleEmergencyError,
} from "@/lib/emergency/http";
import { createTreatmentRecord } from "@/lib/emergency/store";

export async function POST(request: Request) {
  const denied = authorizeEmergencyRequest(request, "treatment:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const treatment = createTreatmentRecord(body);
    return NextResponse.json({ treatment }, { status: 201 });
  } catch (error) {
    return handleEmergencyError(error);
  }
}
