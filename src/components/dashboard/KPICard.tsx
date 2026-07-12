"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "glow" | "gold" | "success" | "warning" | "danger" | "default";
  delay?: number;
}

const colorMap = {
  glow: { bg: "rgba(124,140,255,0.1)", border: "rgba(124,140,255,0.2)", icon: "var(--accent-glow)" },
  gold: { bg: "rgba(216,179,107,0.1)", border: "rgba(216,179,107,0.2)", icon: "var(--accent-gold)" },
  success: { bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.2)", icon: "var(--success)" },
  warning: { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)", icon: "var(--warning)" },
  danger: { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.2)", icon: "var(--danger)" },
  default: { bg: "var(--bg-panel-2)", border: "var(--border)", icon: "var(--text-secondary)" },
};

export function KPICard({ title, value, subtitle, icon: Icon, trend, color = "default", delay = 0 }: KPICardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className="cosmic-panel p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          {title}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: c.bg, border: `1px solid ${c.border}` }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: c.icon }} />
        </div>
      </div>
      <div>
        <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
          {value}
        </span>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-semibold"
            style={{ color: trend.value >= 0 ? "var(--success)" : "var(--danger)" }}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {trend.label}
          </span>
        </div>
      )}
    </motion.div>
  );
}
