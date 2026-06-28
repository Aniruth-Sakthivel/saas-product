import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Reports · HotelOS" };

export default function ReportsPage() {
  return (
    <ComingSoon
      title="Reports"
      description="Analytics across revenue, occupancy and guests."
      phase="Phase 5"
      icon="bar-chart-3"
      features={["Revenue", "Occupancy", "ADR / RevPAR", "Exports"]}
    />
  );
}
