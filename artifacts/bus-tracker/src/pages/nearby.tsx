import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Navigation, MapPin, Bus, Clock, Users, Loader2, AlertTriangle, Radio, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useListBuses } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

type LocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "locating"; coords: GeolocationCoordinates }
  | { status: "ready"; coords: GeolocationCoordinates; locality: string }
  | { status: "error"; message: string };

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
  const res = await fetch(url, {
    headers: { "User-Agent": "BusTrack-RuralBusApp/1.0" },
  });
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  const addr = data.address ?? {};
  return (
    addr.village ||
    addr.hamlet ||
    addr.suburb ||
    addr.town ||
    addr.city ||
    addr.county ||
    addr.state_district ||
    data.display_name?.split(",")[0] ||
    ""
  );
}

type BusItem = NonNullable<ReturnType<typeof useListBuses>["data"]>[number];

function BusResultCard({
  bus,
  onTrack,
  onBook,
}: {
  bus: BusItem;
  onTrack: () => void;
  onBook: () => void;
}) {
  const isRunning = bus.status === "running";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`shadow-sm transition-colors ${isRunning ? "border-green-400/50 bg-green-50/30" : "hover:border-primary/30"}`}>
        <div className="p-4 md:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-primary">{bus.busNumber}</span>
              <Badge variant="outline" className="text-xs">{bus.routeName}</Badge>
              <Badge
                className={
                  isRunning
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : bus.status === "cancelled"
                    ? "bg-destructive"
                    : "bg-secondary text-secondary-foreground"
                }
              >
                {isRunning && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse inline-block" />
                )}
                {bus.status.charAt(0).toUpperCase() + bus.status.slice(1)}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {bus.from} → {bus.to}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(`1970-01-01T${bus.departureTime}`), "h:mm a")}
                {bus.arrivalTime && ` – ${format(new Date(`1970-01-01T${bus.arrivalTime}`), "h:mm a")}`}
              </span>
              <span className={`flex items-center gap-1.5 ${bus.availableSeats < 5 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                <Users className="h-3.5 w-3.5" />
                {bus.availableSeats} seats left
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            <span className="text-lg font-bold">₹{bus.fare}</span>
            <div className="flex gap-2">
              {isRunning && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={onTrack}>
                  <Radio className="h-3.5 w-3.5 text-green-600" /> Live
                </Button>
              )}
              <Button
                size="sm"
                onClick={onBook}
                disabled={bus.status === "cancelled" || bus.availableSeats === 0}
              >
                Book
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function Nearby() {
  const [, setLocation] = useLocation();
  const [locState, setLocState] = useState<LocationState>({ status: "idle" });
  const [manualStop, setManualStop] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const finalSearch = locState.status === "ready" ? locState.locality : activeSearch;

  const { data: busesFrom, isLoading: loadingFrom } = useListBuses(
    { from: finalSearch || undefined },
    { query: { enabled: !!finalSearch } }
  );
  const { data: busesTo, isLoading: loadingTo } = useListBuses(
    { to: finalSearch || undefined },
    { query: { enabled: !!finalSearch } }
  );
  const { data: allBuses } = useListBuses(undefined, { query: { enabled: true } });

  const runningBuses = allBuses?.filter((b) => b.status === "running") ?? [];

  const nearbyBuses = (() => {
    const combined = [...(busesFrom ?? []), ...(busesTo ?? [])];
    const seen = new Set<number>();
    return combined.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
  })();

  const requestLocation = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setLocState({ status: "error", message: "Geolocation is not supported by your browser." });
      return;
    }
    setLocState({ status: "requesting" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocState({ status: "locating", coords: pos.coords });
        try {
          const locality = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setLocState({ status: "ready", coords: pos.coords, locality });
        } catch {
          setLocState({
            status: "error",
            message: "Could not determine your location name. Try searching manually below.",
          });
        }
      },
      (err) => {
        setLocState({
          status: "error",
          message:
            err.code === 1
              ? "Location access was denied. Please allow location access or search manually."
              : "Unable to get your location. Please try again or search manually.",
        });
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(manualStop.trim());
    setLocState({ status: "idle" });
  };

  const isSearching = loadingFrom || loadingTo;

  return (
    <div className="space-y-8 pb-12 max-w-3xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Navigation className="h-8 w-8 text-primary" />
          Buses Near You
        </h1>
        <p className="text-muted-foreground">
          Find buses passing through your village or current location.
        </p>
      </div>

      {/* Location Detection */}
      <Card className="border-primary/20 overflow-hidden">
        <div className="bg-primary/5 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 space-y-1">
            <h2 className="font-semibold text-foreground">Use my current location</h2>
            <p className="text-sm text-muted-foreground">
              {locState.status === "ready"
                ? `Detected: ${locState.locality}`
                : locState.status === "locating"
                ? "Looking up your village name..."
                : locState.status === "requesting"
                ? "Waiting for location permission..."
                : "Allow your browser to detect your location automatically."}
            </p>
          </div>
          <Button
            onClick={requestLocation}
            disabled={locState.status === "requesting" || locState.status === "locating"}
            className="gap-2 shrink-0"
          >
            {locState.status === "requesting" || locState.status === "locating" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {locState.status === "ready" ? "Re-detect Location" : "Find My Location"}
          </Button>
        </div>

        {locState.status === "error" && (
          <div className="px-6 py-3 bg-destructive/5 border-t border-destructive/20 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{locState.message}</p>
          </div>
        )}

        {locState.status === "ready" && (
          <div className="px-6 py-3 bg-green-50 border-t border-green-200 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 font-medium">
              Showing buses for <strong>{locState.locality}</strong>
            </p>
          </div>
        )}
      </Card>

      {/* Manual Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Search by Village / Stop Name
          </CardTitle>
          <CardDescription>Type any village, town, or stop to find buses serving it.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <Input
              placeholder="e.g. Rampur, Chandpur, Nayagaon..."
              value={manualStop}
              onChange={(e) => setManualStop(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary" className="gap-2">
              <Search className="h-4 w-4" /> Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {finalSearch && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Buses near <span className="text-primary">{finalSearch}</span>
            </h2>
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {!isSearching && nearbyBuses.length === 0 ? (
            <Card className="text-center py-10">
              <CardContent className="space-y-3">
                <div className="bg-muted w-14 h-14 rounded-full flex items-center justify-center mx-auto">
                  <Bus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium">No buses found for "{finalSearch}"</p>
                <p className="text-sm text-muted-foreground">
                  Try a nearby larger town or check the full bus list.
                </p>
                <Button variant="outline" onClick={() => setLocation("/buses")}>
                  View All Routes
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {nearbyBuses
                .slice()
                .sort((a, b) => {
                  if (a.status === "running" && b.status !== "running") return -1;
                  if (b.status === "running" && a.status !== "running") return 1;
                  return 0;
                })
                .map((bus) => (
                  <BusResultCard
                    key={bus.id}
                    bus={bus}
                    onTrack={() => setLocation(`/tracking/${bus.busNumber}`)}
                    onBook={() => setLocation(`/buses/${bus.id}`)}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Running Buses Section — always shown */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Currently Running</h2>
          <Badge className="bg-green-500 hover:bg-green-600 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
            {runningBuses.length} live
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          These buses are actively on the road right now.
        </p>

        {runningBuses.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">No buses are running at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {runningBuses.map((bus) => (
              <BusResultCard
                key={bus.id}
                bus={bus}
                onTrack={() => setLocation(`/tracking/${bus.busNumber}`)}
                onBook={() => setLocation(`/buses/${bus.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
