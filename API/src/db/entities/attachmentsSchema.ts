import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { messages } from "./messagesSchema";

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id").references(() => messages.id),
  url: text("url").notNull(),
  type: text("type").notNull(),
});
