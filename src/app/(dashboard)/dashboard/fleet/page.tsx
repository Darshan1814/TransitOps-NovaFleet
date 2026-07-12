"use client";

import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";
import {
  Truck, Users, Wrench, Rocket, Clock, Gauge,
  TrendingUp, Activity, FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

export default function FleetDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
  });

  const { data: trips } = useQuery({
    queryKey: ["trips-active"],
    queryFn: async () => {
      const res = await fetch("/api/trips?status=DISPATCHED");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: allTrips } = useQuery({
    queryKey: ["trips-all"],
    queryFn: async () => {
      const res = await fetch("/api/trips");
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cosmic-panel p-5 h-32 skeleton" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const vehicleDistribution = data?.vehicleDistribution || [];
  const topVehicles = data?.topVehicles || [];
  const bottomVehicles = data?.bottomVehicles || [];
  const recentActivity = data?.recentActivity || [];

  const CHART_COLORS = ["#4ADE80", "#7C8CFF", "#FBBF24", "#F87171"];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Vehicles"
          value={metrics?.totalVehicles || 0}
          icon={Truck}
          color="glow"
          delay={0}
        />
        <KPICard
          title="Available"
          value={metrics?.availableVehicles || 0}
          icon={Truck}
          color="success"
          delay={0.05}
        />
        <KPICard
          title="In Maintenance"
          value={metrics?.inShopVehicles || 0}
          icon={Wrench}
          color="warning"
          delay={0.1}
        />
        <KPICard
          title="Active Trips"
          value={metrics?.activeTrips || 0}
          icon={Rocket}
          color="glow"
          delay={0.15}
        />
        <KPICard
          title="Pending Trips"
          value={metrics?.pendingTrips || 0}
          icon={Clock}
          color="gold"
          delay={0.2}
        />
        <KPICard
          title="Fleet Utilization"
          value={`${metrics?.fleetUtilization || 0}%`}
          icon={Gauge}
          color="glow"
          delay={0.25}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Vehicle Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="cosmic-panel p-5"
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Vehicle Status Distribution
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleDistribution.filter((d: {value: number}) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {vehicleDistribution.map((_: unknown, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-panel)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {vehicleDistribution.map((d: {name: string, value: number}, i: number) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Vehicles by ROI */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="cosmic-panel p-5"
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Top Vehicles by ROI
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVehicles} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickFormatter={(v: number) => `${v}%`} />
                <YAxis type="category" dataKey="registrationNumber" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} width={80} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: "8px", fontSize: "12px", color: "var(--text-primary)" }}
                  formatter={(v: number) => [`${v.toFixed(2)}%`, "ROI"]}
                />
                <Bar dataKey="roi" fill="#4ADE80" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cost Overview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="cosmic-panel p-5"
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Operational Costs
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Total Fuel Cost</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(metrics?.totalFuelCost || 0)}
              </span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "var(--bg-panel-2)" }}>
              <div className="h-full rounded-full" style={{ width: `${metrics?.totalFuelCost ? (metrics.totalFuelCost / (metrics.operationalCost || 1)) * 100 : 0}%`, background: "var(--accent-glow)" }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Total Maintenance</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(metrics?.totalMaintenanceCost || 0)}
              </span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "var(--bg-panel-2)" }}>
              <div className="h-full rounded-full" style={{ width: `${metrics?.totalMaintenanceCost ? (metrics.totalMaintenanceCost / (metrics.operationalCost || 1)) * 100 : 0}%`, background: "var(--warning)" }} />
            </div>
            <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Total Operational</span>
              <span className="text-base font-bold tabular-nums" style={{ color: "var(--accent-gold)" }}>
                {formatCurrency(metrics?.operationalCost || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Fuel Efficiency</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--success)" }}>
                {formatNumber(metrics?.avgFuelEfficiency || 0)} km/L
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Active Trips + Activity Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Active Trips Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="cosmic-panel p-5 xl:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
              Trips In Progress
            </h3>
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(124,140,255,0.1)", color: "var(--accent-glow)" }}>
              {trips?.length || 0} active
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="cosmic-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Cargo</th>
                  <th>Distance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(!trips || trips.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8" style={{ color: "var(--text-tertiary)" }}>
                      No active trips
                    </td>
                  </tr>
                ) : (
                  trips.map((trip: { id: string; source: string; destination: string; vehicle: { registrationNumber: string }; driver: { fullName: string }; cargoWeightKg: number; plannedDistanceKm: number; status: string }) => (
                    <tr key={trip.id}>
                      <td>
                        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{trip.source}</span>
                        <span className="text-xs mx-1" style={{ color: "var(--text-tertiary)" }}>→</span>
                        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{trip.destination}</span>
                      </td>
                      <td className="text-xs">{trip.vehicle?.registrationNumber}</td>
                      <td className="text-xs">{trip.driver?.fullName}</td>
                      <td className="text-xs tabular-nums">{formatNumber(Number(trip.cargoWeightKg), 0)} kg</td>
                      <td className="text-xs tabular-nums">{formatNumber(Number(trip.plannedDistanceKm), 0)} km</td>
                      <td><StatusBadge status={trip.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="cosmic-panel p-5"
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            <Activity className="w-4 h-4 inline mr-2" style={{ color: "var(--accent-glow)" }} />
            Activity Feed
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: "var(--text-tertiary)" }}>No recent activity</p>
            ) : (
              recentActivity.map((a: { id: string; action: string; tableName: string; createdAt: string }) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg transition-colors"
                  style={{ background: "var(--bg-panel-2)" }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(124,140,255,0.1)" }}
                  >
                    <FileText className="w-3.5 h-3.5" style={{ color: "var(--accent-glow)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {a.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {a.tableName} · {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* All Trips Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="cosmic-panel p-5"
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          All Trips
        </h3>
        <div className="overflow-x-auto">
          <table className="cosmic-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Cargo</th>
                <th>Distance</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {(!allTrips || allTrips.length === 0) ? (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ color: "var(--text-tertiary)" }}>No trips found</td>
                </tr>
              ) : (
                allTrips.slice(0, 20).map((trip: { id: string; source: string; destination: string; vehicle: { registrationNumber: string }; driver: { fullName: string }; cargoWeightKg: number; plannedDistanceKm: number; status: string; createdAt: string }) => (
                  <tr key={trip.id}>
                    <td>
                      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{trip.source}</span>
                      <span className="text-xs mx-1" style={{ color: "var(--text-tertiary)" }}>→</span>
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{trip.destination}</span>
                    </td>
                    <td className="text-xs">{trip.vehicle?.registrationNumber}</td>
                    <td className="text-xs">{trip.driver?.fullName}</td>
                    <td className="text-xs tabular-nums">{formatNumber(Number(trip.cargoWeightKg), 0)} kg</td>
                    <td className="text-xs tabular-nums">{formatNumber(Number(trip.plannedDistanceKm), 0)} km</td>
                    <td><StatusBadge status={trip.status} /></td>
                    <td className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDateTime(trip.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
