import { pgTable, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./usersSchema";
import { events } from "./eventsSchema";

export const ticketOrders = pgTable("ticket_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: uuid("buyer_id").references(() => users.id),
  eventId: uuid("event_id").references(() => events.id),
  quantity: integer("quantity").notNull(),
  orderedAt: timestamp("ordered_at").notNull(),
});
