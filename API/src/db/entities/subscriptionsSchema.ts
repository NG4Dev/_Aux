import { pgTable, uuid } from "drizzle-orm/pg-core";
import { users } from "./usersSchema";

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id").references(() => users.id),
  subscribedToId: uuid("subscribed_to_id").references(() => users.id),
});
