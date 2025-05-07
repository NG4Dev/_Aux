import { pgTable, uuid, text, varchar } from "drizzle-orm/pg-core";

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
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
