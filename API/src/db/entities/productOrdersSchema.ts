import { pgTable, uuid, integer, timestamp, numeric } from "drizzle-orm/pg-core"; // Import numeric
import { products } from "./productsSchema";
import { profiles } from "./profilesSchema"; // Import profiles schema for FK
import { orderStatusEnum } from "./enums"; // Import the enum

export const productOrders = pgTable("product_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: integer("product_id").references(() => products.id).notNull(), // FK to products.id (integer), added notNull
  buyerId: uuid("buyer_id").references(() => profiles.id).notNull(), // FK to profiles.id (UUID), added notNull
  quantity: integer("quantity").notNull(),
  orderTime: timestamp("order_time").notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(), // Added total_price, notNull
  orderStatus: orderStatusEnum("order_status").notNull().default("pending"), // Added order_status with enum and default
});
