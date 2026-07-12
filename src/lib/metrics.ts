import { prisma } from "./prisma";
import { Decimal } from "@prisma/client/runtime/library";

export interface FleetMetrics {
  totalVehicles: number;
  availableVehicles: number;
  onTripVehicles: number;
  inShopVehicles: number;
  retiredVehicles: number;
  fleetUtilization: number;
  totalDrivers: number;
  availableDrivers: number;
  onDutyDrivers: number;
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  pendingTrips: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalExpenses: number;
  operationalCost: number;
  avgFuelEfficiency: number;
  licensesExpiringSoon: number;
  pendingApprovals: number;
}

function decimalToNumber(d: Decimal | null | undefined): number {
  if (!d) return 0;
  return Number(d);
}

export async function getFleetMetrics(): Promise<FleetMetrics> {
  const [
    vehicleCounts,
    driverCounts,
    tripCounts,
    fuelCostResult,
    maintenanceCostResult,
    expenseCostResult,
    fuelEfficiency,
    expiringLicenses,
    pendingApprovals,
  ] = await Promise.all([
    // Vehicle counts by status
    prisma.vehicle.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Driver counts
    prisma.driver.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Trip counts by status
    prisma.trip.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Total fuel cost
    prisma.fuelLog.aggregate({
      _sum: { cost: true },
    }),
    // Total maintenance cost
    prisma.maintenanceLog.aggregate({
      _sum: { cost: true },
    }),
    // Total expenses
    prisma.expense.aggregate({
      _sum: { amount: true },
    }),
    // Fuel efficiency: total distance / total fuel for completed trips
    prisma.trip.aggregate({
      where: { status: "COMPLETED", actualDistanceKm: { not: null }, fuelConsumedL: { not: null } },
      _sum: { actualDistanceKm: true, fuelConsumedL: true },
    }),
    // Licenses expiring within 30 days
    prisma.driver.count({
      where: {
        licenseExpiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        status: { not: "SUSPENDED" },
      },
    }),
    // Pending document approvals
    prisma.proofDocument.count({
      where: { status: "PENDING" },
    }),
  ]);

  // Calculate vehicle counts
  const getVehicleCount = (status: string) =>
    vehicleCounts.find((v) => v.status === status)?._count?.id ?? 0;

  const totalVehicles = vehicleCounts.reduce((s, v) => s + (v._count?.id ?? 0), 0);
  const availableVehicles = getVehicleCount("AVAILABLE");
  const onTripVehicles = getVehicleCount("ON_TRIP");
  const inShopVehicles = getVehicleCount("IN_SHOP");
  const retiredVehicles = getVehicleCount("RETIRED");
  const nonRetired = totalVehicles - retiredVehicles;
  const fleetUtilization = nonRetired > 0 ? (onTripVehicles / nonRetired) * 100 : 0;

  // Calculate driver counts
  const getDriverCount = (status: string) =>
    driverCounts.find((d) => d.status === status)?._count?.id ?? 0;

  const totalDrivers = driverCounts.reduce((s, d) => s + (d._count?.id ?? 0), 0);
  const availableDrivers = getDriverCount("AVAILABLE");
  const onDutyDrivers = getDriverCount("AVAILABLE") + getDriverCount("ON_TRIP");

  // Calculate trip counts
  const getTripCount = (status: string) =>
    tripCounts.find((t) => t.status === status)?._count?.id ?? 0;

  const totalTrips = tripCounts.reduce((s, t) => s + (t._count?.id ?? 0), 0);
  const activeTrips = getTripCount("DISPATCHED");
  const completedTrips = getTripCount("COMPLETED");
  const pendingTrips = getTripCount("DRAFT");

  // Calculate costs
  const totalFuelCost = decimalToNumber(fuelCostResult._sum.cost);
  const totalMaintenanceCost = decimalToNumber(maintenanceCostResult._sum.cost);
  const totalExpensesAmount = decimalToNumber(expenseCostResult._sum.amount);
  const operationalCost = totalFuelCost + totalMaintenanceCost + totalExpensesAmount;

  // Fuel efficiency
  const totalDistance = decimalToNumber(fuelEfficiency._sum.actualDistanceKm);
  const totalFuel = decimalToNumber(fuelEfficiency._sum.fuelConsumedL);
  const avgFuelEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0;

  return {
    totalVehicles,
    availableVehicles,
    onTripVehicles,
    inShopVehicles,
    retiredVehicles,
    fleetUtilization: Math.round(fleetUtilization * 100) / 100,
    totalDrivers,
    availableDrivers,
    onDutyDrivers,
    totalTrips,
    activeTrips,
    completedTrips,
    pendingTrips,
    totalFuelCost,
    totalMaintenanceCost,
    totalExpenses: totalExpensesAmount,
    operationalCost,
    avgFuelEfficiency: Math.round(avgFuelEfficiency * 100) / 100,
    licensesExpiringSoon: expiringLicenses,
    pendingApprovals,
  };
}

export interface VehicleROI {
  id: string;
  registrationNumber: string;
  nameModel: string;
  vehicleType: string;
  acquisitionCost: number;
  totalRevenue: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  roi: number;
}

export async function getVehicleROIs(): Promise<VehicleROI[]> {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: {
        where: { status: "COMPLETED" },
        select: { revenue: true },
      },
      fuelLogs: {
        select: { cost: true },
      },
      maintenanceLogs: {
        select: { cost: true },
      },
    },
  });

  return vehicles.map((v) => {
    const totalRevenue = v.trips.reduce((s, t) => s + decimalToNumber(t.revenue), 0);
    const totalFuelCost = v.fuelLogs.reduce((s, f) => s + decimalToNumber(f.cost), 0);
    const totalMaintenanceCost = v.maintenanceLogs.reduce(
      (s, m) => s + decimalToNumber(m.cost),
      0
    );
    const acquisitionCost = decimalToNumber(v.acquisitionCost);
    const roi =
      acquisitionCost > 0
        ? ((totalRevenue - totalFuelCost - totalMaintenanceCost) / acquisitionCost) * 100
        : 0;

    return {
      id: v.id,
      registrationNumber: v.registrationNumber,
      nameModel: v.nameModel,
      vehicleType: v.vehicleType,
      acquisitionCost,
      totalRevenue,
      totalFuelCost,
      totalMaintenanceCost,
      roi: Math.round(roi * 100) / 100,
    };
  });
}
