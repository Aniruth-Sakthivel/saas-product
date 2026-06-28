import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Guests · HotelOS" };

export default function GuestsPage() {
  return (
    <ComingSoon
      title="Guests"
      description="A CRM for your guests."
      phase="Phase 3"
      icon="users"
      features={["Profiles", "Stay history", "Preferences", "Notes"]}
    />
  );
}
