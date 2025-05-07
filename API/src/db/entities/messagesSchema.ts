import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { conversations } from "./conversationsSchema";
import { users } from "./usersSchema";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  senderId: uuid("sender_id").references(() => users.id),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").notNull(),
});
