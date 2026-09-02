"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { trackViewItem } from "@/lib/analytics/ga4/web";
import { trackMixpanel, MixpanelEvents } from "@/lib/analytics";

type Props = {
  productId: string;
  name: string;
  priceCents: number;
  currency: string;
  merchantId?: string;
  merchantSlug?: string;
  category?: string;
};

/** Fires view_item once per product mount (consumer PDP). */
export default function ProductViewTracker(props: Props) {
  const { userId } = useAuth();
  const { user } = useUser();
  const firedRef = useRef<string | null>(null);
  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (firedRef.current === props.productId) return;
    firedRef.current = props.productId;
    const price = props.priceCents / 100;
    const item = {
      item_id: props.productId,
      item_name: props.name,
      item_category: props.category,
      item_brand: props.merchantSlug,
      price,
      quantity: 1,
    };
    trackViewItem({
      item,
      persona: "consumer",
      contentType: "product",
      userId: userId ?? undefined,
      emailAddress: email,
      merchantId: props.merchantId,
      merchantSlug: props.merchantSlug,
      value: price,
      currency: props.currency.toUpperCase(),
    });
    void trackMixpanel(MixpanelEvents.ProductViewed, {
      item_id: props.productId,
      item_name: props.name,
      merchant_id: props.merchantId,
      merchant_slug: props.merchantSlug,
      persona: "consumer",
      content_type: "product",
      value: price,
      currency: props.currency.toUpperCase(),
    });
  }, [props, userId, email]);

  return null;
}
