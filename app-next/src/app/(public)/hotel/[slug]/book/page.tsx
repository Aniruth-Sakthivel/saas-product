import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHotelBySlug, getRoomTypes } from "@/features/booking/services/public";
import { BookingWizard } from "@/features/booking/components/booking-wizard";
import { Icon } from "@/components/icon";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ room?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);
  return { title: hotel ? `Book · ${hotel.name}` : "Book your stay" };
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { room } = await searchParams;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();

  const roomTypes = await getRoomTypes(hotel.id);
  const accent = hotel.brand_color || "#4F46E5";

  return (
    <div style={{ ["--accent" as string]: accent }}>
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link
            href={`/hotel/${hotel.slug}`}
            className="flex items-center gap-2"
          >
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
          <Link
            href={`/hotel/${hotel.slug}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to hotel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <BookingWizard
          slug={hotel.slug}
          currency={hotel.currency}
          initialRoomTypeId={room ?? null}
          roomTypes={roomTypes.map((r) => ({
            id: r.id,
            name: r.name,
            capacity: r.capacity,
          }))}
        />
      </main>
    </div>
  );
}
