import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { profiles } from "./profilesSchema"; // Import profiles schema for FK

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => profiles.id), // Changed FK to profiles.id (UUID), added notNull
  url: text("url").notNull(),
  firstFrameUrl: text("first_frame_url"), // nullable by default
  blurHash: text("blur_hash"), // nullable by default
});
