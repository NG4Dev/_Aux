"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

/**
 * Server-side GA4 Measurement Protocol + Mixpanel.
 * Used for purchase confirmation and optional client-relayed events.
 */
export const trackServerEvent = internalAction({
  args: {
    eventName: v.string(),
    mixpanelEventName: v.optional(v.string()),
    clientId: v.string(),
    userId: v.optional(v.string()),
    params: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_MP_API_SECRET;
    const mixpanelToken = process.env.MIXPANEL_TOKEN;
    const params =
      args.params && typeof args.params === "object"
        ? (args.params as Record<string, unknown>)
        : {};

    if (measurementId && apiSecret) {
      try {
        await fetch(
          `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${encodeURIComponent(apiSecret)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client_id: args.clientId,
              user_id: args.userId,
              events: [
                {
                  name: args.eventName,
                  params: {
                    ...params,
                    engagement_time_msec: 1,
                  },
                },
              ],
            }),
          },
        );
      } catch (error) {
        console.error("GA4 MP track failed", error);
      }
    }

    if (mixpanelToken && args.mixpanelEventName) {
      try {
        await fetch("https://api.mixpanel.com/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([
            {
              event: args.mixpanelEventName,
              properties: {
                token: mixpanelToken,
                distinct_id: args.userId ?? args.clientId,
                ...params,
              },
            },
          ]),
        });
      } catch (error) {
        console.error("Mixpanel track failed", error);
      }
    }

    return null;
  },
});
