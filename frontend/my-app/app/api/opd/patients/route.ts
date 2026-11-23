import { NextResponse } from "next/server";
import { authorizeRequest, handleOpdError } from "@/lib/opd/http";
import { readOpdDb, registerPatient } from "@/lib/opd/store";

export async function GET(request: Request) {
  const denied = authorizeRequest(request, "patient:read");
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
    const db = readOpdDb();
    const patients = q
      ? db.patients.filter(
          (p) =>
            p.id.toLowerCase().includes(q) ||
            p.fullName.toLowerCase().includes(q) ||
            p.phone.toLowerCase().includes(q)
        )
      : db.patients;
    return NextResponse.json({ patients });
  } catch (error) {
    return handleOpdError(error);
  }
}

export async function POST(request: Request) {
  const denied = authorizeRequest(request, "patient:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const patient = registerPatient(body);
    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    return handleOpdError(error);
  }
}
