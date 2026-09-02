"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/components/admin/format";

export default function MerchantEventsPage() {
  const params = useParams<{ slug: string }>();
  const events = useQuery(api.admin.events.listForMerchant, {
    merchantSlug: params.slug,
  });

  if (events === undefined) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        <p className="text-sm text-muted-foreground">
          Manage ticketing and guest lists for your events.
        </p>
      </header>

      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          events.map((event) => (
            <Link
              key={event._id}
              href={`/admin/merchant/${params.slug}/events/${event._id}`}
              className="block rounded-md border p-4 hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{event.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.location ?? "TBA"} · {formatDateTime(event.startTime)}
                  </p>
                </div>
                <Badge variant={event.inAppTicketing ? "default" : "outline"}>
                  {event.inAppTicketing ? "In-app tickets" : "External"}
                </Badge>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
