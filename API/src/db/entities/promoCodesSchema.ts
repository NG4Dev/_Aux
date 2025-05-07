import { pgTable, uuid, text, decimal } from "drizzle-orm/pg-core";
import { products } from "./productsSchema";

export const promoCodes = pgTable("promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  productId: uuid("product_id").references(() => products.id),
  discount: decimal("discount").notNull(),
});
