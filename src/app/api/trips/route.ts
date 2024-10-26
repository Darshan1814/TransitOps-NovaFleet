import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireRole("FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST", "ADMIN");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const vehicleId = searchParams.get("vehicleId");
    const driverId = searchParams.get("driverId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: { select: { registrationNumber: true, nameModel: true } },
        driver: { select: { fullName: true } },
      },
    });

    return NextResponse.json(trips);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("FLEET_MANAGER", "DRIVER", "ADMIN");
    const body = await req.json();

    // Validate vehicle availability at the query layer
    const vehicle = await prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
    if (!vehicle || vehicle.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Vehicle not available" }, { status: 409 });
    }

    // Validate driver availability (if driverId is provided)
    if (body.driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: body.driverId } });
      if (!driver || driver.status !== "AVAILABLE") {
        return NextResponse.json({ error: "Driver not available" }, { status: 409 });
      }
      if (driver.licenseExpiryDate < new Date()) {
        return NextResponse.json({ error: "Driver license expired" }, { status: 422 });
      }
    }

    // Validate cargo weight
    if (body.cargoWeightKg > Number(vehicle.maxLoadCapacityKg)) {
      return NextResponse.json({ error: `Cargo exceeds vehicle capacity (${vehicle.maxLoadCapacityKg}kg)` }, { status: 422 });
    }

    const trip = await prisma.trip.create({
      data: {
        source: body.source,
        destination: body.destination,
        vehicle: { connect: { id: body.vehicleId } },
        ...(body.driverId ? { driver: { connect: { id: body.driverId } } } : {}),
        cargoWeightKg: body.cargoWeightKg,
        plannedDistanceKm: body.plannedDistanceKm,
        createdBy: user.id,
      } as any,
      include: {
        vehicle: { select: { registrationNumber: true, nameModel: true } },
        driver: { select: { fullName: true } },
      },
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
