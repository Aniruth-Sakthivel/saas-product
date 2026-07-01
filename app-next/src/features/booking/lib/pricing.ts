/**
 * Pricing + date helpers for the public booking flow. Deliberately free of any
 * server-only imports so it can run on both the client wizard and the server
 * action that finalizes a reservation (single source of truth for money math).
 */

/** Taxes & fees applied on top of the room subtotal. */
export const TAX_RATE = 0.12;

/** Whole nights between two ISO/`yyyy-mm-dd` dates (min 0). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T00:00:00`);
  const b = new Date(`${checkOut}T00:00:00`);
  const ms = b.getTime() - a.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export interface Quote {
  nights: number;
  nightlyRate: number;
  subtotal: number;
  taxes: number;
  total: number;
}

/** Computes the full price breakdown for `nights` at `nightlyRate`. */
export function quote(nightlyRate: number, nights: number): Quote {
  const subtotal = Math.max(0, Math.round(nightlyRate * nights * 100) / 100);
  const taxes = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + taxes) * 100) / 100;
  return { nights, nightlyRate, subtotal, taxes, total };
}

/** `yyyy-mm-dd` for today (local), handy as a min for date inputs. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** `yyyy-mm-dd` `days` from `fromISO`. */
export function addDaysISO(fromISO: string, days: number): string {
  const d = new Date(`${fromISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
