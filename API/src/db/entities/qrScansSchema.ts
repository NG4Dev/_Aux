import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { tickets } from "./ticketsSchema";
import { users } from "./usersSchema";

export const qrScans = pgTable("qr_scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").references(() => tickets.id),
  scannerId: uuid("scanner_id").references(() => users.id),
  scannedAt: timestamp("scanned_at").notNull(),
});
