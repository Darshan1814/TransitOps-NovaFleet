import { prisma } from "@/lib/prisma";
import { getFleetMetrics, getVehicleROIs } from "@/lib/metrics";
import { requireRole } from "@/lib/requireRole";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireRole("FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST", "ADMIN");
    const metrics = await getFleetMetrics();
    const vehicleROIs = await getVehicleROIs();

    // Recent activity (from audit logs)
    const recentActivity = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Vehicle status distribution for charts
    const vehicleDistribution = [
      { name: "Available", value: metrics.availableVehicles, fill: "var(--success)" },
      { name: "On Trip", value: metrics.onTripVehicles, fill: "var(--accent-glow)" },
      { name: "In Shop", value: metrics.inShopVehicles, fill: "var(--warning)" },
      { name: "Retired", value: metrics.retiredVehicles, fill: "var(--danger)" },
    ];

    // Top/Bottom ROI vehicles
    const sortedROIs = [...vehicleROIs].sort((a, b) => b.roi - a.roi);
    const topVehicles = sortedROIs.slice(0, 3);
    const bottomVehicles = sortedROIs.slice(-3).reverse();

    return NextResponse.json({
      metrics,
      vehicleDistribution,
      topVehicles,
      bottomVehicles,
      recentActivity,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
