import { pgTable, uuid, Check } from "drizzle-orm/pg-core"; // Import Check
import { sql } from "drizzle-orm"; // Import sql
import { users } from "./usersSchema"; // Import users schema for FK
import { businesses } from "./businessesSchema"; // Import businesses schema for FK

export const followers = pgTable("followers", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: uuid("follower_id").notNull().references(() => users.id), // FK to users.id
  followingUserId: uuid("following_user_id").references(() => users.id), // FK to users.id, nullable
  followingBusinessId: uuid("following_business_id").references(() => businesses.id), // FK to businesses.id, nullable
}, (table) => {
  return {
    // Check constraint: Either followingUserId OR followingBusinessId is not null, but not both
    followingCheck: sql`("following_user_id" IS NOT NULL AND "following_business_id" IS NULL) OR ("following_user_id" IS NULL AND "following_business_id" IS NOT NULL)`.as('either_user_or_business_followed'),
  }
});
