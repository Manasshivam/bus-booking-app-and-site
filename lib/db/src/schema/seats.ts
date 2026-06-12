import { pgTable, serial, text, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { busesTable } from "./buses";

export const seatTypeEnum = pgEnum("seat_type", ["window", "aisle", "middle"]);
export const seatStatusEnum = pgEnum("seat_status", ["available", "booked", "reserved"]);

export const seatsTable = pgTable("seats", {
  id: serial("id").primaryKey(),
  busId: integer("bus_id").notNull().references(() => busesTable.id, { onDelete: "cascade" }),
  seatNumber: text("seat_number").notNull(),
  row: integer("row").notNull(),
  col: integer("col").notNull(),
  type: seatTypeEnum("type").notNull(),
  status: seatStatusEnum("status").notNull().default("available"),
});

export const insertSeatSchema = createInsertSchema(seatsTable).omit({ id: true });
export type InsertSeat = z.infer<typeof insertSeatSchema>;
export type Seat = typeof seatsTable.$inferSelect;
