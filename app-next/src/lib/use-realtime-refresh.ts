"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to Postgres changes for one or more org-scoped tables and calls
 * `router.refresh()` whenever a row changes, so server-rendered pages stay in
 * sync in real time. Shared by every operational board (rooms, front desk,
 * housekeeping, billing, bookings, customers).
 */
export function useRealtimeRefresh(
  organizationId: string,
  tables: string[],
  channelKey: string,
) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    let channel = supabase.channel(`${channelKey}:${organizationId}`);
    for (const table of tables) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `organization_id=eq.${organizationId}`,
        },
        () => router.refresh(),
      );
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, channelKey]);
}
