import { NextResponse } from "next/server";
import { authorizeRequest, handleOpdError } from "@/lib/opd/http";
import { registerWalkIn } from "@/lib/opd/store";

export async function POST(request: Request) {
  const denied = authorizeRequest(request, "walkin:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const result = registerWalkIn(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleOpdError(error);
  }
}
