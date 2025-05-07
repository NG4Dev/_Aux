import { pgTable, uuid, boolean } from "drizzle-orm/pg-core";
import { events } from "./eventsSchema";
import { users } from "./usersSchema";

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id),
  ownerId: uuid("owner_id").references(() => users.id),
  isActive: boolean("is_active").notNull(),
});
