import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, busesTable, seatsTable, bookingsTable, stopsTable } from "@workspace/db";
import {
  CreateBookingBody,
  GetBookingParams,
  CancelBookingParams,
  GetBookingsByPhoneParams,
  GetBookingResponse,
  GetBookingsByPhoneResponse,
} from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

async function buildBookingResponse(booking: typeof bookingsTable.$inferSelect) {
  const [bus] = await db
    .select()
    .from(busesTable)
    .where(eq(busesTable.id, booking.busId));

  const [seat] = await db
    .select()
    .from(seatsTable)
    .where(eq(seatsTable.id, booking.seatId));

  const [{ available }] = await db
    .select({ available: sql<number>`count(*)::int` })
    .from(seatsTable)
    .where(and(eq(seatsTable.busId, booking.busId), eq(seatsTable.status, "available")));

  return {
    ...booking,
    bus: {
      ...bus,
      fare: Number(bus.fare),
      availableSeats: available,
    },
    seat,
  };
}

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { busId, seatId, passengerName, phone, journeyDate, boardingStop, dropStop } = parsed.data;

  // Check bus exists
  const [bus] = await db.select().from(busesTable).where(eq(busesTable.id, busId));
  if (!bus) {
    res.status(404).json({ error: "Bus not found" });
    return;
  }

  // Check seat belongs to bus and is available
  const [seat] = await db
    .select()
    .from(seatsTable)
    .where(and(eq(seatsTable.id, seatId), eq(seatsTable.busId, busId)));

  if (!seat) {
    res.status(404).json({ error: "Seat not found" });
    return;
  }

  if (seat.status !== "available") {
    res.status(400).json({ error: "Seat is no longer available" });
    return;
  }

  // Mark seat as booked
  await db
    .update(seatsTable)
    .set({ status: "booked" })
    .where(eq(seatsTable.id, seatId));

  // Create booking
  const [booking] = await db
    .insert(bookingsTable)
    .values({
      busId,
      seatId,
      passengerName,
      phone,
      journeyDate,
      boardingStop: boardingStop ?? null,
      dropStop: dropStop ?? null,
      status: "confirmed",
    })
    .returning();

  const response = await buildBookingResponse(booking);
  res.status(201).json(GetBookingResponse.parse(response));
});

router.get("/bookings/phone/:phone", async (req, res): Promise<void> => {
  const params = GetBookingsByPhoneParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.phone, params.data.phone));

  const responses = await Promise.all(bookings.map(buildBookingResponse));
  res.json(GetBookingsByPhoneResponse.parse(responses));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const response = await buildBookingResponse(booking);
  res.json(GetBookingResponse.parse(response));
});

router.delete("/bookings/:id", async (req, res): Promise<void> => {
  const params = CancelBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  // Free up the seat
  await db
    .update(seatsTable)
    .set({ status: "available" })
    .where(eq(seatsTable.id, booking.seatId));

  const [updated] = await db
    .update(bookingsTable)
    .set({ status: "cancelled" })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  const response = await buildBookingResponse(updated);
  res.json(GetBookingResponse.parse(response));
});

export default router;
