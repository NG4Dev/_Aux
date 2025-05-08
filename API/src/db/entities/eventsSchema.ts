import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"; // Import boolean
import { businesses } from "./businessesSchema"; // Import businesses schema for FK
import { eventCategories } from "./eventCategoriesSchema"; // Import eventCategories schema for FK

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => businesses.id), // Changed FK to businesses
  merchantId: uuid("merchant_id").notNull().references(() => businesses.id), // Added FK to businesses for merchant
  name: text("name").notNull(),
  location: text("location"), // Added location, nullable by default
  categoryId: uuid("category_id").references(() => eventCategories.id), // Added FK to eventCategories, nullable by default
  description: text("description"), // Added description, nullable by default
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"), // Removed notNull to make it nullable
  inAppTicketingEnabled: boolean("in_app_ticketing_enabled").notNull().default(false), // Added in_app_ticketing_enabled with default
  externalTicketingUrl: text("external_ticketing_url"), // Added external_ticketing_url, nullable by default
});
