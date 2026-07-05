import { createClient } from "@/lib/supabase/server";
import type { InvoiceStatus } from "@/types/database";

export interface InvoiceListItem {
  id: string;
  number: string;
  guestName: string | null;
  reservationCode: string | null;
  subtotal: number;
  gst_amount: number;
  total: number;
  status: InvoiceStatus;
  issued_at: string;
}

export interface BillingData {
  invoices: InvoiceListItem[];
  totalCollected: number;
  outstanding: number;
  paidCount: number;
}

export async function getBillingData(
  organizationId: string,
): Promise<BillingData> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select(
      `id, number, subtotal, gst_amount, total, status, issued_at,
       guest:guests(full_name), reservation:reservations(code)`,
    )
    .eq("organization_id", organizationId)
    .order("issued_at", { ascending: false });

  type Row = {
    id: string;
    number: string;
    subtotal: number;
    gst_amount: number;
    total: number;
    status: InvoiceStatus;
    issued_at: string;
    guest: { full_name: string } | null;
    reservation: { code: string } | null;
  };
  const invoices: InvoiceListItem[] = ((data ?? []) as unknown as Row[]).map(
    (i) => ({
      id: i.id,
      number: i.number,
      guestName: i.guest?.full_name ?? null,
      reservationCode: i.reservation?.code ?? null,
      subtotal: Number(i.subtotal),
      gst_amount: Number(i.gst_amount),
      total: Number(i.total),
      status: i.status,
      issued_at: i.issued_at,
    }),
  );

  const totalCollected = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.total, 0);
  const outstanding = invoices
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
    .reduce((s, i) => s + i.total, 0);

  return {
    invoices,
    totalCollected,
    outstanding,
    paidCount: invoices.filter((i) => i.status === "PAID").length,
  };
}
