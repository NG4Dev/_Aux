import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./usersSchema";

export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  mediaUrl: text("media_url").notNull(),
  createdAt: timestamp("created_at").notNull(),
});
