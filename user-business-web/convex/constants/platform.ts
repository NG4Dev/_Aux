export const TICKET_OFFER_MS = 15 * 60 * 1000;

export const WAITING_LIST_STATUS = {
  WAITING: "waiting",
  OFFERED: "offered",
  PURCHASED: "purchased",
  EXPIRED: "expired",
} as const;

export const TICKET_INSTANCE_STATUS = {
  VALID: "valid",
  USED: "used",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
  LISTED_FOR_RESALE: "listed_for_resale",
} as const;

export const ESCROW_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;
