import { pgTable, serial, text, integer, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const busStatusEnum = pgEnum("bus_status", ["scheduled", "running", "completed", "cancelled"]);

export const busesTable = pgTable("buses", {
  id: serial("id").primaryKey(),
  busNumber: text("bus_number").notNull().unique(),
  routeName: text("route_name").notNull(),
  from: text("from_village").notNull(),
  to: text("to_village").notNull(),
  departureTime: text("departure_time").notNull(),
  arrivalTime: text("arrival_time"),
  totalSeats: integer("total_seats").notNull().default(40),
  fare: numeric("fare", { precision: 8, scale: 2 }).notNull(),
  status: busStatusEnum("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBusSchema = createInsertSchema(busesTable).omit({ id: true, createdAt: true });
export type InsertBus = z.infer<typeof insertBusSchema>;
export type Bus = typeof busesTable.$inferSelect;
