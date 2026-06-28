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
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon
              name={item.icon}
              className={cn(
                "size-[18px] shrink-0",
                active ? "text-primary" : "text-muted-foreground",
              )}
            />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
