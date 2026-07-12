"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Rocket, Mail, Lock, User, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "DRIVER",
    region: "",
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState<any>(null);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      setFormData((prev) => ({ ...prev, region: place.formatted_address || place.name || "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Register the user
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // 2. Automatically log them in
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error("Login failed after registration");
      }

      // 3. Redirect to their dashboard
      router.push(`/dashboard/${formData.role.toLowerCase().replace("_", "-")}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen starfield-bg flex items-center justify-center p-4">
      <div className="cosmic-halo" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="cosmic-panel p-8 sm:p-10 backdrop-blur-xl bg-opacity-80">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C8CFF] to-[#4B0082] p-4 shadow-[0_0_30px_rgba(124,140,255,0.4)]">
              <Rocket className="w-full h-full text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2 tracking-tight">Join NovaFleet</h1>
            <p className="text-sm text-[var(--text-secondary)]">Create an account to command your fleet</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="cosmic-label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="cosmic-input pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="cosmic-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="cosmic-input pl-10"
                  placeholder="name@novafleet.io"
                  required
                />
              </div>
            </div>

            <div>
              <label className="cosmic-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="cosmic-input pl-10"
                  placeholder="•••••••••••"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="cosmic-label">Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="cosmic-select pl-10"
                  >
                    <option value="DRIVER">Driver</option>
                    <option value="FLEET_MANAGER">Fleet Manager</option>
                    <option value="SAFETY_OFFICER">Safety Officer</option>
                    <option value="FINANCIAL_ANALYST">Financial Analyst</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="cosmic-label">Region</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] z-10" />
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={setAutocomplete}
                      onPlaceChanged={onPlaceChanged}
                    >
                      <input
                        type="text"
                        name="region"
                        value={formData.region}
                        onChange={handleChange}
                        className="cosmic-input pl-10"
                        placeholder="Search city/region"
                        required
                      />
                    </Autocomplete>
                  ) : (
                    <input type="text" className="cosmic-input pl-10" disabled placeholder="Loading Maps..." />
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary h-11 text-base mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--accent-glow)] hover:text-white font-medium transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
