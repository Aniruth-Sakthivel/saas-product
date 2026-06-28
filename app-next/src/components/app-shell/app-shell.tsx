"use client";

import { Hotel } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar";
import { Topbar } from "./topbar";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

interface AppShellProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  orgName: string;
  organizations: { id: string; name: string }[];
  children: React.ReactNode;
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-16 items-center gap-2.5 px-5">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Hotel className="size-[18px]" />
      </span>
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-tight">
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
  organizations,
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
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-sidebar lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <Brand collapsed={collapsed} />
        <SidebarNav role={role} />
        <div className="border-t p-3 text-xs text-muted-foreground">
          {!collapsed && <span>Signed in as {role.toLowerCase()}</span>}
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
          role={role}
          organizations={organizations}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
