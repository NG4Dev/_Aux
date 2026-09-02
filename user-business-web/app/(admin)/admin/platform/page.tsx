"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  ArrowRight,
  Store,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime, formatPrice } from "@/components/admin/format";

const STATUS_BADGE: Record<
  "pending" | "paid" | "fulfilled" | "cancelled",
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  paid: "secondary",
  fulfilled: "default",
  cancelled: "destructive",
};

function getThirtyDaysAgo(): number {
  return Date.now() - 30 * 24 * 60 * 60 * 1000;
}

export default function PlatformAdminDashboard() {
  const [since] = useState<number>(getThirtyDaysAgo);
  const stats = useQuery(api.admin.dashboard.getStats, { since });
  const merchants = useQuery(api.admin.merchants.listAll);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Platform dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Cross-merchant overview for ycago platform admins.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active products"
          icon={<Package className="size-4" />}
          value={
            stats === undefined
              ? null
              : `${stats.activeProductCount} / ${stats.productCount}`
          }
          hint={
            stats === undefined
              ? undefined
              : `${stats.categoryCount} categor${stats.categoryCount === 1 ? "y" : "ies"}`
          }
        />
        <StatCard
          label="Open orders"
          icon={<ShoppingBag className="size-4" />}
          value={stats === undefined ? null : `${stats.openOrderCount}`}
          hint={stats === undefined ? undefined : "Pending + paid"}
        />
        <StatCard
          label="Revenue (30d)"
          icon={<TrendingUp className="size-4" />}
          value={
            stats === undefined
              ? null
              : formatPrice(stats.revenueRecentCents, stats.currency)
          }
          hint="Paid + fulfilled"
        />
        <StatCard
          label="Merchants"
          icon={<Store className="size-4" />}
          value={merchants === undefined ? null : `${merchants.length}`}
          hint="On platform"
        />
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Recent orders</CardTitle>
                <CardDescription>The last 10 orders placed.</CardDescription>
              </div>
              <Link
                href="/admin/platform/orders"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                View all
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats === undefined ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : stats.recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No orders yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Placed</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-px"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {order.customer.name ?? "Guest"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {order.customer.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.orderKind ?? "product"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[order.status]}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatPrice(order.totalCents, order.currency)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/platform/orders/${order._id}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                          )}
                        >
                          Open
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string | null;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          {label}
        </CardDescription>
        <CardTitle className="text-2xl">
          {value === null ? <Skeleton className="h-8 w-24" /> : value}
        </CardTitle>
      </CardHeader>
      {hint && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      )}
    </Card>
  );
}
