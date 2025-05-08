import { pgTable, uuid, text, timestamp, Check } from "drizzle-orm/pg-core"; // Import Check, text, timestamp
import { sql } from "drizzle-orm"; // Import sql
import { users } from "./usersSchema"; // Import users schema for FK
import { businesses } from "./businessesSchema"; // Import businesses schema for FK
import { subscriptionStatusEnum } from "./enums"; // Import the enum

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id), // FK to users.id, nullable
  businessId: uuid("business_id").references(() => businesses.id), // FK to businesses.id, nullable
  planType: text("plan_type").notNull(), // Plan type (text for now)
  startDate: timestamp("start_date").notNull(), // Subscription start date
  endDate: timestamp("end_date"), // Subscription end date, nullable
  status: subscriptionStatusEnum("status").notNull().default("active"), // Subscription status with enum and default
}, (table) => {
  return {
    // Check constraint: Either userId OR businessId is not null, but not both
    subscriberCheck: sql`("user_id" IS NOT NULL AND "business_id" IS NULL) OR ("user_id" IS NULL AND "business_id" IS NOT NULL)`.as('either_user_or_business_subscribed'),
  }
});
