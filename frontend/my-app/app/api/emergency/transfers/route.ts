import { NextResponse } from "next/server";
import {
  authorizeEmergencyRequest,
  handleEmergencyError,
} from "@/lib/emergency/http";
import { resolveEmergencyRole } from "@/lib/emergency/permissions";
import {
  createTransferRequest,
  updateTransferStatus,
} from "@/lib/emergency/store";

export async function POST(request: Request) {
  const denied = authorizeEmergencyRequest(request, "transfer:request");
  if (denied) return denied;

  try {
    const body = await request.json();
    const role = resolveEmergencyRole(request.headers);
    const transfer = createTransferRequest({
      ...body,
      requestedBy: body.requestedBy || role,
    });
    return NextResponse.json({ transfer }, { status: 201 });
  } catch (error) {
    return handleEmergencyError(error);
  }
}

export async function PATCH(request: Request) {
  const denied = authorizeEmergencyRequest(request, "transfer:approve");
  if (denied) return denied;

  try {
    const body = await request.json();
    const transfer = updateTransferStatus(body);
    return NextResponse.json({ transfer });
  } catch (error) {
    return handleEmergencyError(error);
  }
}
