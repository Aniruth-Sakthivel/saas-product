"use client";

import { Hotel } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar";
import { Topbar } from "./topbar";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import type { Notification, UserRole } from "@/types/database";

interface AppShellProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  orgName: string;
  orgId: string;
  organizations: { id: string; name: string }[];
  notifications: Notification[];
  children: React.ReactNode;
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-16 items-center gap-2.5 px-5">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-primary-foreground shadow-md shadow-primary/30">
        <Hotel className="size-[18px]" />
      </span>
      {!collapsed && (
        <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-[16px] font-semibold tracking-tight text-transparent">
          HotelOS
        </span>
      )}
    </div>
  );
}

export function AppShell({
  role,
  userName,
  userEmail,
  orgName,
  orgId,
  organizations,
  notifications,
  children,
}: AppShellProps) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNav = useUIStore((s) => s.setMobileNav);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-sidebar/80 backdrop-blur-xl lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <Brand collapsed={collapsed} />
        <SidebarNav role={role} />
        <div className="m-3 flex items-center gap-2 rounded-xl border bg-muted/40 p-2.5 text-xs">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-semibold uppercase text-primary">
            {role.slice(0, 2)}
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block font-medium text-foreground">Signed in</span>
              <span className="block truncate capitalize text-muted-foreground">
                {role.toLowerCase()}
              </span>
            </span>
          )}
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Brand collapsed={false} />
          <div onClick={() => setMobileNav(false)}>
            <SidebarNav role={role} />
          </div>
        </SheetContent>
      </Sheet>

      <div className={cn("transition-all", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <Topbar
          userName={userName}
          userEmail={userEmail}
          orgName={orgName}
          orgId={orgId}
          role={role}
          organizations={organizations}
          notifications={notifications}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
