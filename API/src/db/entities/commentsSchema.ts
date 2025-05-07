import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { posts } from "./postsSchema";
import { profiles } from "./profilesSchema"; // Import profiles schema for FK
// Removed import for users

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id), // FK to posts.id (UUID), added notNull
  userId: uuid("user_id").notNull().references(() => profiles.id), // Changed FK to profiles.id (UUID), added notNull
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(), // Added defaultNow()
  repliedToCommentId: uuid("replied_to_comment_id").references((): any => comments.id), // Self-referencing FK, nullable by default
});
