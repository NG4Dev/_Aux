import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { conversations } from "./conversationsSchema";
import { users } from "./usersSchema"; // Import profiles schema for FK
// Removed import for users

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id), // FK to conversations.id (UUID), added notNull
  fromId: uuid("from_id").notNull().references(() => users.id), // Changed column name and FK to profiles.id (UUID), added notNull
  message: text("message").notNull(), // Changed column name, kept notNull
  createdAt: timestamp("created_at").notNull().defaultNow(), // Changed column name, added defaultNow()
});
