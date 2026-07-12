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

    // 1. Expiring Drivers
    const expiringDrivers = await prisma.driver.findMany({
      where: {
        licenseExpiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        status: { not: "SUSPENDED" },
      },
      select: { fullName: true, licenseExpiryDate: true, licenseNumber: true },
    });

    // 2. Fuel Efficiency Trend (Last 7 Days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTrips = await prisma.trip.findMany({
      where: { status: "COMPLETED", endDate: { gte: thirtyDaysAgo }, actualDistanceKm: { not: null }, fuelConsumedL: { not: null } },
      select: { endDate: true, actualDistanceKm: true, fuelConsumedL: true },
      orderBy: { endDate: "asc" }
    });
    
    // Group by day for the trend chart
    const fuelTrendMap = new Map<string, { dist: number, fuel: number }>();
    recentTrips.forEach(t => {
      if (!t.endDate) return;
      const day = t.endDate.toISOString().split("T")[0];
      const current = fuelTrendMap.get(day) || { dist: 0, fuel: 0 };
      current.dist += Number(t.actualDistanceKm);
      current.fuel += Number(t.fuelConsumedL);
      fuelTrendMap.set(day, current);
    });
    const fuelEfficiencyTrend = Array.from(fuelTrendMap.entries()).map(([date, data]) => ({
      date: date.substring(5), // MM-DD
      efficiency: data.fuel > 0 ? Number((data.dist / data.fuel).toFixed(2)) : 0
    }));

    // 3. Maintenance Summary
    const maintenanceLogs = await prisma.maintenanceLog.findMany({
      select: { status: true, cost: true }
    });
    const maintenanceSummary = {
      open: maintenanceLogs.filter(l => l.status === "OPEN").length,
      closed: maintenanceLogs.filter(l => l.status === "COMPLETED").length,
      avgCost: maintenanceLogs.length > 0 ? maintenanceLogs.reduce((s, l) => s + Number(l.cost || 0), 0) / maintenanceLogs.length : 0
    };

    // 4. Admin Compliance
    const complianceDocs = await prisma.proofDocument.groupBy({
      by: ["status"],
      _count: { id: true }
    });
    const complianceSnapshot = {
      pending: complianceDocs.find(c => c.status === "PENDING")?._count.id || 0,
      approved: complianceDocs.find(c => c.status === "APPROVED")?._count.id || 0,
      rejected: complianceDocs.find(c => c.status === "REJECTED")?._count.id || 0,
    };

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
      expiringDrivers,
      fuelEfficiencyTrend,
      maintenanceSummary,
      complianceSnapshot
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
