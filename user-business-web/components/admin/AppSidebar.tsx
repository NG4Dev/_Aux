"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Users,
  Store,
  Calendar,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  exact?: boolean;
};

const platformNavItems: NavItem[] = [
  {
    href: "/admin/platform",
    label: "Dashboard",
    Icon: LayoutDashboard,
    exact: true,
  },
  { href: "/admin/platform/products", label: "Products", Icon: Package },
  { href: "/admin/platform/categories", label: "Categories", Icon: Tags },
  { href: "/admin/platform/orders", label: "Orders", Icon: ShoppingBag },
  { href: "/admin/platform/customers", label: "Customers", Icon: Users },
];

function merchantNavItems(slug: string): NavItem[] {
  return [
    {
      href: `/admin/merchant/${slug}`,
      label: "Dashboard",
      Icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `/admin/merchant/${slug}/events`,
      label: "Events",
      Icon: Calendar,
    },
    {
      href: `/admin/merchant/${slug}/products`,
      label: "Products",
      Icon: Package,
    },
    {
      href: `/admin/merchant/${slug}/orders`,
      label: "Orders",
      Icon: ShoppingBag,
    },
  ];
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type AppSidebarProps = {
  role: "platform" | "merchant";
  merchantSlug?: string;
};

export default function AppSidebar({ role, merchantSlug }: AppSidebarProps) {
  const pathname = usePathname();
  const navItems =
    role === "platform"
      ? platformNavItems
      : merchantNavItems(merchantSlug ?? "unknown");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">
            Y
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-none">ycago</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {role === "platform" ? "Platform Admin" : "Merchant Admin"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {role === "platform" ? "Platform" : "My business"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isItemActive(pathname, item);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {role === "platform" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Merchants"
                    render={<Link href="/admin/platform/merchants" />}
                    isActive={pathname.startsWith("/admin/platform/merchants")}
                  >
                    <Store />
                    <span>Merchants</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Back to store"
              render={<Link href="/" />}
            >
              <ArrowLeft />
              <span>Back to store</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
          <UserButton />
          <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            Signed in
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
