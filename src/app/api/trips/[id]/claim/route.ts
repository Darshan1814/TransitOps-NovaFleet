import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("DRIVER");
    const { id } = await params;

    // Find the driver profile for the current user
    const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
    if (!driver || driver.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Driver not available or suspended" }, { status: 409 });
    }

    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip || trip.driverId !== null) {
      return NextResponse.json({ error: "Trip is no longer available" }, { status: 409 });
    }

    // Claim the trip in a transaction
    const updatedTrip = await prisma.$transaction(async (tx) => {
      const t = await tx.trip.update({
        where: { id },
        data: {
          driverId: driver.id,
          status: "DISPATCHED",
          dispatchedAt: new Date(),
        },
      });
      
      await tx.driver.update({
        where: { id: driver.id },
        data: { status: "ON_TRIP" },
      });

      await tx.vehicle.update({
        where: { id: t.vehicleId },
        data: { status: "ON_TRIP" },
      });

      return t;
    });

    return NextResponse.json(updatedTrip);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
