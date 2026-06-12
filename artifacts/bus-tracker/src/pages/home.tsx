import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, MapPin, Activity, CalendarDays, BusFront, ArrowRight, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetBusSummary } from "@workspace/api-client-react";
import { motion } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busNumber, setBusNumber] = useState("");

  const { data: summary, isLoading } = useGetBusSummary();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    setLocation(`/buses?${params.toString()}`);
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (busNumber) setLocation(`/tracking/${busNumber}`);
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-12">
      <section className="text-center space-y-4 py-8 md:py-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground"
        >
          Never guess when <br className="hidden md:block"/>
          <span className="text-primary">the bus will arrive.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Real-time tracking and easy seat booking for rural bus routes.
          Dependable transport for every village.
        </motion.p>
      </section>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Find a Bus
              </CardTitle>
              <CardDescription>Search for buses by village stops</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="from">From Village</Label>
                  <Input
                    id="from"
                    placeholder="e.g. Rampur"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">To Village</Label>
                  <Input
                    id="to"
                    placeholder="e.g. Sitapur"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full text-lg h-12 mt-2">
                  Search Routes
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-6 md:space-y-8">
          <Card className="border-secondary-foreground/10 bg-secondary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Live Tracking
              </CardTitle>
              <CardDescription>Enter bus number to track location</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrack} className="flex gap-2">
                <Input
                  placeholder="e.g. 01, 12, 34"
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  className="flex-1 bg-background"
                />
                <Button type="submit" variant="secondary" className="font-semibold">Track</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-secondary-foreground/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Today's Service</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || !summary ? (
                <div className="grid grid-cols-2 gap-4 animate-pulse">
                  <div className="h-16 bg-muted rounded-md"></div>
                  <div className="h-16 bg-muted rounded-md"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{summary.runningNow}</p>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Buses Running</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-foreground">{summary.scheduledToday}</p>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Scheduled</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Nearby Buses CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="border-primary bg-primary/5 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row items-center gap-0">
              <div className="flex-1 p-6 md:p-8 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Buses Near You</h3>
                </div>
                <p className="text-muted-foreground">
                  Use your location to instantly find buses passing through your village or anywhere on the route.
                </p>
                <Button className="gap-2 mt-2" onClick={() => setLocation("/nearby")}>
                  <Navigation className="h-4 w-4" /> Find Nearby Buses
                </Button>
              </div>
              <div className="hidden md:flex w-48 h-full bg-primary/10 items-center justify-center py-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <Navigation className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="pt-4"
      >
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-bold">Already have a ticket?</h3>
            <p className="text-muted-foreground">Check your booking details or cancel if plans changed.</p>
          </div>
          <Link href="/bookings" className="inline-flex items-center gap-2 bg-background border border-border px-6 py-3 rounded-lg font-medium shadow-sm hover:border-primary transition-colors">
            Lookup Booking
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
