"use client";

import { useState } from "react";
import { RiArrowDownSLine, RiLogoutBoxRLine, RiSettings4Line } from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Dropdown, DropdownTrigger, DropdownPopover, DropdownDivider, DropdownItem } from "@/components/base/dropdown/dropdown";
import type { User } from "@/api/tracker";
import { cx } from "@/utils/cx";

export function AccountMenu({ user, compact = false, collapsed = false, signingOut, onManageAccount, onSignOut }: {
  user: User; compact?: boolean; collapsed?: boolean; signingOut: boolean; onManageAccount: () => void; onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
  return <Dropdown isOpen={open} onOpenChange={setOpen}>
    <DropdownTrigger aria-label={`Account menu for ${user.name}, ${user.role.name}`} className={cx("flex min-w-0 items-center gap-3 rounded-xl p-2 text-start text-text-primary outline-none hover:bg-background-secondary-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring", !compact && !collapsed && "w-full", collapsed && "justify-center p-0")}>
      <Avatar src={user.avatar ?? undefined} initials={initials} size="lg" alt="" />
      {!compact && !collapsed && <span className="flex min-w-0 flex-1 flex-col gap-1"><span className="truncate text-body-medium"><bdi>{user.name}</bdi></span><span className="truncate text-caption-1-regular text-text-tertiary">{user.role.name}</span></span>}
      {!collapsed && <RiArrowDownSLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />}
    </DropdownTrigger>
    <DropdownPopover aria-label="Your account" placement={compact ? "bottom end" : "top start"} className="w-72 max-w-full" dialogClassName="gap-2">
      <div className="flex flex-col gap-1 px-2 py-3"><p className="text-headline-medium text-text-primary"><bdi>{user.name}</bdi></p><p dir="ltr" className="break-all text-body-2-regular text-text-secondary">{user.email}</p><p className="text-caption-1-regular text-text-tertiary">{user.role.name}</p></div>
      <DropdownDivider />
      <DropdownItem onSelect={() => { setOpen(false); onManageAccount(); }}><RiSettings4Line className="size-5" aria-hidden /><span>Manage account</span></DropdownItem>
      <DropdownItem className="text-text-error-primary" onSelect={() => { if (!signingOut) { setOpen(false); onSignOut(); } }}><RiLogoutBoxRLine className="size-5" aria-hidden /><span>{signingOut ? "Logging out…" : "Log out"}</span></DropdownItem>
    </DropdownPopover>
  </Dropdown>;
}
