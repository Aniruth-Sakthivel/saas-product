"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import { cn, formatCurrency } from "@/lib/utils";
import {
  nightsBetween,
  todayISO,
  addDaysISO,
} from "@/features/booking/lib/pricing";
import type { AvailabilityResult } from "@/features/booking/services/public";
import {
  searchAvailabilityAction,
  createPublicBookingAction,
  type BookingConfirmation,
} from "@/features/booking/actions";

interface RoomTypeOption {
  id: string;
  name: string;
  capacity: number;
}

interface Props {
  slug: string;
  currency: string;
  initialRoomTypeId: string | null;
  roomTypes: RoomTypeOption[];
}

type Step = 1 | 2 | 3 | 4;

const STEPS = ["Search", "Choose room", "Your details", "Confirmed"];

export function BookingWizard({
  slug,
  currency,
  initialRoomTypeId,
  roomTypes,
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Search state
  const [checkIn, setCheckIn] = useState(addDaysISO(todayISO(), 1));
  const [checkOut, setCheckOut] = useState(addDaysISO(todayISO(), 2));
  const [guests, setGuests] = useState(2);
  const [roomFilter, setRoomFilter] = useState(initialRoomTypeId ?? "");

  // Results / selection
  const [results, setResults] = useState<AvailabilityResult[]>([]);
  const [selected, setSelected] = useState<AvailabilityResult | null>(null);

  // Guest details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(
    null,
  );

  const nights = nightsBetween(checkIn, checkOut);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (nights < 1) {
      toast.error("Check-out must be after check-in.");
      return;
    }
    setLoading(true);
    const res = await searchAvailabilityAction(slug, {
      checkIn,
      checkOut,
      guests,
      roomTypeId: roomFilter || undefined,
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setResults(res.data);
    setSelected(null);
    setStep(2);
  }

  function chooseRoom(r: AvailabilityResult) {
    setSelected(r);
    setStep(3);
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    const res = await createPublicBookingAction(slug, {
      checkIn,
      checkOut,
      guests,
      roomTypeId: selected.roomType.id,
      fullName,
      email,
      phone,
      city,
      notes,
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setConfirmation(res.data);
    setStep(4);
  }

  return (
    <div>
      <Stepper current={step} />

      {step === 1 && (
        <Card>
          <h2 className="text-xl font-semibold">Find your room</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select your dates and party size to see live availability.
          </p>
          <form
            onSubmit={handleSearch}
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Field label="Check-in">
              <Input
                type="date"
                value={checkIn}
                min={todayISO()}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (new Date(checkOut) <= new Date(e.target.value)) {
                    setCheckOut(addDaysISO(e.target.value, 1));
                  }
                }}
                required
              />
            </Field>
            <Field label="Check-out">
              <Input
                type="date"
                value={checkOut}
                min={addDaysISO(checkIn, 1)}
                onChange={(e) => setCheckOut(e.target.value)}
                required
              />
            </Field>
            <Field label="Guests">
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Room type (optional)">
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">Any room</option>
                {roomTypes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Searching…" : "Search availability"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Available rooms</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatRange(checkIn, checkOut)} · {nights}{" "}
                {nights === 1 ? "night" : "nights"} · {guests}{" "}
                {guests === 1 ? "guest" : "guests"}
              </p>
            </div>
            <Button variant="outline" onClick={() => setStep(1)}>
              Edit search
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {results.filter((r) => r.availableRooms > 0).length === 0 && (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <p className="font-medium">No rooms available</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try different dates or a smaller party size.
                </p>
                <Button className="mt-4" variant="outline" onClick={() => setStep(1)}>
                  Change dates
                </Button>
              </div>
            )}

            {results.map((r) => {
              const soldOut = r.availableRooms < 1;
              return (
                <div
                  key={r.roomType.id}
                  className={cn(
                    "flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between",
                    soldOut && "opacity-60",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{r.roomType.name}</h3>
                      {!soldOut && r.availableRooms <= 3 && (
                        <Badge variant="secondary">
                          Only {r.availableRooms} left
                        </Badge>
                      )}
                    </div>
                    {r.roomType.beds && (
                      <p className="text-sm text-muted-foreground">
                        {r.roomType.beds} · Sleeps {r.roomType.capacity}
                      </p>
                    )}
                    {r.roomType.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {r.roomType.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {formatCurrency(r.quote.subtotal, currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(r.roomType.base_price, currency)} × {nights}{" "}
                        {nights === 1 ? "night" : "nights"}
                      </div>
                    </div>
                    <Button disabled={soldOut} onClick={() => chooseRoom(r)}>
                      {soldOut ? "Sold out" : "Select"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {step === 3 && selected && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <h2 className="text-xl font-semibold">Guest details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll use these to confirm your reservation.
            </p>
            <form onSubmit={handleBook} className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" className="sm:col-span-2">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </Field>
              <Field label="Email">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Phone">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </Field>
              <Field label="City (optional)" className="sm:col-span-2">
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </Field>
              <Field label="Special requests (optional)" className="sm:col-span-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </Field>
              <div className="flex gap-3 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Confirming…" : "Confirm reservation"}
                </Button>
              </div>
            </form>
          </Card>

          <SummaryCard
            currency={currency}
            roomName={selected.roomType.name}
            range={formatRange(checkIn, checkOut)}
            guests={guests}
            quote={selected.quote}
          />
        </div>
      )}

      {step === 4 && confirmation && (
        <Confirmation data={confirmation} slug={slug} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- helpers */

function Stepper({ current }: { current: Step }) {
  return (
    <ol className="mb-8 flex items-center gap-2">
      {STEPS.map((label, i) => {
        const n = (i + 1) as Step;
        const done = current > n;
        const active = current === n;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full border text-sm font-medium",
                active && "border-transparent text-white",
                done && "border-transparent bg-primary/20 text-primary",
                !active && !done && "text-muted-foreground",
              )}
              style={active ? { background: "var(--accent)" } : undefined}
            >
              {done ? "✓" : n}
            </span>
            <span
              className={cn(
                "hidden text-sm sm:block",
                active ? "font-medium" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 hidden h-px flex-1 bg-border sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-card p-6 shadow-sm">{children}</div>;
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SummaryCard({
  currency,
  roomName,
  range,
  guests,
  quote,
}: {
  currency: string;
  roomName: string;
  range: string;
  guests: number;
  quote: AvailabilityResult["quote"];
}) {
  return (
    <div className="h-fit rounded-2xl border bg-card p-6 shadow-sm lg:sticky lg:top-6">
      <h3 className="font-semibold">Booking summary</h3>
      <div className="mt-4 space-y-3 text-sm">
        <Row label="Room" value={roomName} />
        <Row label="Dates" value={range} />
        <Row label="Guests" value={String(guests)} />
        <Row
          label={`${formatCurrency(quote.nightlyRate, currency)} × ${quote.nights} ${
            quote.nights === 1 ? "night" : "nights"
          }`}
          value={formatCurrency(quote.subtotal, currency)}
        />
        <Row
          label="Taxes & fees"
          value={formatCurrency(quote.taxes, currency)}
        />
        <div className="border-t pt-3">
          <Row
            label="Total"
            value={formatCurrency(quote.total, currency)}
            strong
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className={cn("text-muted-foreground", strong && "font-semibold text-foreground")}>
        {label}
      </span>
      <span className={cn("text-right", strong ? "text-base font-semibold" : "font-medium")}>
        {value}
      </span>
    </div>
  );
}

function Confirmation({
  data,
  slug,
}: {
  data: BookingConfirmation;
  slug: string;
}) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <div
        className="mx-auto grid size-16 place-items-center rounded-full text-white"
        style={{ background: "var(--accent)" }}
      >
        <Icon name="calendar-check" className="size-8" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold">Reservation confirmed</h2>
      <p className="mt-2 text-muted-foreground">
        Thank you, your booking at {data.hotelName} is confirmed.{" "}
        {data.emailed
          ? `A confirmation and invoice have been sent to ${data.guestEmail}.`
          : `Please save your confirmation code below.`}
      </p>

      <div className="mt-8 rounded-2xl border bg-card p-6 text-left shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Confirmation code</span>
          <span className="rounded-md bg-muted px-2 py-1 font-mono text-sm font-semibold">
            {data.code}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Invoice</span>
          <span className="font-mono text-sm font-medium">
            {data.invoiceNumber}
          </span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <Row label="Room" value={data.roomTypeName} />
          <Row label="Check-in" value={formatDateLong(data.checkIn)} />
          <Row label="Check-out" value={formatDateLong(data.checkOut)} />
          <Row
            label="Guests"
            value={`${data.guests} · ${data.nights} ${
              data.nights === 1 ? "night" : "nights"
            }`}
          />
          <div className="border-t pt-3">
            <Row
              label="Total paid"
              value={formatCurrency(data.total, data.currency)}
              strong
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Button asChild variant="outline">
          <a href={`/hotel/${slug}`}>Back to hotel</a>
        </Button>
        <Button asChild>
          <a href={`/hotel/${slug}/book`}>Book another room</a>
        </Button>
      </div>
    </div>
  );
}

function formatRange(a: string, b: string) {
  return `${formatDateShort(a)} → ${formatDateShort(b)}`;
}
function formatDateShort(v: string) {
  return new Date(`${v}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
function formatDateLong(v: string) {
  return new Date(`${v}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
