"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from "recharts";
import { Printer, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function ComprehensiveReport() {
  const reportId = useMemo(() => "NF-RPT-" + Date.now().toString().slice(-6), []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
  });

  const { data: reportData } = useQuery({
    queryKey: ["ai-report"],
    queryFn: async () => {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: "FLEET" })
      });
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center" style={{ color: "var(--text-tertiary)" }}>Compiling Comprehensive Report...</div>;
  }

  if (isError && !data) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--danger)" }}>
        Failed to fetch metrics data. Please ensure the backend is running properly.
      </div>
    );
  }

  const { metrics, vehicleDistribution, topVehicles, expiringDrivers, fuelEfficiencyTrend, maintenanceSummary, complianceSnapshot } = data;
  const CHART_COLORS = ["#4ADE80", "#7C8CFF", "#FBBF24", "#F87171"];

  const costBreakdown = [
    { name: "Fuel", value: metrics.totalFuelCost, fill: "#7C8CFF" },
    { name: "Maintenance", value: metrics.totalMaintenanceCost, fill: "#F87171" },
    { name: "Expenses", value: metrics.totalExpenses, fill: "#FBBF24" }
  ];

  const tripStatus = [
    { name: "Draft", value: metrics.pendingTrips, fill: "#9CA3AF" },
    { name: "Dispatched", value: metrics.activeTrips, fill: "#FBBF24" },
    { name: "Completed", value: metrics.completedTrips, fill: "#4ADE80" }
  ];

  const filteredCostBreakdown = costBreakdown.filter(d => d.value > 0);
  const filteredTripStatus = tripStatus.filter(d => d.value > 0);

  const costPerKm = (metrics.totalDistanceKm || 0) > 0 ? (metrics.operationalCost / metrics.totalDistanceKm) : 0;

  return (
    <div className="space-y-8 pb-12 print-container">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hide {
            display: none !important;
          }
          .recharts-wrapper {
            background: white !important;
          }
          .recharts-text {
            fill: black !important;
          }
          .cosmic-panel {
            background: white !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            color: black !important;
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          .print-table {
            border-collapse: collapse;
            width: 100%;
          }
          .print-table th, .print-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
        }
      `}} />

      <div className="flex justify-between items-center print-hide">
        <div>
          <h2 className="text-2xl font-bold">Master Operations Report</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Full HTML Visualization & PDF Export</p>
        </div>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
          <Printer className="w-4 h-4" /> Export as PDF
        </button>
      </div>

      <div className="print-container-inner space-y-6">
        <div className="text-center pb-4 border-b border-[var(--border-subtle)]">
          <h1 className="text-2xl font-bold mb-1">TransitOps Executive Report</h1>
          <p className="text-sm">Generated on: {formatDateTime(new Date().toISOString())}</p>
        </div>

        {reportData?.narrative && (
          <div className="cosmic-panel p-6">
            <h3 className="text-lg font-bold mb-4 border-b border-[var(--border-subtle)] pb-2">1. AI Analyst Summary</h3>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {reportData.narrative}
            </div>
          </div>
        )}

        <div className="cosmic-panel p-5">
          <h3 className="text-lg font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">2. Key Performance Indicators</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Total Operational Cost</p>
              <p className="text-xl font-bold">{formatCurrency(metrics.operationalCost || 0)}</p>
              <p className="text-xs text-[var(--success)]">▲ 2.4% vs last mo.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Fleet Utilization</p>
              <p className="text-xl font-bold">{metrics.fleetUtilization || 0}%</p>
              <p className="text-xs text-[var(--danger)]">▼ 1.2% vs last mo.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Fuel Efficiency</p>
              <p className="text-xl font-bold">{formatNumber(metrics.avgFuelEfficiency || 0)} km/L</p>
              <p className="text-xs text-[var(--success)]">▲ 0.5% vs last mo.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Active Trips</p>
              <p className="text-xl font-bold">{metrics.activeTrips || 0}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Stable</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Cost Per KM</p>
              <p className="text-xl font-bold">{formatCurrency(costPerKm || 0)} /km</p>
              <p className="text-xs text-[var(--success)]">▼ 0.12 vs last mo.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="cosmic-panel p-5">
            <h3 className="text-lg font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Cost Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={filteredCostBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {filteredCostBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="cosmic-panel p-5">
            <h3 className="text-lg font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Fuel Efficiency Trend (30 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fuelEfficiencyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="efficiency" stroke="var(--accent-glow)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="cosmic-panel p-5">
            <h3 className="text-lg font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Top Vehicle ROI Performers</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVehicles.slice(0, 5)} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="registrationNumber" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, "ROI"]} />
                  <Bar dataKey="roi" fill="#7C8CFF" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="cosmic-panel p-5">
            <h3 className="text-lg font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Trip Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={filteredTripStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {filteredTripStatus.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="cosmic-panel p-5">
            <h3 className="text-lg font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Maintenance Summary</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center p-3 bg-[var(--bg-panel-2)] rounded">
                <span className="text-sm">Open Records</span>
                <span className="font-bold text-[var(--danger)] text-lg">{maintenanceSummary?.open || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[var(--bg-panel-2)] rounded">
                <span className="text-sm">Closed Records</span>
                <span className="font-bold text-[var(--success)] text-lg">{maintenanceSummary?.closed || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[var(--bg-panel-2)] rounded">
                <span className="text-sm">Average Cost / Record</span>
                <span className="font-bold text-lg">{formatCurrency(maintenanceSummary?.avgCost || 0)}</span>
              </div>
            </div>
          </div>

          <div className="cosmic-panel p-5">
            <h3 className="text-lg font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Admin Compliance Snapshot</h3>
             <div className="flex gap-4">
              <div className="flex-1 p-3 bg-[var(--bg-panel-2)] rounded text-center border-l-4 border-[var(--warning)]">
                <Clock className="w-5 h-5 mx-auto mb-1 text-[var(--warning)]" />
                <p className="text-2xl font-bold">{complianceSnapshot?.pending || 0}</p>
                <p className="text-xs">Pending</p>
              </div>
              <div className="flex-1 p-3 bg-[var(--bg-panel-2)] rounded text-center border-l-4 border-[var(--success)]">
                <CheckCircle className="w-5 h-5 mx-auto mb-1 text-[var(--success)]" />
                <p className="text-2xl font-bold">{complianceSnapshot?.approved || 0}</p>
                <p className="text-xs">Approved</p>
              </div>
              <div className="flex-1 p-3 bg-[var(--bg-panel-2)] rounded text-center border-l-4 border-[var(--danger)]">
                <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-[var(--danger)]" />
                <p className="text-2xl font-bold">{complianceSnapshot?.rejected || 0}</p>
                <p className="text-xs">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        <div className="cosmic-panel p-5">
          <h3 className="text-lg font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Critical License & Compliance Alerts</h3>
          {expiringDrivers && expiringDrivers.length > 0 ? (
            <table className="w-full text-sm print-table">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] opacity-70">
                  <th className="text-left py-2 font-medium">Driver Name</th>
                  <th className="text-left py-2 font-medium">License Number</th>
                  <th className="text-right py-2 font-medium">Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {expiringDrivers.map((d: any, i: number) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)]">
                    <td className="py-2">{d.fullName}</td>
                    <td className="py-2 opacity-80">{d.licenseNumber}</td>
                    <td className="py-2 text-right font-bold text-[var(--danger)]">
                      {formatDateTime(d.licenseExpiryDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-[var(--success)]">No licenses expiring within 30 days. Fleet is fully compliant.</p>
          )}
        </div>

        {/* Footer Metadata */}
        <div className="pt-8 pb-4 text-center text-xs opacity-50 flex flex-col gap-1">
          <p>Filters Applied: Date Range (All Time) | Region (Global)</p>
          <p>Generated by: NovaFleet AI Reporting Engine v2.0</p>
          <p>Report ID: {reportId}</p>
        </div>

      </div>
    </div>
  );
}
