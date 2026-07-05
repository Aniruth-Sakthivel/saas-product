"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/kpi-card";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import { formatDate } from "@/lib/utils";
import type { FrontDeskData } from "@/features/frontdesk/services";
import { checkInAction, checkOutAction } from "@/features/frontdesk/actions";

interface Props {
  organizationId: string;
  data: FrontDeskData;
  canOperate: boolean;
}

export function FrontDeskBoard({ organizationId, data, canOperate }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [assign, setAssign] = useState<Record<string, string>>({});
  useRealtimeRefresh(
    organizationId,
    ["reservations", "rooms", "stays"],
    "frontdesk",
  );

  function doCheckIn(reservationId: string, roomTypeId: string | null) {
    const preferred = data.availableRooms.filter(
      (r) => !roomTypeId || r.roomTypeId === roomTypeId,
    );
    const roomId =
      assign[reservationId] ??
      preferred[0]?.id ??
      data.availableRooms[0]?.id;
    if (!roomId) return toast.error("No available rooms to assign.");
    startTransition(async () => {
      const res = await checkInAction({ reservationId, roomId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Guest checked in.");
      router.refresh();
    });
  }

  function doCheckOut(reservationId: string) {
    startTransition(async () => {
      const res = await checkOutAction({ reservationId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Guest checked out.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Arrivals due" value={data.arrivals.length} icon="log-in" tone="sky" />
        <KpiCard label="In-house" value={data.inHouse.length} icon="bed-double" tone="indigo" />
        <KpiCard
          label="Departures today"
          value={data.departuresToday}
          icon="log-out"
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Arrivals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Arrivals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.arrivals.length === 0 ? (
              <EmptyState icon="log-in" title="No arrivals due" />
            ) : (
              data.arrivals.map((a) => {
                const options = data.availableRooms.filter(
                  (r) => !a.roomTypeId || r.roomTypeId === a.roomTypeId,
                );
                const pool = options.length ? options : data.availableRooms;
                return (
                  <div
                    key={a.id}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{a.guestName}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.code} · {a.roomTypeName ?? "Any room"} ·{" "}
                          {a.guests_count} guest(s)
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(a.check_in)} → {formatDate(a.check_out)}
                        </div>
                      </div>
                      <Badge variant={a.status === "CONFIRMED" ? "default" : "warning"}>
                        {a.status === "CONFIRMED" ? "Confirmed" : "Pending"}
                      </Badge>
                    </div>
                    {canOperate && (
                      <div className="mt-3 flex items-center gap-2">
                        <Select
                          value={assign[a.id] ?? pool[0]?.id ?? ""}
                          onValueChange={(v) =>
                            setAssign((s) => ({ ...s, [a.id]: v }))
                          }
                          disabled={pending || pool.length === 0}
                        >
                          <SelectTrigger className="h-8 flex-1 text-xs">
                            <SelectValue placeholder="No rooms free" />
                          </SelectTrigger>
                          <SelectContent>
                            {pool.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                Room {r.number}
                                {r.roomTypeName ? ` · ${r.roomTypeName}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          disabled={pending || pool.length === 0}
                          onClick={() => doCheckIn(a.id, a.roomTypeId)}
                        >
                          Check in
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* In-house */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">In-house guests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.inHouse.length === 0 ? (
              <EmptyState icon="bed-double" title="No guests in-house" />
            ) : (
              data.inHouse.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <div>
                    <div className="font-medium">{g.guestName}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.code} · Room {g.roomNumber ?? "—"} · out{" "}
                      {formatDate(g.check_out)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {g.departingToday && <Badge variant="warning">Due out</Badge>}
                    {canOperate && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => doCheckOut(g.id)}
                      >
                        Check out
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
