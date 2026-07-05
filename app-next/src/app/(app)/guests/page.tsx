import { requirePermission } from "@/lib/auth";
import { listGuests } from "@/features/guests/services";
import { CustomersTable } from "@/features/guests/components/customers-table";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Customers · HotelOS" };

export default async function GuestsPage() {
  const ctx = await requirePermission("guests:manage");
  const guests = await listGuests(ctx.organization.id);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description="Everyone who has booked or stayed with you, synced from every booking."
      />
      <CustomersTable
        organizationId={ctx.organization.id}
        currency={ctx.organization.currency}
        guests={guests}
      />
    </div>
  );
}
