import { Router, type IRouter } from "express";
import { eq, and, ilike, sql } from "drizzle-orm";
import { db, busesTable, stopsTable, seatsTable, bookingsTable } from "@workspace/db";
import {
  GetBusParams,
  GetBusSeatsParams,
  ListBusesQueryParams,
  ListBusesResponse,
  GetBusResponse,
  GetBusSeatsResponse,
  GetBusSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/buses/summary", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const [busStats] = await db
    .select({
      totalBuses: sql<number>`count(*)::int`,
      runningNow: sql<number>`count(*) filter (where ${busesTable.status} = 'running')::int`,
      scheduledToday: sql<number>`count(*) filter (where ${busesTable.status} = 'scheduled')::int`,
    })
    .from(busesTable);

  const [bookingStats] = await db
    .select({
      totalBookingsToday: sql<number>`count(*)::int`,
    })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.journeyDate, today), eq(bookingsTable.status, "confirmed")));

  const [seatStats] = await db
    .select({
      availableSeatsTotal: sql<number>`count(*)::int`,
    })
    .from(seatsTable)
    .where(eq(seatsTable.status, "available"));

  const summary = {
    totalBuses: busStats?.totalBuses ?? 0,
    runningNow: busStats?.runningNow ?? 0,
    scheduledToday: busStats?.scheduledToday ?? 0,
    totalBookingsToday: bookingStats?.totalBookingsToday ?? 0,
    availableSeatsTotal: seatStats?.availableSeatsTotal ?? 0,
  };

  res.json(GetBusSummaryResponse.parse(summary));
});

router.get("/buses", async (req, res): Promise<void> => {
  const query = ListBusesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { from, to } = query.data;

  const buses = await db.select().from(busesTable).where(
    and(
      from ? ilike(busesTable.from, `%${from}%`) : undefined,
      to ? ilike(busesTable.to, `%${to}%`) : undefined,
    )
  );

  const busesWithSeats = await Promise.all(
    buses.map(async (bus) => {
      const [{ available }] = await db
        .select({ available: sql<number>`count(*)::int` })
        .from(seatsTable)
        .where(and(eq(seatsTable.busId, bus.id), eq(seatsTable.status, "available")));
      return {
        ...bus,
        fare: Number(bus.fare),
        availableSeats: available,
      };
    })
  );

  res.json(ListBusesResponse.parse(busesWithSeats));
});

router.get("/buses/track/:busNumber", async (req, res): Promise<void> => {
  const rawBusNumber = Array.isArray(req.params.busNumber) ? req.params.busNumber[0] : req.params.busNumber;

  const [bus] = await db
    .select()
    .from(busesTable)
    .where(eq(busesTable.busNumber, rawBusNumber));

  if (!bus) {
    res.status(404).json({ error: "Bus not found" });
    return;
  }

  const stops = await db
    .select()
    .from(stopsTable)
    .where(eq(stopsTable.busId, bus.id))
    .orderBy(stopsTable.order);

  if (stops.length === 0) {
    res.status(404).json({ error: "Bus has no stops configured" });
    return;
  }

  // Simulate live tracking — determine current stop based on time since departure
  const now = new Date();
  const [depHour, depMin] = bus.departureTime.split(":").map(Number);
  const depMinutesFromMidnight = depHour * 60 + depMin;
  const nowMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
  const minutesElapsed = nowMinutesFromMidnight - depMinutesFromMidnight;

  let currentStopIndex = 0;
  if (bus.status === "running" && minutesElapsed > 0) {
    for (let i = stops.length - 1; i >= 0; i--) {
      if (stops[i].estimatedMinutes <= minutesElapsed) {
        currentStopIndex = i;
        break;
      }
    }
  } else if (bus.status === "completed") {
    currentStopIndex = stops.length - 1;
  }

  const currentStop = stops[currentStopIndex];
  const nextStop = currentStopIndex < stops.length - 1 ? stops[currentStopIndex + 1] : null;
  const lastStop = stops[stops.length - 1];

  const etaMinutes = nextStop
    ? Math.max(0, nextStop.estimatedMinutes - minutesElapsed)
    : null;

  const progressPercent = lastStop.estimatedMinutes > 0
    ? Math.min(100, Math.round((currentStop.estimatedMinutes / lastStop.estimatedMinutes) * 100))
    : 0;

  const tracking = {
    busId: bus.id,
    busNumber: bus.busNumber,
    routeName: bus.routeName,
    from: bus.from,
    to: bus.to,
    status: bus.status,
    currentStop: {
      id: currentStop.id,
      name: currentStop.name,
      order: currentStop.order,
      estimatedMinutes: currentStop.estimatedMinutes,
      distanceKm: currentStop.distanceKm ? Number(currentStop.distanceKm) : undefined,
    },
    nextStop: nextStop ? {
      id: nextStop.id,
      name: nextStop.name,
      order: nextStop.order,
      estimatedMinutes: nextStop.estimatedMinutes,
      distanceKm: nextStop.distanceKm ? Number(nextStop.distanceKm) : undefined,
    } : null,
    etaMinutes,
    progressPercent,
    lastUpdated: now.toISOString(),
  };

  res.json(tracking);
});

router.get("/buses/:id", async (req, res): Promise<void> => {
  const params = GetBusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bus] = await db
    .select()
    .from(busesTable)
    .where(eq(busesTable.id, params.data.id));

  if (!bus) {
    res.status(404).json({ error: "Bus not found" });
    return;
  }

  const stops = await db
    .select()
    .from(stopsTable)
    .where(eq(stopsTable.busId, bus.id))
    .orderBy(stopsTable.order);

  const [{ available }] = await db
    .select({ available: sql<number>`count(*)::int` })
    .from(seatsTable)
    .where(and(eq(seatsTable.busId, bus.id), eq(seatsTable.status, "available")));

  const busDetail = {
    ...bus,
    fare: Number(bus.fare),
    availableSeats: available,
    stops: stops.map((s) => ({
      ...s,
      distanceKm: s.distanceKm ? Number(s.distanceKm) : undefined,
    })),
  };

  res.json(GetBusResponse.parse(busDetail));
});

router.get("/buses/:id/seats", async (req, res): Promise<void> => {
  const params = GetBusSeatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const seats = await db
    .select()
    .from(seatsTable)
    .where(eq(seatsTable.busId, params.data.id))
    .orderBy(seatsTable.row, seatsTable.col);

  res.json(GetBusSeatsResponse.parse(seats));
});

export default router;
