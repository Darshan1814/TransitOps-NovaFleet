"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatDateTime, daysUntil } from "@/lib/utils";
import { Shield, ShieldAlert, AlertTriangle, UserX, CheckCircle, XCircle, Plus, X } from "lucide-react";
import { motion } from "framer-motion";

export default function SafetyDashboard() {
  const queryClient = useQueryClient();
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driverForm, setDriverForm] = useState({
    fullName: "", licenseNumber: "", licenseCategory: "Class A", licenseExpiryDate: "", contactNumber: "", region: "NA"
  });

  const addDriverMutation = useMutation({
    mutationFn: async (newDriver: any) => {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDriver),
      });
      if (!res.ok) throw new Error("Failed to add driver");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setIsAddDriverOpen(false);
      setDriverForm({ fullName: "", licenseNumber: "", licenseCategory: "Class A", licenseExpiryDate: "", contactNumber: "", region: "NA" });
    },
  });

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await addDriverMutation.mutateAsync(driverForm);
    setIsSubmitting(false);
  };

  const { data: drivers, isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const res = await fetch("/api/drivers");
      if (!res.ok) throw new Error("Failed to fetch drivers");
      return res.json();
    },
  });

  const { data: proofs } = useQuery({
    queryKey: ["proofs"],
    queryFn: async () => {
      const res = await fetch("/api/proofs");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const approveProofMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/proofs/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proofs"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });

  const rejectProofMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/proofs/${id}/reject`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proofs"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
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
  const pendingProofs = proofs?.filter((p: any) => p.status === "PENDING" && p.entityType === "DRIVER") || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Safety Overview</h2>
        <button onClick={() => setIsAddDriverOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Register Driver
        </button>
      </div>

      {isAddDriverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="cosmic-panel p-6 w-full max-w-lg bg-[#0D0F16]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Register New Driver</h3>
              <button onClick={() => setIsAddDriverOpen(false)} className="text-[var(--text-tertiary)] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddDriver} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="cosmic-label">Full Name</label>
                  <input type="text" required className="cosmic-input" value={driverForm.fullName} onChange={e => setDriverForm({...driverForm, fullName: e.target.value})} placeholder="Alex Smith" />
                </div>
                <div>
                  <label className="cosmic-label">License Number</label>
                  <input type="text" required className="cosmic-input" value={driverForm.licenseNumber} onChange={e => setDriverForm({...driverForm, licenseNumber: e.target.value})} placeholder="DL-12345" />
                </div>
                <div>
                  <label className="cosmic-label">License Category</label>
                  <select className="cosmic-select" value={driverForm.licenseCategory} onChange={e => setDriverForm({...driverForm, licenseCategory: e.target.value})}>
                    <option value="Class A">Class A (Commercial)</option>
                    <option value="Class B">Class B (Heavy)</option>
                    <option value="Class C">Class C (Standard)</option>
                  </select>
                </div>
                <div>
                  <label className="cosmic-label">Expiry Date</label>
                  <input type="date" required className="cosmic-input" value={driverForm.licenseExpiryDate} onChange={e => setDriverForm({...driverForm, licenseExpiryDate: e.target.value})} />
                </div>
                <div>
                  <label className="cosmic-label">Contact Number</label>
                  <input type="text" required className="cosmic-input" value={driverForm.contactNumber} onChange={e => setDriverForm({...driverForm, contactNumber: e.target.value})} placeholder="+1 555-0123" />
                </div>
                <div>
                  <label className="cosmic-label">Region</label>
                  <select className="cosmic-select" value={driverForm.region} onChange={e => setDriverForm({...driverForm, region: e.target.value})}>
                    <option value="NA">North America</option>
                    <option value="EU">Europe</option>
                    <option value="APAC">APAC</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddDriverOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? "Registering..." : "Register Driver"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Drivers" value={drivers?.length || 0} icon={Shield} color="glow" />
        <KPICard title="Expiring Soon (30d)" value={expiringDrivers.length} icon={AlertTriangle} color="warning" delay={0.05} />
        <KPICard title="Expired Licenses" value={expiredDrivers.length} icon={ShieldAlert} color="danger" delay={0.1} />
        <KPICard title="Suspended" value={suspendedDrivers.length} icon={UserX} color="danger" delay={0.15} />
      </div>

      {/* Pending Verifications */}
      {pendingProofs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="cosmic-panel p-5 border border-[var(--accent-glow)]">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Pending Driver Verifications
          </h3>
          <div className="space-y-3">
            {pendingProofs.map((proof: any) => {
              const driver = drivers?.find((d: any) => d.id === proof.entityId);
              return (
                <div key={proof.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-panel-2)]">
                  <div className="flex gap-4 items-center">
                    {proof.fileUrl?.startsWith('data:image') && (
                      <img src={proof.fileUrl} alt="Document" className="w-16 h-16 object-cover rounded border border-[var(--border-subtle)]" />
                    )}
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{driver?.fullName || 'Unknown Driver'}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>License: {driver?.licenseNumber}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Submitted: {formatDateTime(proof.submittedAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {proof.fileUrl?.startsWith('data:image') && (
                      <button onClick={() => setSelectedDocUrl(proof.fileUrl)} className="btn-secondary text-xs px-3">
                        View Document
                      </button>
                    )}
                    <button 
                      onClick={() => approveProofMutation.mutate(proof.id)} 
                      disabled={approveProofMutation.isPending || rejectProofMutation.isPending}
                      className="btn-success text-xs"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </button>
                    <button 
                      onClick={() => rejectProofMutation.mutate(proof.id)} 
                      disabled={approveProofMutation.isPending || rejectProofMutation.isPending}
                      className="btn-danger text-xs bg-red-500/20 text-red-500 hover:bg-red-500/30"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {selectedDocUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" 
          onClick={() => setSelectedDocUrl(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setSelectedDocUrl(null); }}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto">
            <button className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70" onClick={() => setSelectedDocUrl(null)}>
              <X className="w-6 h-6" />
            </button>
            <img src={selectedDocUrl} alt="Document Verification" className="w-full h-auto rounded-xl border border-[var(--border-subtle)]" />
          </div>
        </div>
      )}

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
