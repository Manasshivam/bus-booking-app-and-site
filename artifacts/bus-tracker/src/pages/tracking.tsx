import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useTrackBus, getTrackBusQueryKey, useGetBus, useListBuses } from "@workspace/api-client-react";
import { MapPin, Navigation, Clock, AlertTriangle, Bus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Stop {
  id: number;
  name: string;
  order: number;
  estimatedMinutes: number;
}

function RouteVisualization({
  stops,
  currentStopId,
  nextStopId,
  progressPercent,
}: {
  stops: Stop[];
  currentStopId: number;
  nextStopId?: number | null;
  progressPercent: number;
}) {
  if (!stops.length) return null;

  const currentIndex = stops.findIndex((s) => s.id === currentStopId);

  return (
    <div className="overflow-x-auto py-3 -mx-6 px-6">
      <div className="flex items-center min-w-max gap-0">
        {stops.map((stop, i) => {
          const isPassed = i < currentIndex;
          const isCurrent = stop.id === currentStopId;
          const isNext = stop.id === nextStopId;
          const isFuture = !isPassed && !isCurrent;

          return (
            <div key={stop.id} className="flex items-center">
              <div className="flex flex-col items-center relative" style={{ width: 72 }}>
                {/* Bus icon above current stop */}
                {isCurrent && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground rounded-md px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1 shadow-md animate-bounce">
                      <Bus className="h-2.5 w-2.5" /> HERE
                    </div>
                  </div>
                )}

                {/* Stop dot */}
                <div
                  className={`
                    rounded-full border-2 flex items-center justify-center transition-all duration-500
                    ${isCurrent
                      ? "w-5 h-5 bg-primary border-primary ring-4 ring-primary/25"
                      : isPassed
                      ? "w-3.5 h-3.5 bg-primary border-primary"
                      : isNext
                      ? "w-4 h-4 bg-background border-primary/60"
                      : "w-3 h-3 bg-background border-muted-foreground/30"
                    }
                  `}
                >
                  {isPassed && !isCurrent && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  )}
                </div>

                {/* Stop name */}
                <p
                  className={`
                    text-center mt-1.5 leading-tight transition-all
                    ${isCurrent
                      ? "text-xs font-bold text-primary max-w-[68px]"
                      : isPassed
                      ? "text-[10px] font-medium text-muted-foreground max-w-[64px]"
                      : "text-[10px] text-muted-foreground/60 max-w-[64px]"
                    }
                  `}
                  style={{ fontSize: isCurrent ? 11 : 10 }}
                >
                  {stop.name}
                </p>

                {/* ETA or passed label */}
                {isCurrent && (
                  <Badge className="text-[9px] mt-1 px-1.5 h-4 bg-primary/10 text-primary border-primary/20" variant="outline">
                    Now
                  </Badge>
                )}
                {isNext && (
                  <p className="text-[9px] text-primary/70 mt-1">Next</p>
                )}
                {i === 0 && !isCurrent && (
                  <p className="text-[9px] text-muted-foreground/50 mt-1">Start</p>
                )}
                {i === stops.length - 1 && !isCurrent && (
                  <p className="text-[9px] text-muted-foreground/50 mt-1">End</p>
                )}
              </div>

              {/* Connector line */}
              {i < stops.length - 1 && (
                <div className="relative h-1.5 w-10 flex-shrink-0 rounded-full overflow-hidden bg-muted -mt-6">
                  {i < currentIndex && (
                    <div className="absolute inset-0 bg-primary rounded-full" />
                  )}
                  {i === currentIndex && (
                    <div
                      className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${progressPercent % (100 / (stops.length - 1)) * (stops.length - 1)}%` }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Tracking() {
  const [, params] = useRoute("/tracking/:busNumber");
  const [, setLocation] = useLocation();
  const [searchInput, setSearchInput] = useState(params?.busNumber || "");

  const busNumber = params?.busNumber;

  const { data: allBuses } = useListBuses(undefined, { query: { enabled: true } });

  const { data: trackInfo, isLoading, error, refetch } = useTrackBus(busNumber || "", {
    query: {
      enabled: !!busNumber,
      queryKey: getTrackBusQueryKey(busNumber || ""),
      refetchInterval: 10000,
    }
  });

  const { data: bus } = useGetBus(trackInfo?.busId || 0, {
    query: {
      enabled: !!trackInfo?.busId,
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) setLocation(`/tracking/${searchInput.trim()}`);
  };

  const selectBus = (num: string) => {
    setSearchInput(num);
    setLocation(`/tracking/${num}`);
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold">Live Tracking</h1>
        <p className="text-muted-foreground">Know exactly where your bus is right now.</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Bus className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Enter bus number (e.g. 01, 12, 34)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-12 text-lg font-medium tracking-wide"
              />
            </div>
            <Button type="submit" className="h-12 px-8">Track</Button>
          </form>

          {allBuses && allBuses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quick select a bus</p>
              <div className="flex flex-wrap gap-2">
                {allBuses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => selectBus(b.busNumber)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all
                      ${b.busNumber === busNumber
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary hover:text-primary"
                      }
                    `}
                  >
                    {b.status === "running" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    )}
                    {b.busNumber}
                    <span className="text-[10px] opacity-60 font-normal hidden sm:inline">
                      {b.routeName.split(" – ")[0].split(" - ")[0].split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!busNumber ? null : isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-48 bg-muted rounded-xl"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      ) : error || !trackInfo ? (
        <Card className="border-destructive bg-destructive/5 py-10">
          <CardContent className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold">Bus "{busNumber}" not found</h3>
            <p className="text-muted-foreground text-sm">
              Check the bus number above or pick one from the quick select chips.
            </p>
            {allBuses && (
              <p className="text-sm font-medium text-foreground">
                Available buses: {allBuses.map(b => b.busNumber).join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-primary/20 overflow-hidden shadow-md">
            <div className="bg-primary/5 p-6 border-b">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-primary">{trackInfo.busNumber}</h2>
                  <p className="font-medium text-foreground">{trackInfo.routeName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refetch()}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${
                    trackInfo.status === 'running' ? 'bg-green-100 text-green-700 border border-green-200' :
                    trackInfo.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    trackInfo.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {trackInfo.status === 'running' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                    {trackInfo.status}
                  </div>
                </div>
              </div>

              {/* Visual Route Strip */}
              {bus?.stops && bus.stops.length > 0 && (
                <div className="mb-4 pt-4 border-t border-primary/10">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Route Progress
                  </p>
                  <RouteVisualization
                    stops={bus.stops}
                    currentStopId={trackInfo.currentStop.id}
                    nextStopId={trackInfo.nextStop?.id}
                    progressPercent={trackInfo.progressPercent}
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-sm font-medium mt-4">
                <span>{trackInfo.from}</span>
                <span>{trackInfo.to}</span>
              </div>
              <div className="mt-2">
                <Progress value={trackInfo.progressPercent} className="h-3 rounded-full" />
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-xl">
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin className="h-4 w-4" /> Current Location
                  </p>
                  <p className="font-bold text-lg">{trackInfo.currentStop.name}</p>
                </div>

                <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <Navigation className="h-4 w-4 text-primary" /> Next Stop
                  </p>
                  <p className="font-bold text-lg text-primary">
                    {trackInfo.nextStop ? trackInfo.nextStop.name : "End of Route"}
                  </p>
                  {trackInfo.etaMinutes && (
                    <p className="text-sm font-medium mt-1 text-primary/80">
                      Arriving in ~{trackInfo.etaMinutes} mins
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-6 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Last updated {formatDistanceToNow(new Date(trackInfo.lastUpdated))} ago
                · Auto-refreshes every 10s
              </p>
            </CardContent>
          </Card>

          {bus?.stops && (
            <Card>
              <CardHeader>
                <CardTitle>Journey Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-muted">
                  {bus.stops.map((stop, i) => {
                    const isPassed = stop.order <= trackInfo.currentStop.order;
                    const isCurrent = stop.id === trackInfo.currentStop.id;
                    const isNext = trackInfo.nextStop && stop.id === trackInfo.nextStop.id;

                    return (
                      <div key={stop.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                        <div className={`
                          flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 z-10
                          ${isCurrent ? 'bg-primary border-primary/20 ring-4 ring-primary/20 animate-pulse' :
                            isPassed ? 'bg-primary' : 'bg-muted'}
                        `}>
                          {isPassed ? (
                            <MapPin className="h-4 w-4 text-primary-foreground" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                          )}
                        </div>
                        <div className={`pt-2 ${isCurrent ? 'opacity-100' : isPassed ? 'opacity-70' : 'opacity-50'}`}>
                          <div className="flex items-center gap-2">
                            <h4 className={`font-bold ${isCurrent ? 'text-primary text-lg' : 'text-foreground'}`}>
                              {stop.name}
                            </h4>
                            {stop.distanceKm != null && (
                              <span className="text-xs text-muted-foreground">{stop.distanceKm} km</span>
                            )}
                          </div>
                          {isCurrent && (
                            <p className="text-sm font-medium text-primary mt-1">Bus is here right now</p>
                          )}
                          {isNext && trackInfo.etaMinutes && (
                            <p className="text-sm text-muted-foreground mt-1">Arriving in ~{trackInfo.etaMinutes} mins</p>
                          )}
                          {i === 0 && !isCurrent && !isPassed && (
                            <p className="text-sm text-muted-foreground">Starting Point</p>
                          )}
                          {i === bus.stops.length - 1 && (
                            <p className="text-sm text-muted-foreground">Destination</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {stop.estimatedMinutes} min from start
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
