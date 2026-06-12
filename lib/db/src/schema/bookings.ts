import { pgTable, serial, text, integer, date, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { busesTable } from "./buses";
import { seatsTable } from "./seats";

export const bookingStatusEnum = pgEnum("booking_status", ["confirmed", "cancelled"]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  busId: integer("bus_id").notNull().references(() => busesTable.id),
  seatId: integer("seat_id").notNull().references(() => seatsTable.id),
  passengerName: text("passenger_name").notNull(),
  phone: text("phone").notNull(),
  journeyDate: date("journey_date", { mode: "string" }).notNull(),
  boardingStop: text("boarding_stop"),
  dropStop: text("drop_stop"),
  status: bookingStatusEnum("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
