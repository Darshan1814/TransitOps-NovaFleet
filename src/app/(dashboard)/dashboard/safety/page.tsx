"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatDateTime, daysUntil } from "@/lib/utils";
import { Shield, ShieldAlert, AlertTriangle, UserX, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function SafetyDashboard() {
  const queryClient = useQueryClient();

  const { data: drivers, isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const res = await fetch("/api/drivers");
      if (!res.ok) throw new Error("Failed to fetch drivers");
      return res.json();
    },
  });

  const suspendDriver = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/drivers/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend" }),
      });
      if (!res.ok) throw new Error("Failed to suspend driver");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drivers"] }),
  });

  const reinstateDriver = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/drivers/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reinstate" }),
      });
      if (!res.ok) throw new Error("Failed to reinstate driver");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drivers"] }),
  });

  if (isLoading) {
    return <div className="p-8 text-center" style={{ color: "var(--text-tertiary)" }}>Loading driver data...</div>;
  }

  const expiringDrivers = drivers?.filter((d: { licenseExpiryDate: string }) => daysUntil(d.licenseExpiryDate) <= 30 && daysUntil(d.licenseExpiryDate) >= 0) || [];
  const expiredDrivers = drivers?.filter((d: { licenseExpiryDate: string }) => daysUntil(d.licenseExpiryDate) < 0) || [];
  const suspendedDrivers = drivers?.filter((d: { status: string }) => d.status === "SUSPENDED") || [];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Drivers" value={drivers?.length || 0} icon={Shield} color="glow" />
        <KPICard title="Expiring Soon (30d)" value={expiringDrivers.length} icon={AlertTriangle} color="warning" delay={0.05} />
        <KPICard title="Expired Licenses" value={expiredDrivers.length} icon={ShieldAlert} color="danger" delay={0.1} />
        <KPICard title="Suspended" value={suspendedDrivers.length} icon={UserX} color="danger" delay={0.15} />
      </div>

      {/* Driver List & Safety Scores */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="cosmic-panel p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          Driver Safety Directory
        </h3>
        <div className="overflow-x-auto">
          <table className="cosmic-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>License No.</th>
                <th>Expiry Date</th>
                <th>Safety Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers?.map((driver: { id: string; fullName: string; licenseNumber: string; licenseExpiryDate: string; safetyScore: number; status: string }) => {
                const daysToExpiry = daysUntil(driver.licenseExpiryDate);
                const isExpiring = daysToExpiry <= 30 && daysToExpiry >= 0;
                const isExpired = daysToExpiry < 0;

                return (
                  <tr key={driver.id}>
                    <td className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{driver.fullName}</td>
                    <td className="text-xs">{driver.licenseNumber}</td>
                    <td className="text-xs">
                      <div className="flex items-center gap-2">
                        {formatDateTime(driver.licenseExpiryDate).split(",")[0]}
                        {isExpired && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">Expired</span>}
                        {isExpiring && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">in {daysToExpiry} days</span>}
                      </div>
                    </td>
                    <td className="text-xs tabular-nums">
                      <div className="flex items-center gap-2">
                        <span style={{ color: Number(driver.safetyScore) >= 90 ? "var(--success)" : Number(driver.safetyScore) >= 75 ? "var(--warning)" : "var(--danger)" }}>
                          {Number(driver.safetyScore).toFixed(1)}
                        </span>
                        <div className="w-16 h-1.5 rounded-full" style={{ background: "var(--bg-panel-2)" }}>
                          <div className="h-full rounded-full" style={{ width: `${driver.safetyScore}%`, background: Number(driver.safetyScore) >= 90 ? "var(--success)" : Number(driver.safetyScore) >= 75 ? "var(--warning)" : "var(--danger)" }} />
                        </div>
                      </div>
                    </td>
                    <td><StatusBadge status={driver.status} /></td>
                    <td>
                      {driver.status !== "SUSPENDED" ? (
                        <button onClick={() => suspendDriver.mutate(driver.id)} className="btn-danger text-[10px] py-1 px-2 h-auto flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Suspend
                        </button>
                      ) : (
                        <button onClick={() => reinstateDriver.mutate(driver.id)} className="btn-success text-[10px] py-1 px-2 h-auto flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Reinstate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
