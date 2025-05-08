import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./usersSchema";
import { businesses } from "./businessesSchema"; // Import businesses schema for FK

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id), // FK to users.id (UUID), added notNull
  businessId: uuid("business_id").notNull().references(() => businesses.id), // Added FK to businesses
  caption: text("caption"),// Added explicit nullable
  createdAt: timestamp("created_at").notNull().defaultNow(), // Added defaultNow()
  updatedAt: timestamp("updated_at"), // Added explicit nullable
});
