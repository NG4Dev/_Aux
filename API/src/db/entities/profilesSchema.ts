import { pgTable, uuid, text } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name"),
  email: text("email"),
  username: text("username"),
  avatarUrl: text("avatar_url"),
  pushToken: text("push_token"),
});
