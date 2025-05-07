import { pgTable, uuid } from "drizzle-orm/pg-core";
import { posts } from "./postsSchema";
import { profiles } from "./profilesSchema"; // Import profiles schema for FK
import { comments } from "./commentsSchema";
// Removed import for users

export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id), // FK to posts.id (UUID), nullable by default
  userId: uuid("user_id").notNull().references(() => profiles.id), // Changed FK to profiles.id (UUID), added notNull
  commentId: uuid("comment_id").references(() => comments.id), // FK to comments.id (UUID), nullable by default
});
