import { requireActiveContext } from "@/lib/auth";
import { listStaff } from "@/features/organizations/services";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/page-header";
import { StaffManager } from "@/features/organizations/components/staff-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Organization · Portal" };

export default async function PortalOrganizationPage() {
  const ctx = await requireActiveContext();
  const staff = await listStaff(ctx.organization.id);
  const canManageStaff = can(ctx.membership.role, "staff:manage");
  const org = ctx.organization;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        description="Your workspace details and team members."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Workspace</CardTitle>
        </CardHeader>
        <CardContent className="grid max-w-xl gap-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input defaultValue={org.name} readOnly />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input defaultValue={org.currency} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input defaultValue={org.timezone} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Team members</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffManager
            staff={staff}
            canManage={canManageStaff}
            currentMembershipId={ctx.membership.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
