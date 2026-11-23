import { NextResponse } from "next/server";
import { authorizeRequest, handleOpdError } from "@/lib/opd/http";
import { readOpdDb } from "@/lib/opd/store";

export async function GET(request: Request) {
  const denied = authorizeRequest(request, "patient:read");
  if (denied) return denied;

  try {
    const db = readOpdDb();
    return NextResponse.json(db);
  } catch (error) {
    return handleOpdError(error);
  }
}
