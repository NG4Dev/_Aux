import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./usersSchema";

export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id), // FK to users.id (UUID), added notNull
  caption: text("caption"), // Added caption, nullable
  createdAt: timestamp("created_at").notNull().defaultNow(), // Added defaultNow()
  updatedAt: timestamp("updated_at"), // Added updatedAt, nullable
  media: text("media"), // Changed from mediaUrl, made nullable
});
