"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminIndexRedirect() {
  const router = useRouter();
  const adminContext = useQuery(api.users.getAdminContext);

  useEffect(() => {
    if (adminContext === undefined) {
      return;
    }
    if (adminContext === null) {
      router.replace("/");
      return;
    }
    if (
      adminContext.role === "admin" ||
      adminContext.role === "platformAdmin"
    ) {
      router.replace("/admin/platform");
      return;
    }
    const slug = adminContext.merchants[0]?.slug;
    if (slug) {
      router.replace(`/admin/merchant/${slug}`);
    }
  }, [adminContext, router]);

  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
