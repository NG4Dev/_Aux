import { pgTable, uuid, text, varchar } from "drizzle-orm/pg-core";
import { guestUsers } from "./guestUserSchema"; // Import guestUser schema for FK

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => guestUsers.id), // Changed FK to guestUser
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  email: varchar("email", { length: 255 }).notNull().unique(),
  tagline: text("tagline"),
  tradingHours: text("trading_hours"),
  address: text("address"),
  phoneNumber: varchar("phone_number", { length: 255 }),
  logoUrl: text("logo_url"),
});
