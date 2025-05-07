import { pgTable, uuid } from "drizzle-orm/pg-core";
import { posts } from "./postsSchema";
import { users } from "./usersSchema";
import { comments } from "./commentsSchema";

export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id),
  userId: uuid("user_id").references(() => users.id),
  commentId: uuid("comment_id").references(() => comments.id),
});
