import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listReservations } from "@/features/reservations/services";
import { BookingsTable } from "@/features/reservations/components/bookings-table";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Bookings · HotelOS" };

export default async function ReservationsPage() {
  const ctx = await requirePermission("reservations:manage");
  const reservations = await listReservations(ctx.organization.id);
  const canManage = can(ctx.membership.role, "reservations:manage");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bookings"
        description="Every reservation across your channels, updated in real time."
      />
      <BookingsTable
        organizationId={ctx.organization.id}
        currency={ctx.organization.currency}
        reservations={reservations}
        canManage={canManage}
      />
    </div>
  );
}
