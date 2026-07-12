import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { openMaintenance, RuleEngineError } from "@/lib/ruleEngine";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await requireRole("FLEET_MANAGER", "FINANCIAL_ANALYST", "ADMIN");
    const logs = await prisma.maintenanceLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { vehicle: { select: { registrationNumber: true, nameModel: true } } },
    });
    return NextResponse.json(logs);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("FLEET_MANAGER", "ADMIN");
    const body = await req.json();
    const log = await openMaintenance({
      vehicleId: body.vehicleId,
      title: body.title,
      description: body.description,
      cost: body.cost,
    }, user.id);
    return NextResponse.json(log, { status: 201 });
  } catch (e) {
    if (e instanceof RuleEngineError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
