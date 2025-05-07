import { pgTable, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profilesSchema"; // Import profiles schema for FK
// Removed import for users

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id").notNull().references(() => profiles.id), // Changed FK to profiles.id (UUID), added notNull
  subscribedToId: uuid("subscribed_to_id").notNull().references(() => profiles.id), // Changed FK to profiles.id (UUID), added notNull
});
