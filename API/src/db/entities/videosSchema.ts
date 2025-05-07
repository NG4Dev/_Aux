import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { users } from "./usersSchema";

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id),
  url: text("url").notNull(),
  firstFrameUrl: text("first_frame_url"),
  blurHash: text("blur_hash"),
});
