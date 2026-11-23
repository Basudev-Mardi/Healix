import { NextResponse } from "next/server";
import { authorizeRequest, handleOpdError } from "@/lib/opd/http";
import {
  readOpdDb,
  scheduleFollowUp,
  updateFollowUpStatus,
} from "@/lib/opd/store";

export async function GET(request: Request) {
  const denied = authorizeRequest(request, "followup:read");
  if (denied) return denied;

  try {
    const db = readOpdDb();
    return NextResponse.json({ followUps: db.followUps });
  } catch (error) {
    return handleOpdError(error);
  }
}

export async function POST(request: Request) {
  const denied = authorizeRequest(request, "followup:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const result = scheduleFollowUp(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleOpdError(error);
  }
}

export async function PATCH(request: Request) {
  const denied = authorizeRequest(request, "followup:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const followUp = updateFollowUpStatus(body.followUpId, body.status);
    return NextResponse.json({ followUp });
  } catch (error) {
    return handleOpdError(error);
  }
}
