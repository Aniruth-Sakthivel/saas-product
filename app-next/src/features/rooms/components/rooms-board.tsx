"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import { cn, formatCurrency } from "@/lib/utils";
import type { RoomStatus } from "@/types/database";
import type { RoomsData } from "@/features/rooms/services";
import { updateRoomStatusAction } from "@/features/rooms/actions";

const STATUSES: RoomStatus[] = [
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
  "CLEANING",
  "MAINTENANCE",
];

const DOT: Record<RoomStatus, string> = {
  AVAILABLE: "bg-emerald-500",
  OCCUPIED: "bg-indigo-500",
  RESERVED: "bg-violet-500",
  CLEANING: "bg-amber-500",
  MAINTENANCE: "bg-red-500",
};

function label(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

interface Props {
  organizationId: string;
  currency: string;
  data: RoomsData;
  canManage: boolean;
}

export function RoomsBoard({
  organizationId,
  currency,
  data,
  canManage,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<RoomStatus | "ALL">("ALL");
  useRealtimeRefresh(organizationId, ["rooms", "room_types"], "rooms-board");

  function change(roomId: string, status: RoomStatus) {
    startTransition(async () => {
      const res = await updateRoomStatusAction({ roomId, status });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Room status updated.");
      router.refresh();
    });
  }

  const rooms =
    filter === "ALL"
      ? data.rooms
      : data.rooms.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      {/* Status summary / filter */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <button
          onClick={() => setFilter("ALL")}
          className={cn(
            "rounded-xl border p-3 text-left transition-colors",
            filter === "ALL" ? "border-primary bg-primary/5" : "hover:bg-accent",
          )}
        >
          <div className="text-2xl font-semibold">{data.rooms.length}</div>
          <div className="text-xs text-muted-foreground">All rooms</div>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-xl border p-3 text-left transition-colors",
              filter === s ? "border-primary bg-primary/5" : "hover:bg-accent",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-full", DOT[s])} />
              <span className="text-2xl font-semibold">
                {data.statusCounts[s]}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">{label(s)}</div>
          </button>
        ))}
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {rooms.map((r) => (
          <Card key={r.id} className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{r.number}</span>
              <span className={cn("size-2.5 rounded-full", DOT[r.status])} />
            </div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {r.roomTypeName ?? "—"} · Fl {r.floor}
            </div>
            <div className="mt-1 text-xs font-medium">
              {formatCurrency(r.basePrice, currency)}
            </div>
            {canManage ? (
              <Select
                value={r.status}
                onValueChange={(v) => change(r.id, v as RoomStatus)}
                disabled={pending}
              >
                <SelectTrigger className="mt-2 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {label(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-2 text-xs text-muted-foreground">
                {label(r.status)}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
