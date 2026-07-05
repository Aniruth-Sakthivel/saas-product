import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getHousekeepingData } from "@/features/housekeeping/services";
import { getRoomsData } from "@/features/rooms/services";
import { HousekeepingBoard } from "@/features/housekeeping/components/housekeeping-board";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Housekeeping · HotelOS" };

export default async function HousekeepingPage() {
  const ctx = await requirePermission("housekeeping:manage");
  const [data, roomsData] = await Promise.all([
    getHousekeepingData(ctx.organization.id),
    getRoomsData(ctx.organization.id),
  ]);
  const canManage = can(ctx.membership.role, "housekeeping:manage");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Housekeeping"
        description="Track cleaning and turnover tasks across the property."
      />
      <HousekeepingBoard
        organizationId={ctx.organization.id}
        data={data}
        rooms={roomsData.rooms.map((r) => ({ id: r.id, number: r.number }))}
        canManage={canManage}
      />
    </div>
  );
}
