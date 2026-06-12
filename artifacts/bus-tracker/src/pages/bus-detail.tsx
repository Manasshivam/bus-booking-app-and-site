import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { useGetBus, getGetBusQueryKey } from "@workspace/api-client-react";
import { MapPin, Clock, Users, ArrowLeft, ArrowRight, ShieldCheck, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function BusDetail() {
  const [, params] = useRoute("/buses/:id");
  const [, setLocation] = useLocation();
  const id = Number(params?.id);

  const { data: bus, isLoading, error } = useGetBus(id, {
    query: {
      enabled: !!id,
      queryKey: getGetBusQueryKey(id)
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted w-32 rounded"></div>
        <div className="h-48 bg-muted rounded-xl"></div>
        <div className="h-64 bg-muted rounded-xl"></div>
      </div>
    );
  }

  if (error || !bus) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-destructive">Could not load bus details.</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation('/buses')}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => setLocation('/buses')}>
        <ArrowLeft className="h-4 w-4" /> Back to routes
      </Button>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 rounded-t-xl pb-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-3xl font-extrabold text-primary">{bus.busNumber}</CardTitle>
                    <Badge variant="outline" className="bg-background">{bus.routeName}</Badge>
                  </div>
                  <CardDescription className="text-base text-foreground font-medium flex items-center gap-2 mt-2">
                    {bus.from} <ArrowRight className="h-4 w-4 text-muted-foreground" /> {bus.to}
                  </CardDescription>
                </div>
                <Badge className={
                  bus.status === 'running' ? 'bg-green-500' :
                  bus.status === 'cancelled' ? 'bg-destructive' : 'bg-secondary'
                }>
                  {bus.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> Departure</p>
                  <p className="font-semibold">{format(new Date(bus.departureTime), "h:mm a")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> Arrival</p>
                  <p className="font-semibold">{bus.arrivalTime ? format(new Date(bus.arrivalTime), "h:mm a") : "--"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3"/> Availability</p>
                  <p className={`font-semibold ${bus.availableSeats < 5 ? "text-destructive" : ""}`}>
                    {bus.availableSeats} of {bus.totalSeats} seats
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fare</p>
                  <p className="font-bold text-primary text-lg">₹{bus.fare}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RouteIcon className="h-5 w-5 text-primary" />
                Route & Stops
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-primary/50 before:to-transparent">
                {bus.stops?.map((stop, i) => (
                  <div key={stop.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <MapPin className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-foreground">{stop.name}</h4>
                        {i === 0 ? (
                          <Badge variant="outline" className="text-xs">Start</Badge>
                        ) : i === bus.stops!.length - 1 ? (
                          <Badge variant="outline" className="text-xs">End</Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">ETA: {stop.estimatedMinutes} mins</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-20 border-primary shadow-md">
            <CardHeader>
              <CardTitle>Book Tickets</CardTitle>
              <CardDescription>Secure your seat for this journey.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 bg-secondary/50 p-3 rounded-lg text-sm">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p>Instant confirmation with your phone number. Pay to conductor on boarding.</p>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground font-medium">Ticket Price</span>
                <span className="text-2xl font-bold">₹{bus.fare}</span>
              </div>
              <Button 
                size="lg" 
                className="w-full text-lg" 
                disabled={bus.status === 'cancelled' || bus.availableSeats === 0}
                onClick={() => setLocation(`/buses/${bus.id}/book`)}
              >
                Select Seats
              </Button>
              {bus.availableSeats === 0 && (
                <p className="text-center text-sm text-destructive font-medium">Bus is completely full</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
