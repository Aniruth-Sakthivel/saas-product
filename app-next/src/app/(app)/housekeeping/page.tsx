import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Housekeeping · HotelOS" };

export default function HousekeepingPage() {
  return (
    <ComingSoon
      title="Housekeeping"
      description="Assign and track room tasks."
      phase="Phase 4"
      icon="sparkles"
      features={["Task board", "Assignment", "Inspection", "Priorities"]}
    />
  );
}
