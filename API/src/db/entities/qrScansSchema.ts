import { pgTable, uuid, timestamp, text } from "drizzle-orm/pg-core"; // Import text
import { ticketOrders } from "./ticketOrdersSchema"; // Import ticketOrders schema for FK
import { profiles } from "./profilesSchema"; // Import profiles schema for FK
import { qrScanResultEnum } from "./enums"; // Import the enum

export const qrScans = pgTable("qr_scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketOrderId: uuid("ticket_order_id").notNull().references(() => ticketOrders.id), // Changed FK to ticketOrders.id (UUID), added notNull
  scannedBy: uuid("scanned_by").notNull().references(() => profiles.id), // Changed FK to profiles.id (UUID), added notNull
  scannedAt: timestamp("scanned_at").notNull().defaultNow(), // Added defaultNow()
  device: text("device"), // Added device, nullable
  location: text("location"), // Added location, nullable
  result: qrScanResultEnum("result").notNull(), // Added result with enum
});
