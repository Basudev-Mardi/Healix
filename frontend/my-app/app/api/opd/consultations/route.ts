import { NextResponse } from "next/server";
import { authorizeRequest, handleOpdError } from "@/lib/opd/http";
import { readOpdDb, saveConsultation } from "@/lib/opd/store";

export async function GET(request: Request) {
  const denied = authorizeRequest(request, "history:read");
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const patientId = url.searchParams.get("patientId");
    const db = readOpdDb();
    const consultations = patientId
      ? db.consultations.filter((c) => c.patientId === patientId)
      : db.consultations;
    return NextResponse.json({ consultations });
  } catch (error) {
    return handleOpdError(error);
  }
}

export async function POST(request: Request) {
  const denied = authorizeRequest(request, "consultation:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const consultation = saveConsultation(body);
    return NextResponse.json({ consultation }, { status: 201 });
  } catch (error) {
    return handleOpdError(error);
  }
}
