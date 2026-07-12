"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  isRead: boolean;
  severity: string;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 8000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications", { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const severityColor: Record<string, string> = {
    INFO: "var(--accent-glow)",
    WARNING: "var(--warning)",
    CRITICAL: "var(--danger)",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && unreadCount > 0) {
            markRead.mutate();
          }
        }}
        className="p-2 rounded-lg transition-colors relative"
        style={{ color: "var(--text-secondary)" }}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: "var(--danger)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl z-50"
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Notifications
            </span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {unreadCount} unread
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className="px-3 py-3 transition-colors"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: n.isRead ? "transparent" : "rgba(124,140,255,0.04)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: severityColor[n.severity] || "var(--text-tertiary)" }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
