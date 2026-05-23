"use node";

import { v } from "convex/values";
import Stripe from "stripe";
import { StripeSubscriptions } from "@convex-dev/stripe";
import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { components, internal } from "./_generated/api";

// Required env vars (set via `npx convex env set ...` on the Convex deployment):
//   STRIPE_SECRET_KEY        â€” Stripe restricted/secret key
//   STRIPE_WEBHOOK_SECRET    â€” used by @convex-dev/stripe registerRoutes
//   SITE_URL                 â€” public origin used for success/cancel URLs
//                              (e.g. https://ycago.com â€” no trailing slash)
//   NEXT_PUBLIC_DEFAULT_CURRENCY â€” pinned currency for the deployment

export const startStripeCheckout = action({
  args: { orderId: v.id("orders") },
  returns: v.object({
    url: v.string(),
    sessionId: v.string(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ url: string; sessionId: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("NOT_SIGNED_IN");
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      throw new Error("STRIPE_SECRET_KEY is not set on the Convex deployment");
    }
    const siteUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    if (!siteUrl) {
      throw new Error(
        "SITE_URL (or NEXT_PUBLIC_APP_URL) is not set on the Convex deployment",
      );
    }

    const orderInfo = await ctx.runQuery(
      internal.orders._getOrderForCheckout,
      { orderId: args.orderId },
    );
    const { order, items, user } = orderInfo;

    if (user.clerkUserId !== identity.subject) {
      throw new Error("FORBIDDEN");
    }

    if (items.length === 0) {
      throw new Error("Order has no items");
    }

    const stripeClient = new StripeSubscriptions(components.stripe, {
      STRIPE_SECRET_KEY: stripeSecret,
    });
    const { customerId } = await stripeClient.getOrCreateCustomer(ctx, {
      userId: user.clerkUserId,
      email: user.email,
      name: user.name,
    });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: { nameSnapshot: string; priceCentsSnapshot: number; quantity: number }) => ({
        price_data: {
          currency: order.currency,
          product_data: { name: item.nameSnapshot },
          unit_amount: item.priceCentsSnapshot,
        },
        quantity: item.quantity,
      }),
    );

    if (order.shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency: order.currency,
          product_data: { name: "Shipping" },
          unit_amount: order.shippingCents,
        },
        quantity: 1,
      });
    }

    const stripe = new Stripe(stripeSecret);
    const expiresAt = order.reservedUntil
      ? Math.floor(order.reservedUntil / 1000)
      : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: lineItems,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart`,
      expires_at: expiresAt,
      metadata: { orderId: args.orderId },
      payment_intent_data: {
        metadata: { orderId: args.orderId },
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    await ctx.runMutation(internal.orders.attachStripeSession, {
      orderId: args.orderId,
      stripeSessionId: session.id,
    });

    return { url: session.url, sessionId: session.id };
  },
});

async function createOrderPaymentIntent(
  ctx: ActionCtx,
  orderId: Id<"orders">,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("NOT_SIGNED_IN");
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    throw new Error("STRIPE_SECRET_KEY is not set on the Convex deployment");
  }

  const order = await ctx.runQuery(internal.orders._getOrderForPaymentIntent, {
    orderId,
  });
  const { order: orderDoc, user } = order;

  if (user.clerkUserId !== identity.subject) {
    throw new Error("FORBIDDEN");
  }

  if (orderDoc.status !== "pending") {
    throw new Error("Order is not pending payment");
  }

  const stripeClient = new StripeSubscriptions(components.stripe, {
    STRIPE_SECRET_KEY: stripeSecret,
  });
  const { customerId } = await stripeClient.getOrCreateCustomer(ctx, {
    userId: user.clerkUserId,
    email: user.email,
    name: user.name,
  });

  const stripe = new Stripe(stripeSecret);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: orderDoc.totalCents,
    currency: orderDoc.currency,
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId,
      orderKind: orderDoc.orderKind ?? "product",
    },
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Stripe did not return a PaymentIntent client secret");
  }

  await ctx.runMutation(internal.orders.attachPaymentIntent, {
    orderId,
    stripePaymentIntentId: paymentIntent.id,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

export const createPaymentIntent = action({
  args: { orderId: v.id("orders") },
  returns: v.object({
    clientSecret: v.string(),
    paymentIntentId: v.string(),
  }),
  handler: async (ctx, args) => createOrderPaymentIntent(ctx, args.orderId),
});

export const startPlatformCheckout = action({
  args: { orderId: v.id("orders") },
  returns: v.object({
    url: v.string(),
    sessionId: v.string(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ url: string; sessionId: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("NOT_SIGNED_IN");
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      throw new Error("STRIPE_SECRET_KEY is not set on the Convex deployment");
    }
    const siteUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    if (!siteUrl) {
      throw new Error(
        "SITE_URL (or NEXT_PUBLIC_APP_URL) is not set on the Convex deployment",
      );
    }

    const orderInfo = await ctx.runQuery(
      internal.orders._getPlatformOrderForCheckout,
      { orderId: args.orderId },
    );
    const { order, user, lineItemName } = orderInfo;

    if (user.clerkUserId !== identity.subject) {
      throw new Error("FORBIDDEN");
    }

    if (order.orderKind !== "ticket" && order.orderKind !== "resale") {
      throw new Error("Use startStripeCheckout for product orders");
    }

    const stripeClient = new StripeSubscriptions(components.stripe, {
      STRIPE_SECRET_KEY: stripeSecret,
    });
    const { customerId } = await stripeClient.getOrCreateCustomer(ctx, {
      userId: user.clerkUserId,
      email: user.email,
      name: user.name,
    });

    const stripe = new Stripe(stripeSecret);
    const expiresAt = order.reservedUntil
      ? Math.floor(order.reservedUntil / 1000)
      : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: order.currency,
            product_data: { name: lineItemName },
            unit_amount: order.totalCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart`,
      expires_at: expiresAt,
      metadata: {
        orderId: args.orderId,
        orderKind: order.orderKind ?? "ticket",
      },
      payment_intent_data: {
        metadata: { orderId: args.orderId },
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    await ctx.runMutation(internal.orders.attachStripeSession, {
      orderId: args.orderId,
      stripeSessionId: session.id,
    });

    return { url: session.url, sessionId: session.id };
  },
});
