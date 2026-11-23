import { NextResponse } from "next/server";
import { authorizeRequest, handleOpdError } from "@/lib/opd/http";
import { generateTokenForAppointment, readOpdDb } from "@/lib/opd/store";

export async function GET(request: Request) {
  const denied = authorizeRequest(request, "token:read");
  if (denied) return denied;

  try {
    const db = readOpdDb();
    return NextResponse.json({ tokens: db.tokens });
  } catch (error) {
    return handleOpdError(error);
  }
}

export async function POST(request: Request) {
  const denied = authorizeRequest(request, "token:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const result = generateTokenForAppointment(
      body.appointmentId,
      body.priority
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleOpdError(error);
  }
}
