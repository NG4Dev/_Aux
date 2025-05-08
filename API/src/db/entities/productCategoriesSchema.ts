import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";
import { businesses } from "./businessesSchema"; // Import businesses schema for FK

export const productCategories = pgTable("product_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id), // FK to businesses.id
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"), // nullable by default
});
