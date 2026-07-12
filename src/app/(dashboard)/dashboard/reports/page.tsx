"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { Printer } from "lucide-react";

export default function ComprehensiveReport() {
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

  const metrics = data.metrics;
  const vehicleDistribution = data.vehicleDistribution || [];
  const topVehicles = data.topVehicles || [];
  const CHART_COLORS = ["#4ADE80", "#7C8CFF", "#FBBF24", "#F87171"];

  return (
    <div className="space-y-8 pb-12 print-container">
      {/* 
        This style block is critical for the PDF output.
        It forces grayscale and hides the print button when saving as PDF.
      */}
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
            /* removed grayscale to keep charts colorful */
          }
          .print-hide {
            display: none !important;
          }
          /* Force charts to render clearly in print */
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
          }
        }
      `}} />

      <div className="flex justify-between items-center print-hide">
        <div>
          <h2 className="text-2xl font-bold">Comprehensive Operations Report</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Full HTML Visualization & PDF Export</p>
        </div>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
          <Printer className="w-4 h-4" /> Export as PDF
        </button>
      </div>

      <div className="print-container-inner space-y-8">
        {/* Header for Print */}
        <div className="text-center pb-4 border-b border-[var(--border-subtle)]">
          <h1 className="text-2xl font-bold mb-1">TransitOps Executive Report</h1>
          <p className="text-sm">Generated on: {formatDateTime(new Date().toISOString())}</p>
        </div>

        {/* AI Narrative Section */}
        {reportData?.narrative && (
          <div className="cosmic-panel p-6">
            <h3 className="text-lg font-bold mb-4 border-b border-[var(--border-subtle)] pb-2">1. AI Analyst Summary</h3>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {reportData.narrative}
            </div>
          </div>
        )}

        {/* High-Level Metrics */}
        <div className="cosmic-panel p-5">
          <h3 className="text-lg font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">2. Key Performance Indicators</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Total Operational Cost</p>
              <p className="text-xl font-bold">{formatCurrency(metrics.operationalCost || 0)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Fleet Utilization</p>
              <p className="text-xl font-bold">{metrics.fleetUtilization || 0}%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Fuel Efficiency</p>
              <p className="text-xl font-bold">{formatNumber(metrics.avgFuelEfficiency || 0)} km/L</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Active Trips</p>
              <p className="text-xl font-bold">{metrics.activeTrips || 0}</p>
            </div>
          </div>
        </div>

        {/* Visual Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="cosmic-panel p-5">
            <h3 className="text-lg font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">3. Fleet Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleDistribution.filter((d: any) => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                    paddingAngle={5} dataKey="value"
                  >
                    {vehicleDistribution.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: "8px", fontSize: "12px", color: "var(--text-primary)" }}
                    itemStyle={{ color: "var(--text-primary)" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="cosmic-panel p-5">
            <h3 className="text-lg font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">4. Top Vehicle ROI Performers</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVehicles.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="registrationNumber" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: "8px", fontSize: "12px", color: "var(--text-primary)" }}
                    itemStyle={{ color: "var(--text-primary)" }}
                    formatter={(v: number) => [`${v.toFixed(2)}%`, "ROI"]} 
                  />
                  <Bar dataKey="roi" fill="#7C8CFF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
