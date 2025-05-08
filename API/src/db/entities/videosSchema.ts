import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { users } from "./usersSchema"; // Import users schema for FK
import { businesses } from "./businessesSchema"; // Import businesses schema for FK

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => users.id), // Changed FK to users.id (UUID), added notNull
  businessId: uuid("business_id").notNull().references(() => businesses.id), // Added FK to businesses
  url: text("url").notNull(),
  firstFrameUrl: text("first_frame_url"), // nullable by default
  blurHash: text("blur_hash"), // nullable by default
});
