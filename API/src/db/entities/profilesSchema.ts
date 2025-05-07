import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { userStatusEnum } from "./enums"; // Import the enum

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  // firstName: varchar("first_name", { length: 255 }).notNull(),
  // lastName: varchar("last_name", { length: 255 }).notNull(),
  emailAddress: varchar("email_address", { length: 255 }).notNull().unique(),
  dateCreated: timestamp("date_created").notNull(),
  status: userStatusEnum("status").notNull().default("Active"),
});
