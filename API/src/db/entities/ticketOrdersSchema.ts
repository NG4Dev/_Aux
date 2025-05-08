import { pgTable, uuid, integer, timestamp, numeric } from "drizzle-orm/pg-core"; // Import numeric
import { tickets } from "./ticketsSchema"; // Import tickets schema for FK
import { users } from "./usersSchema"; // Import profiles schema for FK
import { orderStatusEnum } from "./enums"; // Import the enum

export const ticketOrders = pgTable("ticket_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id), // FK to tickets.id (UUID), added notNull
  buyerId: uuid("buyer_id").notNull().references(() => users.id), // FK to profiles.id (UUID), added notNull
  quantity: integer("quantity").notNull(),
  orderedAt: timestamp("ordered_at").notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(), // Added total_price, notNull
  orderStatus: orderStatusEnum("order_status").notNull().default("pending"), // Added order_status with enum and default
});
