import { NextResponse } from "next/server";
import { authorizeRequest, handleOpdError } from "@/lib/opd/http";
import {
  createAppointment,
  getDoctorSlotAvailability,
  readOpdDb,
  updateAppointment,
} from "@/lib/opd/store";

export async function GET(request: Request) {
  const denied = authorizeRequest(request, "appointment:read");
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const doctorId = url.searchParams.get("doctorId");
    const date = url.searchParams.get("date");
    const excludeAppointmentId = url.searchParams.get("excludeAppointmentId") ?? undefined;
    const db = readOpdDb();

    if (doctorId && date) {
      const availability = getDoctorSlotAvailability(
        db,
        doctorId,
        date,
        excludeAppointmentId
      );
      return NextResponse.json(availability);
    }

    return NextResponse.json({ appointments: db.appointments });
  } catch (error) {
    return handleOpdError(error);
  }
}

export async function POST(request: Request) {
  const denied = authorizeRequest(request, "appointment:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const appointment = createAppointment(body);
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return handleOpdError(error);
  }
}

export async function PATCH(request: Request) {
  const denied = authorizeRequest(request, "appointment:write");
  if (denied) return denied;

  try {
    const body = await request.json();
    const { appointmentId, ...rest } = body;
    const appointment = updateAppointment(appointmentId, rest);
    return NextResponse.json({ appointment });
  } catch (error) {
    return handleOpdError(error);
  }
}
