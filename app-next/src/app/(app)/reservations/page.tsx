import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Reservations · HotelOS" };

export default function ReservationsPage() {
  return (
    <ComingSoon
      title="Reservations"
      description="Manage bookings across every channel."
      phase="Phase 2"
      icon="calendar-check"
      features={[
        "Create & edit",
        "Availability check",
        "Calendar view",
        "Status lifecycle",
      ]}
    />
  );
}
