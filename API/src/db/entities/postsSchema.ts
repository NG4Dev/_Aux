import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./usersSchema";

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  caption: text("caption"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
  media: text("media"),
});
