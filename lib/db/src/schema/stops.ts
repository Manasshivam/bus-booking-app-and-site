import { pgTable, serial, text, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { busesTable } from "./buses";

export const stopsTable = pgTable("stops", {
  id: serial("id").primaryKey(),
  busId: integer("bus_id").notNull().references(() => busesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  distanceKm: numeric("distance_km", { precision: 6, scale: 2 }),
});

export const insertStopSchema = createInsertSchema(stopsTable).omit({ id: true });
export type InsertStop = z.infer<typeof insertStopSchema>;
export type Stop = typeof stopsTable.$inferSelect;
