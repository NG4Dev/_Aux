import { pgTable, serial, uuid, varchar, text, doublePrecision } from "drizzle-orm/pg-core"; // Import serial and doublePrecision
import { businesses } from "./businessesSchema"; // Import businesses schema for FK

export const products = pgTable("products", {
  id: serial("id").primaryKey(), // Changed to serial PK
  organizationId: uuid("organization_id").notNull().references(() => businesses.id), // Added FK to businesses
  name: varchar("name", { length: 255 }).notNull(), // Changed to varchar(255)
  description: text("description"), // Removed explicit nullable
  image: text("image_url"), // Changed to text
  price: doublePrecision("price").notNull(), // Changed to doublePrecision
});
