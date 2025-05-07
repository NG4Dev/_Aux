import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { profiles } from "./profilesSchema"; // Import profiles schema for FK

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => profiles.id), // Changed FK to profiles.id (UUID), added notNull
  url: text("url").notNull(),
  blurHash: text("blur_hash"), // Added explicit nullable
});
