import { NextResponse } from "next/server";
import { authorizeRequest, handleOpdError } from "@/lib/opd/http";
import { updateQueueToken } from "@/lib/opd/store";

export async function PATCH(request: Request) {
  const denied = authorizeRequest(request, "queue:manage");
  if (denied) return denied;

  try {
    const body = await request.json();
    const token = updateQueueToken(body);
    return NextResponse.json({ token });
  } catch (error) {
    return handleOpdError(error);
  }
}
