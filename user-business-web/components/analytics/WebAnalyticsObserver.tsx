"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  clearGa4User,
  isGtmEnabled,
  syncGa4User,
  trackPageView,
} from "@/lib/analytics/ga4/web";
import {
  identifyMixpanelUser,
  resetMixpanel,
} from "@/lib/analytics/mixpanel/client";
import { setClarityUserContext } from "@/lib/analytics/clarity/tags";
import type { Persona } from "@/lib/analytics/userClassification";

function resolvePersona(pathname: string): Persona {
  if (pathname.startsWith("/admin/platform")) return "platform_admin";
  if (pathname.startsWith("/admin")) return "merchant";
  return "consumer";
}

function resolveRouteGroup(pathname: string): string {
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/onboarding")
  ) {
    return "auth";
  }
  if (pathname.startsWith("/admin")) return "admin";
  return "app";
}

export default function WebAnalyticsObserver() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const lastSyncedUserIdRef = useRef<string | null>(null);
  const lastRouteRef = useRef<string>("");

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress;

  useEffect(() => {
    if (!isGtmEnabled() && !process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      return;
    }

    if (isSignedIn && userId) {
      if (lastSyncedUserIdRef.current !== userId) {
        const persona = resolvePersona(pathname || "/");
        syncGa4User({
          userId,
          emailAddress: email,
          personaDefault: persona,
        });
        void identifyMixpanelUser({
          userId,
          emailAddress: email,
          personaDefault: persona,
        });
        setClarityUserContext({
          userId,
          emailAddress: email,
          persona,
        });
        lastSyncedUserIdRef.current = userId;
      }
      return;
    }

    if (lastSyncedUserIdRef.current) {
      clearGa4User();
      void resetMixpanel();
      lastSyncedUserIdRef.current = null;
    }
  }, [isSignedIn, userId, email, pathname]);

  useEffect(() => {
    if (!isGtmEnabled()) return;
    const path = pathname || "/";
    const search = searchParams?.toString() || "";
    const key = `${path}?${search}`;
    if (lastRouteRef.current === key) return;
    lastRouteRef.current = key;

    const persona = resolvePersona(path);
    trackPageView({
      pathname: path,
      search,
      title: typeof document !== "undefined" ? document.title : undefined,
      routeGroup: resolveRouteGroup(path),
      persona,
      userId: userId ?? undefined,
      emailAddress: email,
    });
    setClarityUserContext({
      userId: userId ?? undefined,
      emailAddress: email,
      persona,
      funnelStep: resolveRouteGroup(path),
    });
  }, [pathname, searchParams, userId, email]);

  return null;
}
