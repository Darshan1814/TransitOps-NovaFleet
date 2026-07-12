"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { Crown, Sparkles, FileCheck, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState("FLEET");
  const [rejectNote, setRejectNote] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { data: proofs, isLoading: proofsLoading } = useQuery({
    queryKey: ["proofs"],
    queryFn: async () => {
      const res = await fetch("/api/proofs");
      if (!res.ok) throw new Error("Failed to fetch proofs");
      return res.json();
    },
  });

  const generateReport = useMutation({
    mutationFn: async (type: string) => {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: type }),
      });
      if (!res.ok) throw new Error("Failed to generate report");
      return res.json();
    },
  });

  const approveProof = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/proofs/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Approved by Admin" }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proofs"] }),
  });

  const rejectProof = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/proofs/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: rejectNote }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proofs"] });
      setRejectingId(null);
      setRejectNote("");
    },
  });

  const pendingProofs = proofs?.filter((p: { status: string }) => p.status === "PENDING") || [];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="System Status" value="Online" icon={Crown} color="glow" />
        <KPICard title="Pending Approvals" value={pendingProofs.length} icon={FileCheck} color="warning" delay={0.05} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Report Generator */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="cosmic-panel p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
              <Sparkles className="w-4 h-4" style={{ color: "var(--accent-glow)" }} />
              AI Executive Reports (Groq)
            </h3>
            <select className="cosmic-select w-auto py-1 px-2 text-xs" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="FLEET">Fleet Operations</option>
              <option value="SAFETY">Safety Audit</option>
              <option value="FINANCE">Financial Summary</option>
            </select>
          </div>
          
          <button 
            onClick={() => generateReport.mutate(reportType)}
            disabled={generateReport.isPending}
            className="btn-primary w-full mb-4"
          >
            {generateReport.isPending ? "Analyzing Database..." : "Generate Insights"}
          </button>

          <div className="flex-1 rounded-xl p-4 overflow-y-auto min-h-[200px]" style={{ background: "var(--bg-void)", border: "1px inset var(--border-subtle)" }}>
            <AnimatePresence mode="wait">
              {generateReport.data ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                    {">"} {generateReport.data.generatedAt} | TYPE: {generateReport.data.metrics.reportType}
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-primary)" }}>
                    {generateReport.data.narrative}
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Click generate to query SQL database and synthesize insights.
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Proof Approvals */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="cosmic-panel p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Pending Document Approvals
          </h3>
          <div className="space-y-3">
            {proofsLoading ? (
              <div className="text-center py-4" style={{ color: "var(--text-tertiary)" }}>Loading...</div>
            ) : pendingProofs.length === 0 ? (
              <div className="text-center py-8" style={{ color: "var(--text-tertiary)" }}>No pending approvals</div>
            ) : (
              pendingProofs.map((proof: { id: string; proofType: string; entityType: string; submittedAt: string; fileUrl: string }) => (
                <div key={proof.id} className="p-3 rounded-xl" style={{ background: "var(--bg-panel-2)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{proof.proofType.replace(/_/g, " ")}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>For: {proof.entityType}</p>
                      <p className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>Submitted: {formatDateTime(proof.submittedAt)}</p>
                      <a href={proof.fileUrl} target="_blank" rel="noreferrer" className="text-xs underline mt-2 inline-block" style={{ color: "var(--accent-glow)" }}>
                        View Document
                      </a>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => approveProof.mutate(proof.id)} className="btn-success text-xs py-1 px-2 h-auto flex justify-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                      </button>
                      <button onClick={() => setRejectingId(proof.id)} className="btn-danger text-xs py-1 px-2 h-auto flex justify-center">
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </button>
                    </div>
                  </div>
                  
                  {rejectingId === proof.id && (
                    <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                      <input 
                        type="text" 
                        placeholder="Reason for rejection..." 
                        className="cosmic-input flex-1 text-xs py-1"
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                      />
                      <button onClick={() => rejectProof.mutate(proof.id)} className="btn-danger text-xs py-1 px-2" disabled={!rejectNote}>
                        Confirm
                      </button>
                      <button onClick={() => setRejectingId(null)} className="btn-secondary text-xs py-1 px-2">Cancel</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
