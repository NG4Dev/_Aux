import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { businesses } from "./businessesSchema"; // Import businesses schema for FK

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => businesses.id), // Changed FK to businesses
  name: text("name").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"), // Removed notNull to make it nullable
});
