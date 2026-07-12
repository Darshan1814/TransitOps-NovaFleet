import { requireRole } from "@/lib/requireRole";
import { getFleetMetrics, getVehicleROIs } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await requireRole("FLEET_MANAGER", "SAFETY_OFFICER", "FINANCIAL_ANALYST", "ADMIN");
    const body = await req.json();
    const reportType = body.reportType || "FLEET"; // FLEET, SAFETY, FINANCE

    // 1. Compute all metrics from SQL — never trust the LLM with numbers
    const metrics = await getFleetMetrics();
    const vehicleROIs = await getVehicleROIs();

    // Additional data based on report type
    let additionalData: Record<string, unknown> = {};

    if (reportType === "SAFETY") {
      const drivers = await prisma.driver.findMany({
        orderBy: { safetyScore: "asc" },
        take: 10,
        select: { fullName: true, safetyScore: true, status: true, licenseExpiryDate: true },
      });
      additionalData = { driverSafetyScores: drivers };
    }

    if (reportType === "FINANCE") {
      const topROI = vehicleROIs.sort((a, b) => b.roi - a.roi).slice(0, 5);
      const bottomROI = vehicleROIs.sort((a, b) => a.roi - b.roi).slice(0, 5);
      additionalData = { topROIVehicles: topROI, bottomROIVehicles: bottomROI };
    }

    // 2. Build computed metrics object for Groq
    const computedMetrics = {
      reportType,
      generatedAt: new Date().toISOString(),
      fleetUtilization: metrics.fleetUtilization,
      totalVehicles: metrics.totalVehicles,
      availableVehicles: metrics.availableVehicles,
      inShopVehicles: metrics.inShopVehicles,
      activeTrips: metrics.activeTrips,
      completedTrips: metrics.completedTrips,
      totalFuelCost: metrics.totalFuelCost,
      totalMaintenanceCost: metrics.totalMaintenanceCost,
      operationalCost: metrics.operationalCost,
      avgFuelEfficiency: metrics.avgFuelEfficiency,
      licensesExpiringSoon: metrics.licensesExpiringSoon,
      pendingApprovals: metrics.pendingApprovals,
      ...additionalData,
    };

    // 3. Call Groq for narrative (or fallback if no API key)
    let narrative = "";
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            messages: [
              {
                role: "system",
                content:
                  "You are a professional fleet operations analyst writing an executive summary for a formal PDF report. " +
                  "You will be given ONLY pre-computed, verified metrics as JSON. " +
                  "Rules: (1) Never invent, estimate, or alter any number — use the given figures exactly as provided. " +
                  "(2) Write in a formal, concise, black-and-white-report tone suitable for executives and auditors. " +
                  "(3) Structure your response as: a 2-3 sentence Executive Summary, then 3-5 bullet 'Key Observations', " +
                  "then 1-2 sentence 'Recommendation'. " +
                  "(4) ANOMALY DETECTION: If you notice any unusual metrics (e.g., fuel efficiency dropping, high number of pending approvals, or high maintenance costs relative to fuel), explicitly highlight it in a section called 'ANOMALY FLAG'. " +
                  "(5) Output plain text only, no markdown symbols, no emojis.",
              },
              {
                role: "user",
                content: JSON.stringify(computedMetrics),
              },
            ],
            max_tokens: 600,
          }),
        });

        const data = await response.json();
        narrative = data.choices?.[0]?.message?.content || "";
      } catch {
        narrative = "AI narrative generation unavailable. Please review the metrics below.";
      }
    } else {
      // Fallback without Groq
      narrative = generateFallbackNarrative(computedMetrics);
    }

    return NextResponse.json({
      narrative,
      metrics: computedMetrics,
      vehicleROIs,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

function generateFallbackNarrative(metrics: Record<string, unknown>): string {
  const m = metrics as {
    fleetUtilization: number;
    totalVehicles: number;
    operationalCost: number;
    avgFuelEfficiency: number;
    licensesExpiringSoon: number;
    activeTrips: number;
    completedTrips: number;
    inShopVehicles: number;
  };

  return `EXECUTIVE SUMMARY

The fleet is currently operating at ${m.fleetUtilization}% utilization across ${m.totalVehicles} registered vehicles. Total operational costs stand at ₹${m.operationalCost?.toLocaleString("en-IN")} with an average fuel efficiency of ${m.avgFuelEfficiency} km/L.

KEY OBSERVATIONS

- ${m.activeTrips} trip(s) currently in progress, ${m.completedTrips} trips completed to date
- ${m.inShopVehicles} vehicle(s) currently in maintenance
- ${m.licensesExpiringSoon} driver license(s) expiring within 30 days — immediate attention required
- Fleet fuel efficiency averaging ${m.avgFuelEfficiency} km/L across completed trips

RECOMMENDATION

${m.licensesExpiringSoon > 0
    ? `Priority: Address the ${m.licensesExpiringSoon} expiring license(s) to maintain operational capacity.`
    : "All driver licenses are current. Continue monitoring fleet utilization to optimize vehicle allocation."
  }`;
}
