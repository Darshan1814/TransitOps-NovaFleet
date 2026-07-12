"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { Navigation, MapPin, Truck, Package, Fuel, CheckCircle, XCircle, Rocket } from "lucide-react";
import { motion } from "framer-motion";

export default function DriverDashboard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [tripForm, setTripForm] = useState({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeightKg: "", plannedDistanceKm: "" });
  const [completeForm, setCompleteForm] = useState({ actualDistanceKm: "", fuelConsumedL: "", revenue: "" });
  const [error, setError] = useState("");

  // Find the driver profile linked to current user
  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => { const res = await fetch("/api/drivers"); return res.json(); },
  });

  const myDriver = drivers?.find((d: { userId: string | null }) => d.userId === session?.user?.id);

  const { data: myTrips } = useQuery({
    queryKey: ["my-trips", myDriver?.id],
    queryFn: async () => {
      if (!myDriver) return [];
      const res = await fetch(`/api/trips?driverId=${myDriver.id}`);
      return res.json();
    },
    enabled: !!myDriver,
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-available"],
    queryFn: async () => { const res = await fetch("/api/vehicles?status=AVAILABLE"); return res.json(); },
  });

  const activeTrip = myTrips?.find((t: { status: string }) => t.status === "DISPATCHED");
  const draftTrips = myTrips?.filter((t: { status: string }) => t.status === "DRAFT") || [];
  const completedTrips = myTrips?.filter((t: { status: string }) => t.status === "COMPLETED") || [];

  const createTrip = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tripForm,
          cargoWeightKg: Number(tripForm.cargoWeightKg),
          plannedDistanceKm: Number(tripForm.plannedDistanceKm),
          driverId: myDriver?.id || tripForm.driverId,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-all"] });
      setShowCreateTrip(false);
      setTripForm({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeightKg: "", plannedDistanceKm: "" });
      setError("");
    },
    onError: (e) => setError(e.message),
  });

  const dispatchTrip = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await fetch(`/api/trips/${tripId}/dispatch`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles-available"] });
    },
    onError: (e) => setError(e.message),
  });

  const completeTripMut = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await fetch(`/api/trips/${tripId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualDistanceKm: Number(completeForm.actualDistanceKm),
          fuelConsumedL: Number(completeForm.fuelConsumedL),
          revenue: Number(completeForm.revenue) || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles-available"] });
      setShowCompleteModal(false);
      setCompleteForm({ actualDistanceKm: "", fuelConsumedL: "", revenue: "" });
    },
    onError: (e) => setError(e.message),
  });

  const cancelTripMut = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await fetch(`/api/trips/${tripId}/cancel`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles-available"] });
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "var(--danger)" }}>
          {error}
          <button onClick={() => setError("")} className="ml-2 underline text-xs">dismiss</button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="My Status" value={myDriver?.status?.replace(/_/g, " ") || "N/A"} icon={Navigation} color={myDriver?.status === "AVAILABLE" ? "success" : "glow"} />
        <KPICard title="Safety Score" value={myDriver ? `${Number(myDriver.safetyScore).toFixed(1)}` : "—"} icon={CheckCircle} color="gold" delay={0.05} />
        <KPICard title="Total Trips" value={myTrips?.length || 0} icon={MapPin} color="glow" delay={0.1} />
        <KPICard title="Completed" value={completedTrips.length} icon={Rocket} color="success" delay={0.15} />
      </div>

      {/* Active Trip Card */}
      {activeTrip && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="cosmic-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
              🚀 My Active Trip
            </h3>
            <StatusBadge status={activeTrip.status} size="md" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div><span className="cosmic-label">From</span><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{activeTrip.source}</p></div>
            <div><span className="cosmic-label">To</span><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{activeTrip.destination}</p></div>
            <div><span className="cosmic-label">Vehicle</span><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{activeTrip.vehicle?.registrationNumber}</p></div>
            <div><span className="cosmic-label">Cargo</span><p className="text-sm font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>{formatNumber(Number(activeTrip.cargoWeightKg), 0)} kg</p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCompleteModal(true)} className="btn-success"><CheckCircle className="w-4 h-4" /> Complete Trip</button>
            <button onClick={() => cancelTripMut.mutate(activeTrip.id)} className="btn-danger"><XCircle className="w-4 h-4" /> Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Complete Trip Modal */}
      {showCompleteModal && activeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowCompleteModal(false)}>
          <div className="cosmic-panel p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Complete Trip</h3>
            <div className="space-y-3">
              <div><label className="cosmic-label">Actual Distance (km)</label><input type="number" className="cosmic-input" value={completeForm.actualDistanceKm} onChange={(e) => setCompleteForm({ ...completeForm, actualDistanceKm: e.target.value })} placeholder="e.g. 285" required /></div>
              <div><label className="cosmic-label">Fuel Consumed (L)</label><input type="number" className="cosmic-input" value={completeForm.fuelConsumedL} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumedL: e.target.value })} placeholder="e.g. 75" required /></div>
              <div><label className="cosmic-label">Revenue (₹, optional)</label><input type="number" className="cosmic-input" value={completeForm.revenue} onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })} placeholder="e.g. 45000" /></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => completeTripMut.mutate(activeTrip.id)} className="btn-primary flex-1" disabled={!completeForm.actualDistanceKm || !completeForm.fuelConsumedL}>
                {completeTripMut.isPending ? "Completing..." : "Confirm Completion"}
              </button>
              <button onClick={() => setShowCompleteModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Trip Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="cosmic-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            🛫 Launch New Trip
          </h3>
          <button onClick={() => setShowCreateTrip(!showCreateTrip)} className="btn-primary text-xs">
            {showCreateTrip ? "Close" : "Create Trip"}
          </button>
        </div>

        {showCreateTrip && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="cosmic-label">Source</label><input className="cosmic-input" value={tripForm.source} onChange={(e) => setTripForm({ ...tripForm, source: e.target.value })} placeholder="e.g. Mumbai Warehouse" /></div>
              <div><label className="cosmic-label">Destination</label><input className="cosmic-input" value={tripForm.destination} onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })} placeholder="e.g. Delhi Hub" /></div>
              <div>
                <label className="cosmic-label">Vehicle</label>
                <select className="cosmic-select" value={tripForm.vehicleId} onChange={(e) => setTripForm({ ...tripForm, vehicleId: e.target.value })}>
                  <option value="">Select vehicle...</option>
                  {vehicles?.map((v: { id: string; registrationNumber: string; nameModel: string; maxLoadCapacityKg: number }) => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} — {v.nameModel} (max {Number(v.maxLoadCapacityKg)} kg)</option>
                  ))}
                </select>
              </div>
              <div><label className="cosmic-label">Cargo Weight (kg)</label><input type="number" className="cosmic-input" value={tripForm.cargoWeightKg} onChange={(e) => setTripForm({ ...tripForm, cargoWeightKg: e.target.value })} placeholder="e.g. 18000" /></div>
              <div><label className="cosmic-label">Planned Distance (km)</label><input type="number" className="cosmic-input" value={tripForm.plannedDistanceKm} onChange={(e) => setTripForm({ ...tripForm, plannedDistanceKm: e.target.value })} placeholder="e.g. 280" /></div>
            </div>
            <button onClick={() => createTrip.mutate()} className="btn-primary" disabled={createTrip.isPending}>
              {createTrip.isPending ? "Creating..." : "Create Trip"}
            </button>
          </motion.div>
        )}

        {/* Draft Trips */}
        {draftTrips.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold mb-2" style={{ color: "var(--text-tertiary)" }}>DRAFT TRIPS — Ready to Dispatch</h4>
            {draftTrips.map((trip: { id: string; source: string; destination: string; vehicle: { registrationNumber: string }; cargoWeightKg: number; plannedDistanceKm: number }) => (
              <div key={trip.id} className="flex items-center justify-between p-3 rounded-lg mb-2" style={{ background: "var(--bg-panel-2)" }}>
                <div className="text-xs">
                  <span style={{ color: "var(--text-primary)" }}>{trip.source}</span>
                  <span style={{ color: "var(--text-tertiary)" }}> → </span>
                  <span style={{ color: "var(--text-primary)" }}>{trip.destination}</span>
                  <span className="ml-2" style={{ color: "var(--text-tertiary)" }}>({trip.vehicle?.registrationNumber})</span>
                </div>
                <button onClick={() => dispatchTrip.mutate(trip.id)} className="btn-primary text-xs py-1.5 px-3">
                  <Rocket className="w-3 h-3" /> Dispatch
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Trip History */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="cosmic-panel p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          My Trip History
        </h3>
        <div className="overflow-x-auto">
          <table className="cosmic-table">
            <thead><tr><th>Route</th><th>Vehicle</th><th>Distance</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {myTrips?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: "var(--text-tertiary)" }}>No trips yet</td></tr>
              ) : (
                myTrips?.map((trip: { id: string; source: string; destination: string; vehicle: { registrationNumber: string }; plannedDistanceKm: number; actualDistanceKm: number | null; status: string; createdAt: string }) => (
                  <tr key={trip.id}>
                    <td className="text-xs"><span style={{ color: "var(--text-primary)" }}>{trip.source}</span> → <span>{trip.destination}</span></td>
                    <td className="text-xs">{trip.vehicle?.registrationNumber}</td>
                    <td className="text-xs tabular-nums">{trip.actualDistanceKm ? formatNumber(Number(trip.actualDistanceKm), 0) : formatNumber(Number(trip.plannedDistanceKm), 0)} km</td>
                    <td><StatusBadge status={trip.status} /></td>
                    <td className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDateTime(trip.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
