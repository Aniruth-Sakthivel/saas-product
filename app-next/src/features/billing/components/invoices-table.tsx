"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { SortableHead } from "@/components/sortable-head";
import { EmptyState } from "@/components/empty-state";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import { useSort } from "@/lib/use-sort";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BillingData, InvoiceListItem } from "@/features/billing/services/invoices";
import { recordPaymentAction } from "@/features/billing/actions/payments";

const STATUS_FILTERS = ["PAID", "PENDING", "OVERDUE", "REFUNDED"];

interface Props {
  organizationId: string;
  currency: string;
  data: BillingData;
  canManage: boolean;
}

export function InvoicesTable({
  organizationId,
  currency,
  data,
  canManage,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [pending, startTransition] = useTransition();
  useRealtimeRefresh(organizationId, ["invoices", "payments"], "billing");

  function pay(invoiceId: string) {
    startTransition(async () => {
      const res = await recordPaymentAction({ invoiceId, method: "CARD" });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Payment recorded.");
      router.refresh();
    });
  }

  const q = query.trim().toLowerCase();
  const filtered = data.invoices.filter((i) => {
    if (status !== "ALL" && i.status !== status) return false;
    if (!q) return true;
    return (
      i.number.toLowerCase().includes(q) ||
      (i.guestName ?? "").toLowerCase().includes(q) ||
      (i.reservationCode ?? "").toLowerCase().includes(q)
    );
  });

  const { sorted, sortKey, dir, toggle } = useSort<InvoiceListItem>(
    filtered,
    "issued_at",
    "desc",
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Collected"
          value={formatCurrency(data.totalCollected, currency)}
          icon="banknote"
          tone="emerald"
        />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(data.outstanding, currency)}
          icon="receipt"
          tone="amber"
        />
        <KpiCard
          label="Paid invoices"
          value={data.paidCount}
          icon="check"
          tone="indigo"
        />
      </div>

      {data.invoices.length === 0 ? (
        <EmptyState
          icon="receipt"
          title="No invoices yet"
          description="Invoices are generated automatically when guests book."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search invoice, guest or booking code…"
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
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-sm text-muted-foreground">
              {sorted.length} of {data.invoices.length}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Invoice" sortKey="number" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof InvoiceListItem)} />
                  <SortableHead label="Guest" sortKey="guestName" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof InvoiceListItem)} />
                  <SortableHead label="Booking" sortKey="reservationCode" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof InvoiceListItem)} />
                  <SortableHead label="Issued" sortKey="issued_at" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof InvoiceListItem)} />
                  <SortableHead label="Subtotal" sortKey="subtotal" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof InvoiceListItem)} align="right" />
                  <SortableHead label="Tax" sortKey="gst_amount" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof InvoiceListItem)} align="right" />
                  <SortableHead label="Total" sortKey="total" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof InvoiceListItem)} align="right" />
                  <SortableHead label="Status" sortKey="status" activeKey={sortKey as string | null} dir={dir} onSort={(k) => toggle(k as keyof InvoiceListItem)} />
                  {canManage && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {i.number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {i.guestName ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {i.reservationCode ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(i.issued_at)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(i.subtotal, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(i.gst_amount, currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(i.total, currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={i.status} />
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        {i.status !== "PAID" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => pay(i.id)}
                          >
                            Mark paid
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManage ? 9 : 8} className="py-10 text-center text-sm text-muted-foreground">
                      No invoices match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
