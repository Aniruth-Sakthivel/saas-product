import { requireActiveContext } from "@/lib/auth";
import { listStaff } from "@/features/organizations/services";
import { PageHeader } from "@/components/page-header";
import { StaffManager } from "@/features/organizations/components/staff-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS, ROLES, ROLE_LABELS, can } from "@/lib/rbac";
import { getSubscriptionOverview } from "@/features/billing/services/subscription";
import { BillingPanel } from "@/features/billing/components/billing-panel";

export const metadata = { title: "Settings · HotelOS" };

export default async function SettingsPage() {
  const ctx = await requireActiveContext();
  const staff = await listStaff(ctx.organization.id);
  const billing = await getSubscriptionOverview(ctx.organization.id);
  const canManageStaff = can(ctx.membership.role, "staff:manage");
  const org = ctx.organization;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Manage your workspace and property configuration."
      />

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="profile">Hotel Profile</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">General</CardTitle>
            </CardHeader>
            <CardContent className="grid max-w-xl gap-4">
              <div className="space-y-1.5">
                <Label>Workspace name</Label>
                <Input defaultValue={org.name} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input defaultValue={org.currency} />
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Input defaultValue={org.timezone} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Hotel profile</CardTitle>
            </CardHeader>
            <CardContent className="grid max-w-xl gap-4">
              <div className="space-y-1.5">
                <Label>Property name</Label>
                <Input defaultValue={org.name} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Input defaultValue={org.type} />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input defaultValue={org.address ?? ""} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Staff members</CardTitle>
            </CardHeader>
            <CardContent>
              <StaffManager
                staff={staff}
                canManage={canManageStaff}
                currentMembershipId={ctx.membership.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Roles &amp; permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ROLES.map((role) => (
                <div key={role} className="rounded-xl border p-4">
                  <p className="text-sm font-semibold">{ROLE_LABELS[role]}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PERMISSIONS[role].map((p) => (
                      <Badge key={p} variant="secondary">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Plan &amp; billing</CardTitle>
            </CardHeader>
            <CardContent>
              <BillingPanel overview={billing} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Email notifications are delivered via Resend. Configure
                preferences per event (new reservation, payment received,
                check-in reminders, housekeeping alerts, weekly digest).
              </p>
              <p className="text-xs">
                Notification preferences UI ships in Phase 5.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
