"use client";

import { useRouter } from "next/navigation";
import {
  ChevronsUpDown,
  LayoutGrid,
  LogOut,
  Menu,
  PanelLeft,
  Search,
  Settings as SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { switchOrganization } from "@/lib/actions/session";
import { useUIStore } from "@/store/ui-store";
import { initialsFromName } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/rbac";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import type { Notification, UserRole } from "@/types/database";

interface OrgOption {
  id: string;
  name: string;
}

interface TopbarProps {
  userName: string;
  userEmail: string;
  orgName: string;
  orgId: string;
  role: UserRole;
  organizations: OrgOption[];
  notifications: Notification[];
}

export function Topbar({
  userName,
  userEmail,
  orgName,
  orgId,
  role,
  organizations,
  notifications,
}: TopbarProps) {
  const router = useRouter();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setMobileNav = useUIStore((s) => s.setMobileNav);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/70 px-4 backdrop-blur-xl sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileNav(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggleSidebar}
        aria-label="Collapse sidebar"
      >
        <PanelLeft className="size-5" />
      </Button>

      <div className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors focus-within:border-primary/40 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/15 md:flex">
        <Search className="size-4" />
        <input
          placeholder="Search guests, rooms, reservations…"
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <kbd className="rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-medium shadow-sm">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell organizationId={orgId} initial={notifications} />

        {organizations.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <span className="grid size-5 place-items-center rounded bg-primary text-[10px] text-primary-foreground">
                  {orgName.charAt(0)}
                </span>
                <span className="max-w-[10rem] truncate">{orgName}</span>
                <ChevronsUpDown className="size-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Switch property</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => switchOrganization(org.id)}
                >
                  {org.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1" aria-label="Account menu">
              <Avatar className="size-9">
                <AvatarFallback>{initialsFromName(userName)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="truncate">{userName}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {userEmail}
              </span>
              <span className="mt-1 text-xs font-normal text-primary">
                {ROLE_LABELS[role]}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/portal")}>
              <LayoutGrid className="size-4" />
              Customer Portal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <SettingsIcon className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
