"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function MerchantOrderDetailPage() {
  const params = useParams<{ slug: string; id: string }>();
  const orders = useQuery(api.admin.merchants.listOrdersForMerchant, {
    merchantSlug: params.slug,
  });

  const order = orders?.find((o) => o._id === params.id);

  if (orders === undefined) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!order) {
    return <p className="p-6 text-sm text-muted-foreground">Order not found.</p>;
  }

  return (
    <div className="flex flex-col gap-4 p-2">
      <Link
        href={`/admin/merchant/${params.slug}`}
        className="text-sm text-primary hover:underline"
      >
        ← Back to merchant dashboard
      </Link>
      <h1 className="text-2xl font-semibold">Order detail</h1>
      <div className="rounded-md border p-4 space-y-2">
        <div className="flex gap-2">
          <Badge variant="outline">{order.orderKind ?? "product"}</Badge>
          <Badge>{order.status}</Badge>
        </div>
        <p className="text-sm">Total: {(order.totalCents / 100).toFixed(2)} {order.currency.toUpperCase()}</p>
        <p className="text-sm text-muted-foreground">Items: {order.itemCount}</p>
      </div>
    </div>
  );
}
