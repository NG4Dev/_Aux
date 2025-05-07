import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { conversationTypeEnum } from "./enums"; // Import the enum

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: conversationTypeEnum("type").notNull(), // Changed to enum
  name: text("name"), // nullable by default
  createdAt: timestamp("created_at").notNull().defaultNow(), // Added defaultNow()
});
