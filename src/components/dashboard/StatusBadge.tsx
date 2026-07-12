"use client";

import { getStatusColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-3 py-1",
    lg: "text-sm px-4 py-1.5",
  };

  return (
    <span className={`status-pill ${getStatusColor(status)} ${sizeClasses[size]}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />
      {status.replace(/_/g, " ")}
    </span>
  );
}
