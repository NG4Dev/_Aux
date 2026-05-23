"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformMerchantsPage() {
  const merchants = useQuery(api.admin.merchants.listAll);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Merchants</h1>
        <p className="text-sm text-muted-foreground">
          All merchants on the ycago platform.
        </p>
      </header>

      {merchants === undefined ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="space-y-3">
          {merchants.map((merchant) => (
            <Link
              key={merchant._id}
              href={`/admin/merchant/${merchant.slug}`}
              className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50"
            >
              <div>
                <p className="font-medium">{merchant.name}</p>
                <p className="text-sm text-muted-foreground">{merchant.tagline}</p>
              </div>
              <Badge variant={merchant.isActive ? "default" : "outline"}>
                {merchant.type.replace("_", " ")}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
