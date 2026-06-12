import { useState } from "react";
import { useGetBookingsByPhone, getGetBookingsByPhoneQueryKey, useCancelBooking } from "@workspace/api-client-react";
import { Phone, CalendarDays, MapPin, Search, TicketX, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function Bookings() {
  const [phoneInput, setPhoneInput] = useState("");
  const [activePhone, setActivePhone] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useGetBookingsByPhone(activePhone, {
    query: {
      enabled: activePhone.length === 10,
      queryKey: getGetBookingsByPhoneQueryKey(activePhone)
    }
  });

  const cancelBooking = useCancelBooking();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput.length === 10) {
      setActivePhone(phoneInput);
    } else {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = (bookingId: number) => {
    if (confirm("Are you sure you want to cancel this ticket?")) {
      cancelBooking.mutate({ id: bookingId }, {
        onSuccess: () => {
          toast({
            title: "Booking Cancelled",
            description: "Your ticket has been cancelled successfully."
          });
          queryClient.invalidateQueries({ queryKey: getGetBookingsByPhoneQueryKey(activePhone) });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Could not cancel booking. Please try again.",
            variant: "destructive"
          });
        }
      });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground">Look up your tickets using your phone number.</p>
      </div>

      <Card className="bg-card/50">
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Enter 10-digit mobile number" 
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button type="submit" className="h-12 px-8" disabled={phoneInput.length !== 10}>
              Find Tickets
            </Button>
          </form>
        </CardContent>
      </Card>

      {activePhone && isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-48 bg-muted rounded-xl"></div>
          <div className="h-48 bg-muted rounded-xl"></div>
        </div>
      )}

      {activePhone && !isLoading && bookings && bookings.length === 0 && (
        <Card className="text-center py-16 border-dashed">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">No bookings found</h3>
            <p className="text-muted-foreground">We couldn't find any tickets for {activePhone}.</p>
          </CardContent>
        </Card>
      )}

      {activePhone && !isLoading && bookings && bookings.length > 0 && (
        <div className="space-y-6">
          <h2 className="font-semibold text-lg border-b pb-2">Tickets for {activePhone}</h2>
          
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className={`overflow-hidden transition-all ${booking.status === 'cancelled' ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                <div className={`h-2 w-full ${booking.status === 'cancelled' ? 'bg-muted' : 'bg-primary'}`}></div>
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-[1fr_250px]">
                    <div className="p-6 md:border-r border-border border-dashed space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-bold tracking-tight">{booking.bus.busNumber}</h3>
                          <p className="text-muted-foreground font-medium">{booking.bus.routeName}</p>
                        </div>
                        <Badge className={booking.status === 'confirmed' ? 'bg-green-500' : 'bg-destructive'}>
                          {booking.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Boarding</p>
                          <p className="font-bold text-lg">{booking.boardingStop || booking.bus.from}</p>
                        </div>
                        <div className="flex-1 flex items-center px-4">
                          <div className="h-px bg-border flex-1"></div>
                          <div className="border border-border rounded-full px-2 py-1 text-xs text-muted-foreground font-medium bg-muted">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            Route
                          </div>
                          <div className="h-px bg-border flex-1"></div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Drop</p>
                          <p className="font-bold text-lg">{booking.dropStop || booking.bus.to}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-muted/20 flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold">Date & Time</p>
                          <p className="font-medium flex items-center gap-2 mt-1">
                            <CalendarDays className="w-4 h-4 text-primary" />
                            {format(new Date(booking.journeyDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="flex justify-between items-center bg-background p-3 rounded-lg border">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Seat</p>
                            <p className="font-bold text-xl">{booking.seat.seatNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Fare</p>
                            <p className="font-bold text-xl text-primary">₹{booking.bus.fare}</p>
                          </div>
                        </div>
                      </div>
                      
                      {booking.status === 'confirmed' && (
                        <Button 
                          variant="outline" 
                          className="w-full text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelBooking.isPending}
                        >
                          <TicketX className="w-4 h-4 mr-2" />
                          Cancel Ticket
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
