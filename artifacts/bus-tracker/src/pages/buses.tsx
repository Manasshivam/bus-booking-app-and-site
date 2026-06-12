import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { format } from "date-fns";
import { useListBuses, getListBusesQueryKey, useGetBus } from "@workspace/api-client-react";
import { Bus, Clock, MapPin, Users, Info, ChevronDown, ChevronUp, Route } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

function BusStopsRow({ busId }: { busId: number }) {
  const { data: bus, isLoading } = useGetBus(busId);

  if (isLoading) {
    return (
      <div className="px-4 pb-4 md:px-6">
        <div className="h-16 bg-muted/40 rounded-lg animate-pulse" />
      </div>
    );
  }

  const stops = bus?.stops ?? [];
  if (!stops.length) return null;

  return (
    <div className="px-4 pb-4 md:px-6">
      <div className="bg-muted/30 rounded-xl p-4 overflow-hidden">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {stops.length} stops along this route
        </p>
        <div className="overflow-x-auto pb-1">
          <div className="flex items-start gap-0 min-w-max">
            {stops.map((stop, i) => {
              const isFirst = i === 0;
              const isLast = i === stops.length - 1;
              return (
                <div key={stop.id} className="flex items-center">
                  <div className="flex flex-col items-center w-20">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      isFirst || isLast
                        ? "bg-primary border-primary"
                        : "bg-background border-primary/60"
                    }`} />
                    <p className="text-xs font-medium text-center mt-1.5 leading-tight line-clamp-2 max-w-[72px]">
                      {stop.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {stop.estimatedMinutes}m
                    </p>
                    {isFirst && <Badge variant="outline" className="text-[9px] mt-1 px-1 h-4">Start</Badge>}
                    {isLast && <Badge variant="outline" className="text-[9px] mt-1 px-1 h-4">End</Badge>}
                  </div>
                  {!isLast && (
                    <div className="h-0.5 w-8 bg-primary/30 flex-shrink-0 -mt-8" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Buses() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const searchParams = new URLSearchParams(searchStr);
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const queryParams = {
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  };

  const { data: buses, isLoading } = useListBuses(queryParams, {
    query: {
      queryKey: getListBusesQueryKey(queryParams),
    }
  });

  const toggleStops = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    setLocation(`/buses?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Bus Routes</h1>
        <p className="text-muted-foreground">Find dependable rides across all villages.</p>
      </div>

      <Card className="border-primary/20 bg-card/50">
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleFilter} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 w-full md:flex-1">
              <Label htmlFor="from">From Village</Label>
              <Input
                id="from"
                placeholder="Rampur"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2 w-full md:flex-1">
              <Label htmlFor="to">To Village</Label>
              <Input
                id="to"
                placeholder="Sitapur"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full md:w-auto h-10">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      ) : !buses || buses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Info className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">No buses found</p>
            <p className="text-muted-foreground">Try adjusting your search criteria or checking another day.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {buses.map((bus, i) => {
            const isExpanded = expandedIds.has(bus.id);
            return (
              <motion.div
                key={bus.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`hover:border-primary/50 transition-colors shadow-sm ${isExpanded ? "border-primary/40" : ""}`}>
                  <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-between items-center md:items-start">
                    <div className="space-y-4 w-full md:w-auto flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-bold text-primary">{bus.busNumber}</h3>
                        <Badge variant="outline">{bus.routeName}</Badge>
                        <Badge className={
                          bus.status === 'running' ? 'bg-green-500 hover:bg-green-600' :
                          bus.status === 'cancelled' ? 'bg-destructive' : 'bg-secondary text-secondary-foreground'
                        }>
                          {bus.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse inline-block" />}
                          {bus.status.charAt(0).toUpperCase() + bus.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{bus.from}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{bus.to}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(`1970-01-01T${bus.departureTime}`), "h:mm a")}</span>
                          {bus.arrivalTime && (
                            <>
                              <span className="text-muted-foreground">-</span>
                              <span>{format(new Date(`1970-01-01T${bus.arrivalTime}`), "h:mm a")}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className={bus.availableSeats < 5 ? "text-destructive font-bold" : ""}>
                            {bus.availableSeats} / {bus.totalSeats} seats
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex md:flex-col items-center justify-between gap-3 md:items-end mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0">
                      <div className="text-lg font-bold">₹{bus.fare}</div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`gap-1.5 text-xs ${isExpanded ? "text-primary" : "text-muted-foreground"}`}
                          onClick={() => toggleStops(bus.id)}
                        >
                          <Route className="h-3.5 w-3.5" />
                          Stops
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setLocation(`/tracking/${bus.busNumber}`)}>
                          Track
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/buses/${bus.id}`)}
                          disabled={bus.status === 'cancelled' || bus.availableSeats === 0}
                        >
                          Details & Book
                        </Button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-border/40"
                      >
                        <BusStopsRow busId={bus.id} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
