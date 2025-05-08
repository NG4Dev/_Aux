import { pgTable, uuid, timestamp, numeric } from "drizzle-orm/pg-core"; // Import numeric
import { ticketOrders } from "./ticketOrdersSchema"; // Import ticketOrders schema for FK
import { users } from "./usersSchema"; // Import profiles schema for FK
import { escrowStatusEnum } from "./enums"; // Import the enum

export const ticketResales = pgTable("ticket_resales", {
  id: uuid("id").primaryKey().defaultRandom(),
  originalOrderId: uuid("original_order_id").notNull().references(() => ticketOrders.id), // Changed FK to ticketOrders.id (UUID), added notNull
  sellerId: uuid("seller_id").notNull().references(() => users.id), // Changed FK to profiles.id (UUID), added notNull
  buyerId: uuid("buyer_id").references(() => users.id), // Changed FK to profiles.id (UUID), made nullable
  resaleTime: timestamp("resale_time").notNull(),
  resalePrice: numeric("resale_price", { precision: 10, scale: 2 }).notNull(), // Added resale_price, notNull
  escrowStatus: escrowStatusEnum("escrow_status").notNull().default("pending"), // Added escrow_status with enum and default
});
