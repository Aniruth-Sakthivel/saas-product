"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/database";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/features/notifications/actions";

interface Props {
  organizationId: string;
  initial: Notification[];
}

/**
 * Live notification feed for the admin topbar. Seeds from server-rendered
 * notifications, then subscribes to Supabase Realtime so new bookings (and
 * status changes) appear instantly with an unread badge and a toast.
 */
export function NotificationBell({ organizationId, initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>(initial);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read).length;

  // Realtime subscription — new + updated notifications for this org.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) =>
            prev.some((p) => p.id === n.id) ? prev : [n, ...prev].slice(0, 30),
          );
          toast(n.title, { description: n.body ?? undefined });
          // Keep server components (bookings/customers/dashboard) fresh.
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => prev.map((p) => (p.id === n.id ? n : p)));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, router]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function handleOpenItem(n: Notification) {
    setOpen(false);
    if (!n.read) {
      setItems((prev) =>
        prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)),
      );
      await markNotificationReadAction(n.id);
    }
    if (n.entity === "reservation") router.push("/reservations");
  }

  async function handleMarkAll() {
    setItems((prev) => prev.map((p) => ({ ...p, read: true })));
    await markAllNotificationsReadAction();
  }

  return (
    <div ref={panelRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="relative">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
      </Button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleOpenItem(n)}
                  className={cn(
                    "flex w-full gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-accent",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-primary",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {n.title}
                    </span>
                    {n.body && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {n.body}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
