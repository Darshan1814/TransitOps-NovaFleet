"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Rocket,
  Satellite,
  Navigation,
  Shield,
  BarChart3,
  Crown,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
} from "lucide-react";
import { roleThemeNames } from "@/lib/utils";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

const navItems: Record<string, { label: string; icon: React.ReactNode; href: string; themeName: string }[]> = {
  FLEET_MANAGER: [
    { label: "Mission Control", icon: <Satellite className="w-5 h-5" />, href: "/dashboard/fleet", themeName: "Mission Control" },
  ],
  DRIVER: [
    { label: "Cockpit", icon: <Navigation className="w-5 h-5" />, href: "/dashboard/driver", themeName: "Cockpit" },
  ],
  SAFETY_OFFICER: [
    { label: "Watchtower", icon: <Shield className="w-5 h-5" />, href: "/dashboard/safety", themeName: "Watchtower" },
  ],
  FINANCIAL_ANALYST: [
    { label: "Ledger Deck", icon: <BarChart3 className="w-5 h-5" />, href: "/dashboard/finance", themeName: "Ledger Deck" },
  ],
  ADMIN: [
    { label: "The Tower", icon: <Crown className="w-5 h-5" />, href: "/dashboard/admin", themeName: "The Tower" },
    { label: "Mission Control", icon: <Satellite className="w-5 h-5" />, href: "/dashboard/fleet", themeName: "Fleet View" },
    { label: "Watchtower", icon: <Shield className="w-5 h-5" />, href: "/dashboard/safety", themeName: "Safety View" },
    { label: "Ledger Deck", icon: <BarChart3 className="w-5 h-5" />, href: "/dashboard/finance", themeName: "Finance View" },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = session?.user?.role || "FLEET_MANAGER";
  const items = navItems[role] || navItems.FLEET_MANAGER;
  const currentThemeName = roleThemeNames[role] || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-void)" }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col transition-all duration-300 ease-in-out relative"
        style={{
          width: sidebarOpen ? "260px" : "72px",
          background: "var(--bg-panel)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16" style={{ borderBottom: "1px solid var(--border)" }}>
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(124,140,255,0.2), rgba(216,179,107,0.2))",
              border: "1px solid rgba(124,140,255,0.25)",
            }}
          >
            <Rocket className="w-5 h-5" style={{ color: "var(--accent-glow)" }} />
          </div>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <h2 className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                NovaFleet
              </h2>
              <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{currentThemeName}</p>
            </motion.div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left relative"
                style={{
                  background: isActive ? "rgba(124,140,255,0.12)" : "transparent",
                  color: isActive ? "var(--accent-glow)" : "var(--text-secondary)",
                  border: isActive ? "1px solid rgba(124,140,255,0.2)" : "1px solid transparent",
                }}
              >
                {item.icon}
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                    style={{ background: "var(--accent-glow)" }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* User section at bottom */}
        {sidebarOpen && session?.user && (
          <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(124,140,255,0.15), rgba(216,179,107,0.15))",
                  color: "var(--accent-glow)",
                }}
              >
                {session.user.name?.[0] || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {session.user.name}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header
          className="flex items-center justify-between h-16 px-4 lg:px-6 shrink-0"
          style={{
            background: "var(--bg-panel)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Left: Mobile menu + Page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                {items.find((i) => i.href === pathname)?.label || currentThemeName}
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.6)" }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] z-50 flex flex-col"
              style={{
                background: "var(--bg-panel)",
                borderRight: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-3 px-4 h-16" style={{ borderBottom: "1px solid var(--border)" }}>
                <Rocket className="w-6 h-6" style={{ color: "var(--accent-glow)" }} />
                <h2 className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                  NovaFleet
                </h2>
              </div>
              <nav className="flex-1 py-4 px-3 space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        router.push(item.href);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                      style={{
                        background: isActive ? "rgba(124,140,255,0.12)" : "transparent",
                        color: isActive ? "var(--accent-glow)" : "var(--text-secondary)",
                      }}
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
