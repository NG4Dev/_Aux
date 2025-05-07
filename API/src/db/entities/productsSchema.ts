import { pgTable, uuid, text, decimal } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  price: decimal("price").notNull(),
});
