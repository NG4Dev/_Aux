import { pgTable, uuid, numeric } from "drizzle-orm/pg-core"; // Import numeric
import { events } from "./eventsSchema";
import { ticketTierEnum } from "./enums"; // Import the enum

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id), // FK to events.id (UUID), added notNull
  tier: ticketTierEnum("tier").notNull().default("GA"), // Added tier with enum and default
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // Added price, notNull
});
