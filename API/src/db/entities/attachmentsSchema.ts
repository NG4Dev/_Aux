import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { messages } from "./messagesSchema";
import { attachmentTypeEnum } from "./enums"; // Import the enum

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id").notNull().references(() => messages.id), // FK to messages.id (UUID), added notNull
  url: text("url").notNull(),
  type: attachmentTypeEnum("type").notNull(), // Changed to enum
  title: text("title"), // Added title, nullable by default
});
