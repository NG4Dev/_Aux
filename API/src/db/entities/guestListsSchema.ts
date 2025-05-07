import { pgTable, uuid } from "drizzle-orm/pg-core";
import { events } from "./eventsSchema";
import { profiles } from "./profilesSchema"; // Import profiles schema for FK
import { guestListStatusEnum } from "./enums"; // Import the enum

export const guestLists = pgTable("guest_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id), // FK to events.id (UUID), added notNull
  attendeeId: uuid("attendee_id").notNull().references(() => profiles.id), // Changed FK to profiles.id (UUID), added notNull
  status: guestListStatusEnum("status").notNull().default("pending"), // Added status with enum and default
});
