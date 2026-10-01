"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  Grid3x3Icon,
  LayoutDashboardIcon,
  TableIcon,
  WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDatasetContext } from "./dataset-provider";
import { AssetDrawer } from "@/components/AssetDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/dashboard/map", label: "Cost-basis map", icon: Grid3x3Icon },
  { href: "/dashboard/assets", label: "Assets", icon: TableIcon },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: WalletIcon },
  { href: "/dashboard/methodology", label: "Methodology", icon: BookOpenIcon },
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { dataset, refresh } = useDatasetContext();

  const current = [...NAV].reverse().find((item) =>
    item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href),
  );

  return (
    <SidebarProvider
      className="dashboard-scope"
      style={{ "--sidebar-width-icon": "4rem" } as CSSProperties}
    >
      <Sidebar collapsible="icon" className="border-dashed">
        <SidebarHeader className="h-16 justify-center border-b border-dashed">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="h-12 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"
                render={<Link href="/" />}
              >
                <Image
                  src="/icon-192.png"
                  alt="Underwater"
                  width={32}
                  height={32}
                  className="size-8 shrink-0"
                />
                <span className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span>
                    <Image
                      src="/wordmark.svg"
                      alt="Underwater"
                      width={913}
                      height={154}
                      unoptimized
                      className="h-auto w-36"
                    />
                  </span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Analysis</SidebarGroupLabel>
            <SidebarMenu>
              {NAV.map((item) => {
                const active =
                  item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem
                    key={item.href}
                    className="border-b border-dashed last:border-b-0 group-data-[collapsible=icon]:border-b-0"
                  >
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      className="h-14 gap-3 text-[15px] font-medium [&_svg]:size-[18px]! group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&_svg]:size-5!"
                      render={<Link href={item.href} />}
                    >
                      <item.icon strokeWidth={1.5} />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-dashed">
          <div className="flex flex-col gap-2 px-2 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="gap-1.5 uppercase">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    dataset.source === "live" ? "bg-profit" : "bg-muted-foreground",
                  )}
                />
                {dataset.source}
              </Badge>
              <span className="text-muted-foreground text-[11px]">
                {new Date(dataset.asOf).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </span>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-dashed px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link href="/dashboard" />}>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{current?.label ?? "Overview"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted-foreground hidden text-xs sm:block">
              as of{" "}
              {new Date(dataset.asOf).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              })}
            </span>
            <Button onClick={() => refresh.mutate()} disabled={refresh.isPending}>
              {refresh.isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Refreshing
                </>
              ) : (
                "Refresh live"
              )}
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
      <Suspense fallback={null}>
        <AssetDrawer />
      </Suspense>
    </SidebarProvider>
  );
}
