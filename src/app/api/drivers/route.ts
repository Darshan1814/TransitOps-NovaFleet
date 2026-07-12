import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireRole("FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST", "ADMIN");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { trips: true } },
        user: { select: { email: true } },
      },
    });

    return NextResponse.json(drivers);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("FLEET_MANAGER", "SAFETY_OFFICER", "ADMIN", "DRIVER");
    const body = await req.json();

    const driver = await prisma.driver.create({
      data: {
        fullName: body.fullName,
        licenseNumber: body.licenseNumber,
        licenseCategory: body.licenseCategory,
        licenseExpiryDate: new Date(body.licenseExpiryDate),
        contactNumber: body.contactNumber,
        region: body.region,
      },
    });

    return NextResponse.json(driver, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
