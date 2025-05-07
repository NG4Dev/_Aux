import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull(),
});
