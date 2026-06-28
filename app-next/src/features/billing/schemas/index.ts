import { z } from "zod";

export const invoiceSchema = z.object({
  reservationId: z.string().uuid().optional(),
  guestId: z.string().uuid().optional(),
  subtotal: z.coerce.number().min(0),
  gstRate: z.coerce.number().min(0).max(100).default(0),
  dueAt: z.string().optional(),
});

export const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  method: z.enum(["CARD", "CASH", "BANK_TRANSFER", "UPI", "PAYPAL", "OTHER"]),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
