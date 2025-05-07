import { pgTable, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { products } from "./productsSchema";
import { users } from "./usersSchema";

export const productOrders = pgTable("product_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id),
  buyerId: uuid("buyer_id").references(() => users.id),
  quantity: integer("quantity").notNull(),
  orderTime: timestamp("order_time").notNull(),
});
