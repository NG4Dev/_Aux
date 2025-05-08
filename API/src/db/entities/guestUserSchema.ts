import { pgTable, uuid, varchar, boolean } from "drizzle-orm/pg-core";

export const guestUsers = pgTable("guest_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailAddress: varchar("email_address", { length: 255 }).notNull().unique(),
  isOnboarded: boolean("is_onboarded").notNull().default(false),
});
