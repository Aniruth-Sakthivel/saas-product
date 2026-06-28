import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Billing · HotelOS" };

export default function BillingPage() {
  return (
    <ComingSoon
      title="Billing"
      description="Invoices, payments and revenue."
      phase="Phase 4"
      icon="receipt"
      features={["Invoices", "Payments", "GST support", "History"]}
    />
  );
}
