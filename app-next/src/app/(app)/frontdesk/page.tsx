import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Front Desk · HotelOS" };

export default function FrontDeskPage() {
  return (
    <ComingSoon
      title="Front Desk"
      description="The operational center for arrivals and departures."
      phase="Phase 3"
      icon="concierge-bell"
      features={["Check-in", "Check-out", "Walk-in booking", "Active stays"]}
    />
  );
}
