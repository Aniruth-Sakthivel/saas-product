import { getAdminMetrics, recentAuditLogs } from "@/features/admin/services";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Admin · Dashboard" };

export default async function AdminDashboardPage() {
  const [metrics, audit] = await Promise.all([
    getAdminMetrics(),
    recentAuditLogs(8),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Cross-tenant metrics for the whole platform."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Organizations" value={metrics.organizations} icon="users" />
        <KpiCard
          label="Active subscriptions"
          value={metrics.activeSubscriptions}
          icon="receipt"
        />
        <KpiCard label="On trial" value={metrics.trials} icon="activity" />
        <KpiCard
          label="MRR"
          value={`${metrics.currency} ${metrics.mrr.toLocaleString()}`}
          icon="banknote"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {audit.length === 0 ? (
            <p className="text-muted-foreground">No activity yet.</p>
          ) : (
            audit.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b py-2 last:border-0"
              >
                <span>
                  <span className="font-medium">{l.action}</span>{" "}
                  <span className="text-muted-foreground">
                    on {l.entity} · {l.organizationName}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {l.actorEmail} · {new Date(l.created_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
