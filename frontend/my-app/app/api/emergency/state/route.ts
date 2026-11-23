import { NextResponse } from "next/server";
import {
  authorizeEmergencyRequest,
  handleEmergencyError,
} from "@/lib/emergency/http";
import { readEmergencyDb } from "@/lib/emergency/store";

export async function GET(request: Request) {
  const denied = authorizeEmergencyRequest(request, "emergency:read");
  if (denied) return denied;

  try {
    const db = readEmergencyDb();
    return NextResponse.json(db);
  } catch (error) {
    return handleEmergencyError(error);
  }
}
