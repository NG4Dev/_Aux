import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/admin/AppSidebar";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { userId, getToken } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    redirect("/sign-in");
  }

  const adminContext = await fetchQuery(
    api.users.getAdminContext,
    {},
    { token },
  );
  if (!adminContext) {
    redirect("/");
  }

  const isPlatform =
    adminContext.role === "admin" || adminContext.role === "platformAdmin";

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        role={isPlatform ? "platform" : "merchant"}
        merchantSlug={adminContext.merchants[0]?.slug}
      />
      <SidebarInset>
        <AdminShell>{children}</AdminShell>
      </SidebarInset>
    </SidebarProvider>
  );
}
