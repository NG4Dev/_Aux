import { pgTable, uuid, integer, text } from "drizzle-orm/pg-core"; // Import numeric
import { ticketResales } from "./ticketResalesSchema"; // Import ticketResales schema for FK
import { profiles } from "./profilesSchema"; // Import profiles schema for FK

export const resaleRatings = pgTable("resale_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  resaleId: uuid("resale_id").notNull().references(() => ticketResales.id), // Changed column name and FK definition
  reviewerId: uuid("reviewer_id").notNull().references(() => profiles.id), // Changed column name and FK reference
  rating: integer("rating").notNull(),
  comment: text("comment"), // Added explicit nullable
});
