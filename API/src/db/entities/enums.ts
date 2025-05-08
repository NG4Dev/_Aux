import { pgEnum } from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", ["Active", "Inactive", "Deleted"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "cancelled"]);
export const ticketTierEnum = pgEnum("ticket_tier", ["VIP", "GA", "Other"]);
export const escrowStatusEnum = pgEnum("escrow_status", ["pending", "completed", "cancelled"]);
export const guestListStatusEnum = pgEnum("guest_list_status", ["confirmed", "pending", "declined"]);
export const qrScanResultEnum = pgEnum("qr_scan_result", ["success", "failure"]);
export const conversationTypeEnum = pgEnum("conversation_type", ["one-on-one", "group"]);
export const attachmentTypeEnum = pgEnum("attachment_type", ["image", "file", "video", "giphy", "audio", "url_preview"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired"]);
