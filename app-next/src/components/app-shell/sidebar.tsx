"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/constants/navigation";
import { can } from "@/lib/rbac";
import { Icon } from "@/components/icon";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  const items = NAV_ITEMS.filter(
    (item) => !item.permission || can(role, item.permission),
  );

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
      {!collapsed && (
        <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Menu
        </p>
      )}
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {active && (
              <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-primary" />
            )}
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-lg transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              <Icon name={item.icon} className="size-[17px]" />
            </span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
