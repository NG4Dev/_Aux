import { pgTable, uuid, integer, text, Check } from "drizzle-orm/pg-core"; // Import integer, text, Check
import { sql } from "drizzle-orm"; // Import sql
import { posts } from "./postsSchema"; // Import posts schema for FK
import { images } from "./imagesSchema"; // Import images schema for FK
import { videos } from "./videosSchema"; // Import videos schema for FK

export const postMedia = pgTable("post_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id), // FK to posts.id
  imageId: uuid("image_id").references(() => images.id), // FK to images.id, nullable
  videoId: uuid("video_id").references(() => videos.id), // FK to videos.id, nullable
  musicUrl: text("music_url"), // Music URL, nullable
  order: integer("order").notNull(), // Order of media in post
}, (table) => {
  return {
    // Check constraint: Exactly one of imageId, videoId, or musicUrl is not null
    mediaTypeCheck: sql`(
      ("image_id" IS NOT NULL AND "video_id" IS NULL AND "music_url" IS NULL) OR
      ("image_id" IS NULL AND "video_id" IS NOT NULL AND "music_url" IS NULL) OR
      ("image_id" IS NULL AND "video_id" IS NULL AND "music_url" IS NOT NULL)
    )`.as('exactly_one_media_type'),
  }
});
