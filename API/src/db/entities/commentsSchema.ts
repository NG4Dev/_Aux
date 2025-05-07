import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { posts } from "./postsSchema";
import { users } from "./usersSchema";

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id),
  userId: uuid("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull(),
  repliedToCommentId: uuid("replied_to_comment_id").references((): any => comments.id), // Use any for now to resolve circular dependency
});
