import { pgTable, uuid } from "drizzle-orm/pg-core";
import { events } from "./eventsSchema";
import { users } from "./usersSchema";

export const guestLists = pgTable("guest_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id),
  userId: uuid("user_id").references(() => users.id),
});
