import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getRoomsData } from "@/features/rooms/services";
import { RoomsBoard } from "@/features/rooms/components/rooms-board";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Rooms · HotelOS" };

export default async function RoomsPage() {
  const ctx = await requirePermission("rooms:manage");
  const data = await getRoomsData(ctx.organization.id);
  const canManage = can(ctx.membership.role, "rooms:manage");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rooms"
        description="Live room status board across every floor."
      />
      <RoomsBoard
        organizationId={ctx.organization.id}
        currency={ctx.organization.currency}
        data={data}
        canManage={canManage}
      />
    </div>
  );
}
