import { pgTable, uuid, numeric, timestamp, integer } from "drizzle-orm/pg-core"; // Import numeric, timestamp, integer
import { events } from "./eventsSchema";
import { ticketTierEnum, refundPolicyEnum } from "./enums"; // Import the enums

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id), // FK to events.id (UUID), added notNull
  tier: ticketTierEnum("tier").notNull().default("GA"), // Added tier with enum and default
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // Added price, notNull
  saleStartDate: timestamp("sale_start_date"), // Added sale_start_date, nullable by default
  saleEndDate: timestamp("sale_end_date"), // Added sale_end_date, nullable by default
  ticketLimit: integer("ticket_limit"), // Added ticket_limit, nullable by default
  refundPolicy: refundPolicyEnum("refund_policy").notNull().default("no_refunds"), // Added refund_policy with enum and default
});
