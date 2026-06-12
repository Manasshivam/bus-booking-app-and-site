import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useGetBus, getGetBusQueryKey,
  useGetBusSeats, getGetBusSeatsQueryKey,
  useCreateBooking
} from "@workspace/api-client-react";
import { ArrowLeft, User, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const bookingSchema = z.object({
  passengerName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Must be a valid 10-digit phone number"),
  boardingStop: z.string().optional(),
  dropStop: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookSeat() {
  const [, params] = useRoute("/buses/:id/book");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = Number(params?.id);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const { data: bus, isLoading: busLoading } = useGetBus(id, {
    query: { enabled: !!id, queryKey: getGetBusQueryKey(id) }
  });

  const { data: seats, isLoading: seatsLoading } = useGetBusSeats(id, {
    query: { enabled: !!id, queryKey: getGetBusSeatsQueryKey(id) }
  });

  const createBooking = useCreateBooking();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      passengerName: "",
      phone: "",
      boardingStop: "",
      dropStop: "",
    }
  });

  if (busLoading || seatsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted w-32 rounded"></div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-[500px] bg-muted rounded-xl"></div>
          <div className="h-[400px] bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!bus || !seats) {
    return <div className="text-center py-12 text-destructive">Unable to load booking details.</div>;
  }

  // Organize seats into rows
  const maxRow = Math.max(...seats.map(s => s.row));
  const rows = Array.from({ length: maxRow }, (_, i) => {
    return seats.filter(s => s.row === i + 1).sort((a, b) => a.col - b.col);
  });

  const onSubmit = (values: BookingFormValues) => {
    if (!selectedSeat) {
      toast({
        title: "Seat required",
        description: "Please select a seat from the layout.",
        variant: "destructive"
      });
      return;
    }

    createBooking.mutate({
      data: {
        busId: bus.id,
        seatId: selectedSeat,
        passengerName: values.passengerName,
        phone: values.phone,
        boardingStop: values.boardingStop || bus.from,
        dropStop: values.dropStop || bus.to,
        journeyDate: bus.departureTime.split('T')[0] // Use bus departure date
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Booking Confirmed!",
          description: "Your seat has been reserved successfully.",
        });
        setLocation('/bookings');
      },
      onError: (err: any) => {
        toast({
          title: "Booking Failed",
          description: err.message || "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  const selectedSeatObj = seats.find(s => s.id === selectedSeat);

  return (
    <div className="space-y-6 pb-12">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => setLocation(`/buses/${id}`)}>
        <ArrowLeft className="h-4 w-4" /> Back to bus details
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Book Your Seat</h1>
        <p className="text-muted-foreground text-lg">
          {bus.busNumber} • {bus.from} to {bus.to}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-border/60 bg-card/50 shadow-sm">
          <CardHeader>
            <CardTitle>Seat Layout</CardTitle>
            <CardDescription>Select an available seat (front of bus is top)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-secondary/20 p-6 rounded-2xl border-2 border-border/40 mx-auto max-w-sm">
              <div className="w-full h-8 bg-muted rounded-t-xl mb-8 flex items-center justify-center text-xs text-muted-foreground font-medium uppercase tracking-widest border-b-2 border-border/40">
                Driver
              </div>
              
              <div className="flex flex-col gap-4">
                {rows.map((row, i) => (
                  <div key={i} className="flex justify-between">
                    {/* Left side (cols 1, 2) */}
                    <div className="flex gap-2">
                      {row.filter(s => s.col <= 2).map(seat => (
                        <button
                          key={seat.id}
                          disabled={seat.status !== 'available'}
                          onClick={() => setSelectedSeat(seat.id)}
                          className={`
                            w-12 h-12 rounded-t-xl rounded-b flex items-center justify-center text-sm font-bold transition-all
                            ${seat.status !== 'available' ? 'bg-muted text-muted-foreground/50 cursor-not-allowed border border-border/50' : 
                              selectedSeat === seat.id ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2' : 
                              'bg-card text-foreground hover:border-primary border border-border shadow-sm hover:shadow'}
                          `}
                        >
                          {seat.seatNumber}
                        </button>
                      ))}
                    </div>
                    
                    {/* Aisle */}
                    <div className="w-8"></div>
                    
                    {/* Right side (cols 3, 4, 5) */}
                    <div className="flex gap-2">
                      {row.filter(s => s.col > 2).map(seat => (
                        <button
                          key={seat.id}
                          disabled={seat.status !== 'available'}
                          onClick={() => setSelectedSeat(seat.id)}
                          className={`
                            w-12 h-12 rounded-t-xl rounded-b flex items-center justify-center text-sm font-bold transition-all
                            ${seat.status !== 'available' ? 'bg-muted text-muted-foreground/50 cursor-not-allowed border border-border/50' : 
                              selectedSeat === seat.id ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2' : 
                              'bg-card text-foreground hover:border-primary border border-border shadow-sm hover:shadow'}
                          `}
                        >
                          {seat.seatNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-card border rounded-t-sm"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary rounded-t-sm"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted border rounded-t-sm"></div>
                <span>Booked</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Passenger Details</CardTitle>
            <CardDescription>Enter details to secure your ticket.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="booking-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passengerName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" /> Full Name
                </Label>
                <Input 
                  id="passengerName" 
                  placeholder="Ram Kumar" 
                  {...form.register("passengerName")} 
                />
                {form.formState.errors.passengerName && (
                  <p className="text-sm text-destructive">{form.formState.errors.passengerName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" /> Mobile Number
                </Label>
                <Input 
                  id="phone" 
                  placeholder="9876543210" 
                  maxLength={10}
                  {...form.register("phone")} 
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="boardingStop" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" /> Boarding Stop
                  </Label>
                  <select 
                    id="boardingStop" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register("boardingStop")}
                  >
                    <option value="">{bus.from} (Default)</option>
                    {bus.stops?.map(stop => (
                      <option key={stop.id} value={stop.name}>{stop.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dropStop" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" /> Drop Stop
                  </Label>
                  <select 
                    id="dropStop" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register("dropStop")}
                  >
                    <option value="">{bus.to} (Default)</option>
                    {bus.stops?.map(stop => (
                      <option key={stop.id} value={stop.name}>{stop.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-4 border-t bg-muted/20 mt-4 p-6">
            <div className="w-full flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Selected Seat</p>
                <p className="font-bold text-xl">{selectedSeatObj ? selectedSeatObj.seatNumber : "--"}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                <p className="font-bold text-2xl text-primary">₹{selectedSeat ? bus.fare : "0"}</p>
              </div>
            </div>
            
            <Button 
              type="submit" 
              form="booking-form"
              className="w-full text-lg h-12" 
              disabled={createBooking.isPending}
            >
              {createBooking.isPending ? "Confirming..." : "Confirm Booking"}
            </Button>
            <p className="text-xs text-center text-muted-foreground w-full">
              Payment will be collected by conductor during journey.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
