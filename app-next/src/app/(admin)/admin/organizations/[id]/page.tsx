import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrganizationDetail, listPlans } from "@/features/admin/services";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgManager } from "@/features/admin/components/org-manager";

export const metadata = { title: "Admin · Organization" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrgDetailPage({ params }: Props) {
  const { id } = await params;
  const [detail, plans] = await Promise.all([
    getOrganizationDetail(id),
    listPlans(),
  ]);
  if (!detail) notFound();

  const { organization: org, plan, subscription, counts, ownerEmail } = detail;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/organizations"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All organizations
        </Link>
      </div>

      <PageHeader
        title={org.name}
        description={`${org.type} · ${org.currency} · created ${new Date(
          org.created_at,
        ).toLocaleDateString()}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Staff" value={counts.staff} icon="users" />
        <KpiCard label="Rooms" value={counts.rooms} icon="bed-double" />
        <KpiCard label="Reservations" value={counts.reservations} icon="calendar-check" />
        <KpiCard label="Guests" value={counts.guests} icon="users" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Detail label="Slug" value={org.slug} />
            <Detail label="Owner" value={ownerEmail ?? "—"} />
            <Detail label="Address" value={org.address ?? "—"} />
            <Detail label="Timezone" value={org.timezone} />
            <Detail
              label="Current plan"
              value={plan?.name ?? "No subscription"}
            />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              {subscription ? (
                <Badge
                  variant={
                    subscription.status === "ACTIVE" ? "default" : "secondary"
                  }
                >
                  {subscription.status}
                </Badge>
              ) : (
                <span>—</span>
              )}
            </div>
          </CardContent>
        </Card>

        <OrgManager
          organizationId={org.id}
          name={org.name}
          plans={plans}
          currentPlanId={subscription?.plan_id ?? null}
          currentStatus={subscription?.status ?? null}
        />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
