import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHotelBySlug, getRoomTypes } from "@/features/booking/services/public";
import {
  AMENITIES,
  OFFERS,
  ROOM_PERKS,
  gradientFor,
} from "@/features/booking/lib/content";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);
  return {
    title: hotel ? `${hotel.name} — Book your stay` : "Hotel",
    description: hotel?.address ?? "Book your next stay.",
  };
}

export default async function HotelLandingPage({ params }: Props) {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();

  const roomTypes = await getRoomTypes(hotel.id);
  const accent = hotel.brand_color || "#4F46E5";
  const fromPrice = roomTypes.length
    ? Math.min(...roomTypes.map((r) => r.base_price))
    : 0;
  const bookHref = `/hotel/${hotel.slug}/book`;

  return (
    <div style={{ ["--accent" as string]: accent }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href={bookHref} className="flex items-center gap-2 text-white">
            <span
              className="grid size-8 place-items-center rounded-lg text-white"
              style={{ background: accent }}
            >
              <Icon name="bed-double" className="size-[18px]" />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">
              {hotel.name}
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
            <a href="#rooms" className="hover:text-white">Rooms</a>
            <a href="#amenities" className="hover:text-white">Amenities</a>
            <a href="#offers" className="hover:text-white">Offers</a>
          </nav>
          <Button asChild style={{ background: accent }} className="text-white">
            <Link href={bookHref}>Book now</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `radial-gradient(1200px 500px at 80% -10%, ${accent}66, transparent), linear-gradient(180deg,#0b1020,#111827)`,
        }}
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 md:grid-cols-2 md:py-32">
          <div className="flex flex-col justify-center text-white">
            {hotel.address && (
              <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
                <Icon name="map-pin" className="size-3.5" />
                {hotel.address}
              </span>
            )}
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Your perfect stay at{" "}
              <span style={{ color: accent }}>{hotel.name}</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/70">
              Thoughtfully designed rooms, world-class amenities and effortless
              booking. Reserve in under two minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                style={{ background: accent }}
                className="text-white"
              >
                <Link href={bookHref}>Check availability</Link>
              </Button>
              <a href="#rooms">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  Explore rooms
                </Button>
              </a>
            </div>
            {fromPrice > 0 && (
              <p className="mt-6 text-sm text-white/60">
                Rooms from{" "}
                <span className="font-semibold text-white">
                  {formatCurrency(fromPrice, hotel.currency)}
                </span>{" "}
                / night
              </p>
            )}
          </div>

          {/* Floating stat cards */}
          <div className="relative hidden md:block">
            <div className="absolute right-0 top-6 w-64 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center gap-1 text-amber-300">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" className="size-4" />
                ))}
              </div>
              <p className="mt-3 text-sm text-white/80">
                “An unforgettable stay — impeccable service and beautiful rooms.”
              </p>
              <p className="mt-2 text-xs text-white/50">— Verified guest</p>
            </div>
            <div className="absolute bottom-4 left-2 w-56 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-3xl font-semibold text-white">
                {roomTypes.reduce((n, r) => n + r.totalRooms, 0)}+
              </p>
              <p className="text-sm text-white/70">Rooms & suites</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rooms */}
      <section id="rooms" className="mx-auto max-w-6xl px-5 py-20">
        <SectionTitle
          eyebrow="Accommodation"
          title="Rooms & suites"
          description="Choose the space that suits you — every room includes our signature comforts."
        />
        {roomTypes.length === 0 ? (
          <p className="text-muted-foreground">
            Rooms are being prepared. Please check back soon.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {roomTypes.map((room) => (
              <div
                key={room.id}
                className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="relative h-44"
                  style={{ background: gradientFor(room.name) }}
                >
                  <span className="absolute right-3 top-3 rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    Sleeps {room.capacity}
                  </span>
                  <Icon
                    name="bed-double"
                    className="absolute bottom-3 left-3 size-8 text-white/80"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold">{room.name}</h3>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(room.base_price, hotel.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        per night
                      </div>
                    </div>
                  </div>
                  {room.beds && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {room.beds}
                    </p>
                  )}
                  {room.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {room.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {ROOM_PERKS.slice(0, 3).map((perk) => (
                      <Badge key={perk} variant="secondary" className="font-normal">
                        {perk}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-5 flex-1" />
                  <Button asChild className="w-full">
                    <Link href={`${bookHref}?room=${room.id}`}>Book this room</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Amenities */}
      <section id="amenities" className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionTitle
            eyebrow="Amenities"
            title="Everything you need"
            description="Facilities designed to make your stay effortless and memorable."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {AMENITIES.map((a) => (
              <div
                key={a.title}
                className="flex gap-4 rounded-xl border bg-card p-5"
              >
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-white"
                  style={{ background: accent }}
                >
                  <Icon name={a.icon} className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {a.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offers */}
      <section id="offers" className="mx-auto max-w-6xl px-5 py-20">
        <SectionTitle
          eyebrow="Special offers"
          title="Deals worth booking"
          description="Limited-time packages to make your stay even better."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {OFFERS.map((offer) => (
            <div
              key={offer.title}
              className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm"
            >
              <Badge
                className="w-fit text-white"
                style={{ background: accent }}
              >
                {offer.badge}
              </Badge>
              <h3 className="mt-4 text-xl font-semibold">{offer.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                {offer.description}
              </p>
              <Button asChild variant="outline" className="mt-5 w-fit">
                <Link href={bookHref}>{offer.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24">
        <div
          className="mx-auto max-w-6xl overflow-hidden rounded-3xl px-8 py-16 text-center text-white"
          style={{
            background: `radial-gradient(800px 300px at 50% -20%, ${accent}, #111827)`,
          }}
        >
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready for your getaway?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">
            Check live availability and reserve your room in just a few clicks.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-white text-gray-900 hover:bg-white/90"
          >
            <Link href={bookHref}>Book your stay</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span
              className="grid size-7 place-items-center rounded-lg text-white"
              style={{ background: accent }}
            >
              <Icon name="bed-double" className="size-4" />
            </span>
            <span className="font-medium text-foreground">{hotel.name}</span>
          </div>
          <p>© {new Date().getFullYear()} {hotel.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
        {eyebrow}
      </p>
      <h2 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}
