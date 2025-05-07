import { pgTable, uuid, integer, text, foreignKey } from "drizzle-orm/pg-core";
import { ticketResales } from "./ticketResalesSchema";
import { users } from "./usersSchema";

export const resaleRatings = pgTable("resale_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id"),
  raterId: uuid("rater_id").references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
}, (t) => ({
  fk: foreignKey({ columns: [t.transactionId], foreignColumns: [ticketResales.id] }),
}));
