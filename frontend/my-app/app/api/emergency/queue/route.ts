import { NextResponse } from "next/server";
import {
  authorizeEmergencyRequest,
  handleEmergencyError,
} from "@/lib/emergency/http";
import { updateEmergencyQueueStatus } from "@/lib/emergency/store";

export async function PATCH(request: Request) {
  const denied = authorizeEmergencyRequest(request, "queue:manage");
  if (denied) return denied;

  try {
    const body = await request.json();
    const registration = updateEmergencyQueueStatus(body);
    return NextResponse.json({ registration });
  } catch (error) {
    return handleEmergencyError(error);
  }
}
