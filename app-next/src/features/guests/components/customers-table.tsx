"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { SortableHead } from "@/components/sortable-head";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import { useSort } from "@/lib/use-sort";
import { formatCurrency, formatDate, initialsFromName } from "@/lib/utils";
import type { GuestListItem } from "@/features/guests/services";

interface Props {
  organizationId: string;
  currency: string;
  guests: GuestListItem[];
}

export function CustomersTable({ organizationId, currency, guests }: Props) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<"ALL" | "VIP" | "REPEAT">("ALL");
  useRealtimeRefresh(organizationId, ["guests"], "guests");

  const q = query.trim().toLowerCase();
  const filtered = guests.filter((g) => {
    if (segment === "VIP" && !g.vip) return false;
    if (segment === "REPEAT" && g.bookings < 2) return false;
    if (!q) return true;
    return (
      g.full_name.toLowerCase().includes(q) ||
      (g.email ?? "").toLowerCase().includes(q) ||
      (g.phone ?? "").toLowerCase().includes(q) ||
      (g.city ?? "").toLowerCase().includes(q)
    );
  });

  const { sorted, sortKey, dir, toggle } = useSort<GuestListItem>(
    filtered,
    "created_at",
    "desc",
  );

  if (guests.length === 0) {
    return (
      <EmptyState
        icon="users"
        title="No customers yet"
        description="Guests who book on your public site will appear here automatically."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search name, email, phone or city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={segment} onValueChange={(v) => setSegment(v as typeof segment)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All customers</SelectItem>
            <SelectItem value="VIP">VIP only</SelectItem>
            <SelectItem value="REPEAT">Repeat guests</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground">
          {sorted.length} of {guests.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Name" sortKey="full_name" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof GuestListItem)} />
              <SortableHead label="Contact" sortKey="email" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof GuestListItem)} />
              <SortableHead label="City" sortKey="city" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof GuestListItem)} />
              <SortableHead label="Bookings" sortKey="bookings" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof GuestListItem)} align="right" />
              <SortableHead label="Total spend" sortKey="totalSpend" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof GuestListItem)} align="right" />
              <SortableHead label="Last stay" sortKey="lastCheckIn" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof GuestListItem)} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((g) => (
              <TableRow key={g.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initialsFromName(g.full_name)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        {g.full_name}
                        {g.vip && <Badge variant="warning">VIP</Badge>}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {g.email && <div>{g.email}</div>}
                  {g.phone && (
                    <div className="text-muted-foreground">{g.phone}</div>
                  )}
                  {!g.email && !g.phone && "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {g.city ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {g.bookings}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(g.totalSpend, currency)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {g.lastCheckIn ? formatDate(g.lastCheckIn) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No customers match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
