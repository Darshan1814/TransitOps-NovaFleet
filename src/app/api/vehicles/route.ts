import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireRole("FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST", "ADMIN");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const region = searchParams.get("region");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.vehicleType = type;
    if (region) where.region = region;

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { trips: true, maintenanceLogs: true } },
      },
    });

    return NextResponse.json(vehicles);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("FLEET_MANAGER", "ADMIN");
    const body = await req.json();

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: body.registrationNumber,
        nameModel: body.nameModel,
        vehicleType: body.vehicleType,
        maxLoadCapacityKg: body.maxLoadCapacityKg,
        odometerKm: body.odometerKm || 0,
        acquisitionCost: body.acquisitionCost,
        region: body.region,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
