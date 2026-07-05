"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { SourceBadge } from "@/components/source-badge";
import { SortableHead } from "@/components/sortable-head";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useSort } from "@/lib/use-sort";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ReservationStatus } from "@/types/database";
import type { ReservationListItem } from "@/features/reservations/services";
import { updateReservationStatusAction } from "@/features/reservations/actions";

const STATUSES: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
];

function label(s: string) {
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface Props {
  organizationId: string;
  currency: string;
  reservations: ReservationListItem[];
  canManage: boolean;
}

export function BookingsTable({
  organizationId,
  currency,
  reservations,
  canManage,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [source, setSource] = useState<string>("ALL");
  const [pending, startTransition] = useTransition();

  // Realtime — refresh when any reservation for this org changes.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`reservations:${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, router]);

  const sources = useMemo(
    () => [...new Set(reservations.map((r) => r.source))].sort(),
    [reservations],
  );

  function handleStatusChange(id: string, next: ReservationStatus) {
    startTransition(async () => {
      const res = await updateReservationStatusAction({
        reservationId: id,
        status: next,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Booking status updated.");
      router.refresh();
    });
  }

  const q = query.trim().toLowerCase();
  const filtered = reservations.filter((r) => {
    if (status !== "ALL" && r.status !== status) return false;
    if (source !== "ALL" && r.source !== source) return false;
    if (!q) return true;
    return (
      r.guestName.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      (r.guestEmail ?? "").toLowerCase().includes(q) ||
      (r.roomTypeName ?? "").toLowerCase().includes(q)
    );
  });

  const { sorted, sortKey, dir, toggle } = useSort<ReservationListItem>(
    filtered,
    "created_at",
    "desc",
  );

  if (reservations.length === 0) {
    return (
      <EmptyState
        icon="calendar-check"
        title="No bookings yet"
        description="Bookings made on your public site will appear here in real time."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search guest, code, email or room…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {label(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All channels</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground">
          {sorted.length} of {reservations.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Code" sortKey="code" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof ReservationListItem)} />
              <SortableHead label="Guest" sortKey="guestName" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof ReservationListItem)} />
              <SortableHead label="Room" sortKey="roomTypeName" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof ReservationListItem)} />
              <SortableHead label="Check-in" sortKey="check_in" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof ReservationListItem)} />
              <SortableHead label="Guests" sortKey="guests_count" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof ReservationListItem)} align="right" />
              <SortableHead label="Total" sortKey="total" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof ReservationListItem)} align="right" />
              <SortableHead label="Channel" sortKey="source" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof ReservationListItem)} />
              <SortableHead label="Status" sortKey="status" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof ReservationListItem)} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {r.code}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{r.guestName}</div>
                  {r.guestEmail && (
                    <div className="text-xs text-muted-foreground">
                      {r.guestEmail}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{r.roomTypeName ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.roomNumber ? `Room ${r.roomNumber}` : "Unassigned"}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  <div>{formatDate(r.check_in)}</div>
                  <div className="text-xs text-muted-foreground">
                    → {formatDate(r.check_out)}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.guests_count}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(r.total, currency)}
                </TableCell>
                <TableCell>
                  <SourceBadge source={r.source} />
                </TableCell>
                <TableCell>
                  {canManage ? (
                    <Select
                      value={r.status}
                      onValueChange={(v) =>
                        handleStatusChange(r.id, v as ReservationStatus)
                      }
                      disabled={pending}
                    >
                      <SelectTrigger className="w-[150px]">
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
                    <StatusBadge status={r.status} />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No bookings match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
