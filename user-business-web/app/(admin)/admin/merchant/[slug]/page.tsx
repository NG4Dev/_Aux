"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatPrice } from "@/components/admin/format";
import MerchantAnalyticsBootstrap from "@/components/admin/MerchantAnalyticsBootstrap";

export default function MerchantAdminDashboard() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const merchant = useQuery(api.admin.merchants.getBySlug, { slug });
  const orders = useQuery(api.admin.merchants.listOrdersForMerchant, { merchantSlug: slug });
  const events = useQuery(api.admin.events.listForMerchant, { merchantSlug: slug });

  if (merchant === undefined) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (merchant === null) {
    return <p className="p-6 text-sm text-muted-foreground">Merchant not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <MerchantAnalyticsBootstrap
        merchantId={merchant._id}
        merchantSlug={merchant.slug}
        merchantType={merchant.type}
      />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{merchant.name}</h1>
        <p className="text-sm text-muted-foreground">{merchant.tagline}</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Events</CardDescription>
            <CardTitle>{events?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Orders</CardDescription>
            <CardTitle>{orders?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Type</CardDescription>
            <CardTitle className="capitalize">{merchant.type.replace("_", " ")}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Orders for this merchant only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {orders === undefined ? (
            <Skeleton className="h-24 w-full" />
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            orders.slice(0, 10).map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{order.orderKind ?? "product"}</Badge>
                    <span className="text-sm font-medium">{order.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium tabular-nums">
                    {formatPrice(order.totalCents, order.currency)}
                  </p>
                  <Link
                    href={`/admin/merchant/${slug}/orders/${order._id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
