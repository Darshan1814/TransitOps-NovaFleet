"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { Navigation, MapPin, Truck, Package, Fuel, CheckCircle, XCircle, Rocket, Map } from "lucide-react";
import { motion } from "framer-motion";
import { useLoadScript, GoogleMap, DirectionsRenderer, Autocomplete } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

export default function DriverDashboard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [tripForm, setTripForm] = useState({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeightKg: "", plannedDistanceKm: "" });
  const [completeForm, setCompleteForm] = useState({ actualDistanceKm: "", fuelConsumedL: "", revenue: "" });
  const [error, setError] = useState("");
  
  // Verification State
  const [verifyForm, setVerifyForm] = useState({
    fullName: "", licenseNumber: "", licenseCategory: "Class A", licenseExpiryDate: "", contactNumber: "", region: "NA", documentBase64: ""
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [directionsResponse, setDirectionsResponse] = useState<any>(null);
  const [sourceAutocomplete, setSourceAutocomplete] = useState<any>(null);
  const [destAutocomplete, setDestAutocomplete] = useState<any>(null);

  async function calculateRoute() {
    if (!tripForm.source || !tripForm.destination || !window.google) return;
    try {
      const directionsService = new window.google.maps.DirectionsService();
      const results = await directionsService.route({
        origin: tripForm.source,
        destination: tripForm.destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      setDirectionsResponse(results);
      if (results.routes[0]?.legs[0]?.distance?.value) {
        const km = (results.routes[0].legs[0].distance.value / 1000).toFixed(1);
        setTripForm(prev => ({ ...prev, plannedDistanceKm: km }));
      }
    } catch (err) {
      console.error("Directions request failed", err);
    }
  }

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

  const { data: allTrips } = useQuery({
    queryKey: ["trips-all"],
    queryFn: async () => { const res = await fetch("/api/trips"); return res.json(); },
  });

  const openTrips = allTrips?.filter((t: any) => !t.driverId && t.status === "DRAFT") || [];

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

  const claimTripMut = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await fetch(`/api/trips/${tripId}/claim`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips-all"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles-available"] });
    },
    onError: (e) => setError(e.message),
  });

  const submitVerificationMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/drivers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyForm)
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
    onError: (e) => setError(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerifyForm({ ...verifyForm, documentBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // If driver doesn't exist or is suspended, they are locked out.
  if (drivers && (!myDriver || myDriver.status === "SUSPENDED")) {
    return (
      <div className="space-y-6">
        {error && <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">{error}</div>}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="cosmic-panel p-8 max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Account Verification Required</h2>
          
          {myDriver ? (
            <p className="text-[var(--text-secondary)] mb-6">Your driver profile is currently under review by the Safety Officer. You will regain access once approved.</p>
          ) : (
            <>
              <p className="text-[var(--text-secondary)] mb-6">Please complete your driver profile and upload your license to access the dashboard.</p>
              <form onSubmit={(e) => { e.preventDefault(); submitVerificationMut.mutate(); }} className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="cosmic-label">Full Name</label>
                    <input required className="cosmic-input" value={verifyForm.fullName} onChange={e => setVerifyForm({...verifyForm, fullName: e.target.value})} />
                  </div>
                  <div>
                    <label className="cosmic-label">License Number</label>
                    <input required className="cosmic-input" value={verifyForm.licenseNumber} onChange={e => setVerifyForm({...verifyForm, licenseNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="cosmic-label">License Expiry</label>
                    <input required type="date" className="cosmic-input" value={verifyForm.licenseExpiryDate} onChange={e => setVerifyForm({...verifyForm, licenseExpiryDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="cosmic-label">Contact Number</label>
                    <input required className="cosmic-input" value={verifyForm.contactNumber} onChange={e => setVerifyForm({...verifyForm, contactNumber: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="cosmic-label">Upload License (Image)</label>
                  <input required type="file" accept="image/*" onChange={handleFileChange} className="cosmic-input" />
                </div>
                <button type="submit" disabled={submitVerificationMut.isPending || !verifyForm.documentBase64} className="btn-primary w-full mt-4">
                  {submitVerificationMut.isPending ? "Submitting..." : "Submit for Verification"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    );
  }

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
              <div>
                <label className="cosmic-label">Source</label>
                {isLoaded ? (
                  <Autocomplete
                    onLoad={setSourceAutocomplete}
                    onPlaceChanged={() => {
                      if (sourceAutocomplete !== null) {
                        const place = sourceAutocomplete.getPlace();
                        setTripForm(prev => ({ ...prev, source: place.formatted_address || place.name || "" }));
                      }
                    }}
                  >
                    <input className="cosmic-input" value={tripForm.source} onChange={(e) => setTripForm({ ...tripForm, source: e.target.value })} placeholder="Search starting location..." />
                  </Autocomplete>
                ) : (
                  <input className="cosmic-input" disabled placeholder="Loading Maps..." />
                )}
              </div>
              
              <div>
                <label className="cosmic-label">Destination</label>
                {isLoaded ? (
                  <Autocomplete
                    onLoad={setDestAutocomplete}
                    onPlaceChanged={() => {
                      if (destAutocomplete !== null) {
                        const place = destAutocomplete.getPlace();
                        setTripForm(prev => ({ ...prev, destination: place.formatted_address || place.name || "" }));
                      }
                    }}
                  >
                    <input className="cosmic-input" value={tripForm.destination} onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })} placeholder="Search destination..." />
                  </Autocomplete>
                ) : (
                  <input className="cosmic-input" disabled placeholder="Loading Maps..." />
                )}
              </div>
              
              <div className="md:col-span-2">
                 <button onClick={calculateRoute} className="btn-secondary w-full py-2 mb-2 flex items-center justify-center gap-2" disabled={!tripForm.source || !tripForm.destination}>
                   <Map className="w-4 h-4" /> Calculate Route & Distance
                 </button>
                 
                 {isLoaded && directionsResponse && (
                   <div className="w-full h-64 rounded-xl overflow-hidden border border-[var(--border-subtle)] mb-4 relative z-0">
                     <GoogleMap
                       mapContainerStyle={{ width: "100%", height: "100%" }}
                       zoom={10}
                       options={{ disableDefaultUI: true, styles: [ { elementType: "geometry", stylers: [{ color: "#242f3e" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] }, { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] } ] }}
                     >
                       <DirectionsRenderer directions={directionsResponse} options={{ polylineOptions: { strokeColor: "#7C8CFF", strokeWeight: 4 } }} />
                     </GoogleMap>
                   </div>
                 )}
              </div>

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
              <div><label className="cosmic-label">Planned Distance (km)</label><input type="number" className="cosmic-input" value={tripForm.plannedDistanceKm} onChange={(e) => setTripForm({ ...tripForm, plannedDistanceKm: e.target.value })} placeholder="Auto-calculated or enter manually" /></div>
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

      {/* Available Open Trips */}
      {openTrips.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="cosmic-panel p-5 border border-[var(--accent-glow)]">
          <h3 className="text-sm font-semibold mb-4 text-[var(--accent-glow)] flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
            <Rocket className="w-4 h-4" /> Available Open Trips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openTrips.map((trip: any) => (
              <div key={trip.id} className="p-4 rounded-xl bg-[var(--bg-panel-2)] border border-[var(--border-subtle)] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{trip.vehicle?.nameModel} ({trip.vehicle?.registrationNumber})</span>
                    <span className="text-[10px] bg-[var(--accent-glow)]/20 text-[var(--accent-glow)] px-2 py-0.5 rounded-full">{trip.cargoWeightKg}kg</span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {trip.source}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-[var(--accent-glow)]" /> {trip.destination}
                  </div>
                </div>
                <button 
                  onClick={() => claimTripMut.mutate(trip.id)} 
                  disabled={claimTripMut.isPending || !!activeTrip}
                  className="btn-primary w-full text-xs py-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {claimTripMut.isPending ? "Claiming..." : "Claim Trip"}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

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
