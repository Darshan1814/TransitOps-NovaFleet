"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Rocket, Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";

const rolePaths: Record<string, string> = {
  FLEET_MANAGER: "/dashboard/fleet",
  DRIVER: "/dashboard/driver",
  SAFETY_OFFICER: "/dashboard/safety",
  FINANCIAL_ANALYST: "/dashboard/finance",
  ADMIN: "/dashboard/admin",
};

const demoAccounts = [
  { label: "Fleet Manager", email: "fleet@novafleet.io", icon: "🛰️" },
  { label: "Driver", email: "driver@novafleet.io", icon: "🧑‍✈️" },
  { label: "Safety Officer", email: "safety@novafleet.io", icon: "🛡️" },
  { label: "Finance", email: "finance@novafleet.io", icon: "📊" },
  { label: "Admin", email: "admin@novafleet.io", icon: "👑" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Try a demo account below.");
      } else {
        // Fetch session to get role
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role;
        router.push(rolePaths[role] || "/dashboard/fleet");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: demoEmail,
        password: "password123",
        redirect: false,
      });

      if (res?.error) {
        setError("Demo login failed. Ensure database is seeded.");
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role;
        router.push(rolePaths[role] || "/dashboard/fleet");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="starfield-bg min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-void)" }}>
      {/* Cosmic Halo */}
      <div className="cosmic-halo" style={{ top: "30%", left: "50%" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(124,140,255,0.2), rgba(216,179,107,0.2))",
              border: "1px solid rgba(124,140,255,0.3)",
            }}
          >
            <Rocket className="w-8 h-8" style={{ color: "var(--accent-glow)" }} />
          </motion.div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
            NovaFleet
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Command Your Fleet Across the Cosmos
          </p>
        </div>

        {/* Login Card */}
        <div className="cosmic-panel p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-2 p-3 rounded-lg text-sm"
                style={{
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  color: "var(--danger)",
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <div>
              <label className="cosmic-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="cosmic-input"
                required
              />
            </div>

            <div>
              <label className="cosmic-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="cosmic-input"
                  style={{ paddingRight: "42px" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link href="/forgot-password" className="text-xs hover:underline transition-colors" style={{ color: "var(--accent-glow)" }}>
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
              style={{ height: "44px" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                "Launch Mission"
              )}
            </button>

            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--bg-panel)] text-[var(--text-tertiary)]">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signIn("azure-ad")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-panel-2)] transition-colors"
            >
              <span className="font-semibold text-white">Enterprise</span>
              <span className="text-sm font-medium">Single Sign-On</span>
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-center text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
              QUICK ACCESS — DEMO ACCOUNTS
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => quickLogin(acc.email)}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: "var(--bg-panel-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.borderColor = "var(--accent-glow)";
                    (e.target as HTMLElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.borderColor = "var(--border)";
                    (e.target as HTMLElement).style.color = "var(--text-secondary)";
                  }}
                >
                  <span>{acc.icon}</span>
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium hover:text-white transition-colors" style={{ color: "var(--accent-glow)" }}>
            Sign up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
