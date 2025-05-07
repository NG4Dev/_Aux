import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { users } from "./usersSchema";

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id),
  url: text("url").notNull(),
  blurHash: text("blur_hash"),
});
