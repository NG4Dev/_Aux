import { pgTable, uuid } from "drizzle-orm/pg-core";
import { posts } from "./postsSchema";
import { users } from "./usersSchema"; // Import users schema for FK
import { comments } from "./commentsSchema";
// Removed import for profiles

export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id), // FK to posts.id (UUID), nullable by default
  userId: uuid("user_id").notNull().references(() => users.id), // Changed FK to users.id (UUID), added notNull
  commentId: uuid("comment_id").references(() => comments.id), // FK to comments.id (UUID), nullable by default
});
