import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { tickets } from "./ticketsSchema";
import { users } from "./usersSchema";

export const ticketResales = pgTable("ticket_resales", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").references(() => tickets.id),
  buyerId: uuid("buyer_id").references(() => users.id),
  sellerId: uuid("seller_id").references(() => users.id),
  resaleTime: timestamp("resale_time").notNull(),
});
