"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import {
  trackMerchantProfileCompleted,
  trackSignUp,
} from "@/lib/analytics/ga4/web";
import { trackMixpanel, MixpanelEvents } from "@/lib/analytics";

type Props = {
  merchantId?: string;
  merchantSlug?: string;
  merchantType?: string;
  city?: string;
};

/**
 * Merchant admin bootstrap: once per session, mark profile as completed
 * when a merchant admin lands in /admin with a merchant context.
 */
export default function MerchantAnalyticsBootstrap(props: Props) {
  const { userId, isSignedIn } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const firedRef = useRef(false);
  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (!isSignedIn || !userId || !props.merchantSlug) return;
    if (!pathname?.startsWith("/admin")) return;
    if (firedRef.current) return;
    firedRef.current = true;

    const key = `aux.merchant.bootstrap.${userId}.${props.merchantSlug}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) {
      return;
    }
    sessionStorage.setItem(key, "1");

    trackSignUp({
      userId,
      method: "admin",
      emailAddress: email,
      persona: "merchant",
    });
    void trackMixpanel(MixpanelEvents.MerchantSignedUp, {
      persona: "merchant",
      merchant_slug: props.merchantSlug,
      merchant_id: props.merchantId,
      merchant_type: props.merchantType,
    });

    trackMerchantProfileCompleted({
      userId,
      emailAddress: email,
      merchantId: props.merchantId,
      merchantSlug: props.merchantSlug,
      merchantType: props.merchantType,
      city: props.city,
    });
    void trackMixpanel(MixpanelEvents.MerchantProfileCompleted, {
      persona: "merchant",
      merchant_slug: props.merchantSlug,
      merchant_id: props.merchantId,
      merchant_type: props.merchantType,
      city: props.city,
    });
  }, [isSignedIn, userId, email, pathname, props]);

  return null;
}
