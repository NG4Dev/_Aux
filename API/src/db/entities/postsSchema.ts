import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./usersSchema";

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id), // FK to users.id (UUID), added notNull
  caption: text("caption"),// Added explicit nullable
  createdAt: timestamp("created_at").notNull().defaultNow(), // Added defaultNow()
  updatedAt: timestamp("updated_at"), // Added explicit nullable
  media: text("media"), // Added explicit nullable
});
