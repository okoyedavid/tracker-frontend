"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  RiDashboardLine,
  RiScanLine,
  RiUserLine,
  RiShieldUserLine,
  RiGroupLine,
  RiMenuLine,
  RiSettings4Line,
  RiLogoutBoxRLine,
  RiListIndefinite,
} from "@remixicon/react";
import {
  DashboardSidebar,
  type DashboardNavItem,
} from "@/components/application/dashboard/dashboard-sidebar";
import { AccountMenu } from "@/components/application/account-menu";
import {
  applyTheme,
  THEME_STORAGE_KEY,
} from "@/components/application/theme/theme-toggle";
import { Drawer } from "@/components/base/drawer/drawer";
import { useAuth } from "@/features/auth/auth-provider";
import { Spinner } from "@/components/base/spinner/spinner";
import { Button } from "@/components/base/buttons/button";
import { toast } from "@/components/base/toast/toast";
import { apiErrorMessage } from "@/api/client";

export function DashboardShell({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    if (!auth.loading && !auth.error && !auth.user) router.replace("/");
  }, [auth.loading, auth.error, auth.user, router]);
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(THEME_STORAGE_KEY)) applyTheme("dark");
    } catch {
      applyTheme("dark", { persist: false });
    }
  }, []);
  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await auth.logout();
      router.replace("/");
    } catch (error) {
      toast.error(
        apiErrorMessage(error, "Could not log out. Please try again."),
      );
    } finally {
      setSigningOut(false);
    }
  }
  if (auth.loading)
    return (
      <main className="flex min-h-dvh flex-1 items-center justify-center gap-3 bg-background-full p-12">
        <Spinner />
        <span className="text-body-regular text-text-secondary">
          Opening your workspace…
        </span>
      </main>
    );
  if (auth.error)
    return (
      <main className="mx-auto flex max-w-xl flex-col gap-4 p-12">
        <h1 className="text-title-2-medium text-text-primary">
          Could not load your account
        </h1>
        <p role="alert" className="text-body-regular text-text-secondary">
          {apiErrorMessage(auth.error, "Check your connection and try again.")}
        </p>
        <Button onClick={() => void auth.reload()}>Try again</Button>
      </main>
    );
  const user = auth.user;
  if (!user) return null;
  const canProvision =
    auth.can("user:create") &&
    user.role.key === "supervisor" &&
    user.role.type === "system";
  const items: DashboardNavItem[] = [
    {
      key: "overview",
      href: "/dashboard",
      label: "Overview",
      icon: RiDashboardLine,
    },
    ...(auth.can("receipts:scan")
      ? [
          {
            key: "scan",
            href: "/dashboard/scan",
            label: "Scan receipt",
            icon: RiScanLine,
          },
        ]
      : []),
    ...((auth.can("expenses:view")||auth.can("expenses:view_own"))?[{key:"scans",href:"/scans",label:"Saved scans",icon:RiListIndefinite}]:[]),
    ...((auth.can("reports:view")||auth.can("expenses:approve"))?[{key:"reports",href:"/reports",label:"Reports",icon:RiDashboardLine}]:[]),
    ...(auth.can("categories:view")
      ? [
          {
            key: "categories",
            href: "/dashboard/categories",
            label: "Categories",
            icon: RiListIndefinite,
          },
        ]
      : []),
    ...(auth.can("users:view") || canProvision
      ? [
          {
            key: "users",
            href: "/dashboard/users",
            label: "Users",
            icon: RiGroupLine,
          },
        ]
      : []),
    ...(auth.can("roles:view") || auth.can("roles:manage")
      ? [
          {
            key: "roles",
            href: "/dashboard/team",
            label: "Access & roles",
            icon: RiShieldUserLine,
          },
        ]
      : []),
    {
      key: "account",
      href: "/dashboard/account",
      label: "My account",
      icon: RiUserLine,
    },
  ];
  const selected = items.find((item) => item.href === path||(item.key==="reports"&&path.startsWith("/reports"))||(item.key==="scans"&&path.startsWith("/scans")))?.key ?? "overview";
  const title =
    items.find((item) => item.key === selected)?.label ?? "Workspace";
  const manageAccount = () => {
    setMobileOpen(false);
    router.push("/dashboard/account");
  };
  const profileMenu = (collapsed: boolean) => (
    <AccountMenu
      user={user}
      collapsed={collapsed}
      signingOut={signingOut}
      onManageAccount={manageAccount}
      onSignOut={() => void signOut()}
    />
  );
  const workspaceHeader = (collapsed: boolean) => (
    <Link
      href="/dashboard"
      aria-label="Receipt Tracker overview"
      className="flex min-w-0 items-center gap-2 rounded-lg text-body-medium text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
    >
      <Image src="/logo.svg" width={32} height={32} alt="" />
      {!collapsed && <span className="truncate">Receipt Tracker</span>}
    </Link>
  );
  const sidebarProps = {
    selected,
    items,
    profileMenu,
    workspaceHeader,
    onNavigate: () => setMobileOpen(false),
    secondaryItems: [
      {
        key: "settings",
        label: "Settings",
        icon: RiSettings4Line,
        onClick: manageAccount,
      },
      {
        key: "logout",
        label: signingOut ? "Logging out…" : "Log out",
        icon: RiLogoutBoxRLine,
        onClick: () => void signOut(),
        disabled: signingOut,
      },
    ],
  };
  return (
    <div className="flex min-h-dvh flex-1 bg-background-full text-text-primary">
      <div className="sticky top-0 hidden h-dvh shrink-0 py-3 ps-3 lg:block">
        <DashboardSidebar {...sidebarProps} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-20 items-center justify-between gap-4 border-b border-separator-border px-4 py-3 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              iconOnly
              leadingIcon={RiMenuLine}
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            />
            <div className="flex flex-col gap-1">
              <span className="text-body-medium text-text-primary">
                {title}
              </span>
            </div>
          </div>
          <AccountMenu
            user={user}
            compact
            signingOut={signingOut}
            onManageAccount={manageAccount}
            onSignOut={() => void signOut()}
          />
        </header>
        {children}
      </div>
      <Drawer
        isOpen={mobileOpen}
        onOpenChange={setMobileOpen}
        placement="start"
        size="sm"
        aria-label="Workspace navigation"
        className="overflow-hidden bg-background-secondary-default p-0"
      >
        <DashboardSidebar
          {...sidebarProps}
          mobile
          fluid
          flat
          onClose={() => setMobileOpen(false)}
          className="!h-full !w-full"
        />
      </Drawer>
    </div>
  );
}

export function PermissionGate({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const auth = useAuth();
  if (!auth.can(permission))
    return (
      <main className="mx-auto flex max-w-xl flex-col gap-3 p-12">
        <h1 className="text-title-2-medium text-text-primary">
          Access restricted
        </h1>
        <p className="text-body-regular text-text-secondary">
          Your role does not allow this action. Contact a supervisor if you need
          access.
        </p>
        <Link href="/dashboard" className="text-body-medium text-accent-600">
          Back to overview
        </Link>
      </main>
    );
  return children;
}
