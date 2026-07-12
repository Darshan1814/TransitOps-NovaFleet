"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, FileText, Download, X } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function FinanceDashboard() {
  const [reportData, setReportData] = useState<any>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: "FINANCE" })
      });
      if (!res.ok) throw new Error("Failed to generate report");
      return res.json();
    },
    onSuccess: (data) => {
      setReportData(data);
      setIsReportOpen(true);
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
  });

  const { data: maintenance } = useQuery({
    queryKey: ["maintenance-logs"],
    queryFn: async () => {
      const res = await fetch("/api/maintenance");
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center" style={{ color: "var(--text-tertiary)" }}>Loading financial data...</div>;
  }

  const metrics = data?.metrics;
  const topVehicles = data?.topVehicles || [];
  const bottomVehicles = data?.bottomVehicles || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Financial Overview</h2>
        <button 
          onClick={() => generateReportMutation.mutate()} 
          disabled={generateReportMutation.isPending}
          className="btn-primary"
        >
          {generateReportMutation.isPending ? (
            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</span>
          ) : (
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Generate AI Report</span>
          )}
        </button>
      </div>

      {isReportOpen && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="cosmic-panel p-6 w-full max-w-2xl bg-[#0D0F16]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--accent-glow)]" />
                Financial AI Report
              </h3>
              <button onClick={() => setIsReportOpen(false)} className="text-[var(--text-tertiary)] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-4 rounded-lg bg-[var(--bg-panel-2)] border border-[var(--border-subtle)] whitespace-pre-wrap text-sm" style={{ color: "var(--text-primary)" }}>
                {reportData.narrative}
              </div>
              <div className="text-xs text-[var(--text-tertiary)] flex justify-between">
                <span>Generated at: {formatDateTime(reportData.generatedAt)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Operational Cost" value={formatCurrency(metrics?.operationalCost || 0)} icon={DollarSign} color="glow" />
        <KPICard title="Total Fuel Cost" value={formatCurrency(metrics?.totalFuelCost || 0)} icon={TrendingUp} color="warning" delay={0.05} />
        <KPICard title="Maintenance Spend" value={formatCurrency(metrics?.totalMaintenanceCost || 0)} icon={TrendingDown} color="danger" delay={0.1} />
        <KPICard title="Fleet ROI Leaders" value={topVehicles.length} icon={DollarSign} color="success" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ROI Performers */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="cosmic-panel p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Vehicle ROI Performance (Top vs Bottom)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...topVehicles, ...bottomVehicles].sort((a, b) => b.roi - a.roi)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="registrationNumber" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: "8px", fontSize: "12px", color: "var(--text-primary)" }}
                  itemStyle={{ color: "var(--text-primary)" }}
                  formatter={(v: number) => [`${v.toFixed(2)}%`, "ROI"]}
                />
                <Bar dataKey="roi">
                  {([...topVehicles, ...bottomVehicles].sort((a, b) => b.roi - a.roi)).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.roi >= 0 ? "var(--success)" : "var(--danger)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-[var(--bg-panel-2)] rounded-lg text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            <strong>Graph Explanation:</strong> This chart compares your fleet's most and least profitable vehicles by ROI (Return on Investment). Green bars indicate positive ROI over operational/maintenance costs, while red bars show vehicles actively losing money. Use this data to determine which vehicles to dispatch or retire.
          </div>
        </motion.div>

        {/* Maintenance Logs (Financial view) */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="cosmic-panel p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Recent Maintenance Spend
          </h3>
          <div className="overflow-x-auto h-64">
            <table className="cosmic-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Description</th>
                  <th>Cost</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {maintenance?.slice(0, 10).map((log: { id: string; vehicle: { registrationNumber: string }; title: string; cost: number; openedAt: string }) => (
                  <tr key={log.id}>
                    <td className="text-xs">{log.vehicle?.registrationNumber}</td>
                    <td className="text-xs">{log.title}</td>
                    <td className="text-xs font-semibold tabular-nums" style={{ color: "var(--danger)" }}>
                      {formatCurrency(Number(log.cost))}
                    </td>
                    <td className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDateTime(log.openedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
