import { pgTable, uuid, integer, text, numeric, timestamp } from "drizzle-orm/pg-core"; // Import numeric, timestamp
import { ticketResales } from "./ticketResalesSchema"; // Import ticketResales schema for FK
import { users } from "./usersSchema"; // Import users schema for FK
import { escrowStatusEnum } from "./enums"; // Import the enum

export const resaleRatings = pgTable("resale_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  resaleId: uuid("resale_id").notNull().references(() => ticketResales.id), // FK to ticketResales.id (UUID), not null
  reviewerId: uuid("reviewer_id").notNull().references(() => users.id), // FK to users.id (UUID), not null
  buyerId: uuid("buyer_id").references(() => users.id), // FK to users.id (UUID), nullable
  rating: integer("rating").notNull(),
  comment: text("comment"), // nullable by default
  resaleTime: timestamp("resale_time").notNull(), // Added resale_time, not null
  resalePrice: numeric("resale_price", { precision: 10, scale: 2 }).notNull(), // Added resale_price, not null
  escrowStatus: escrowStatusEnum("escrow_status").notNull().default("pending"), // Added escrow_status with enum and default
});
