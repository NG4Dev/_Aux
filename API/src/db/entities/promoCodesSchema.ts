import { pgTable, uuid, text, numeric, timestamp, integer } from "drizzle-orm/pg-core"; // Import numeric, timestamp, integer
import { products } from "./productsSchema"; // Import products schema for FK

export const promoCodes = pgTable("promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  productId: integer("product_id").references(() => products.id), // FK to products.id (now integer)
  discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }), // Added percentage
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }), // Added amount
  validFrom: timestamp("valid_from"), // Added valid_from
  validUntil: timestamp("valid_until"), // Added valid_until
  usageLimit: integer("usage_limit"), // Added usage_limit
  usageCount: integer("usage_count").default(0), // Added usage_count with default
});
