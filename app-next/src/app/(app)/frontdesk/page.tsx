import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getFrontDeskData } from "@/features/frontdesk/services";
import { FrontDeskBoard } from "@/features/frontdesk/components/frontdesk-board";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Front Desk · HotelOS" };

export default async function FrontDeskPage() {
  const ctx = await requirePermission("frontdesk:operate");
  const data = await getFrontDeskData(ctx.organization.id);
  const canOperate = can(ctx.membership.role, "frontdesk:operate");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Front Desk"
        description="Arrivals, in-house guests and departures — check in and out in real time."
      />
      <FrontDeskBoard
        organizationId={ctx.organization.id}
        data={data}
        canOperate={canOperate}
      />
    </div>
  );
}
