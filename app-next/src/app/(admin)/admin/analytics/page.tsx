import { getPlatformAnalytics } from "@/features/admin/services/analytics";
import { getAdminMetrics } from "@/features/admin/services";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OrgGrowthChart,
  DistributionChart,
} from "@/features/admin/components/analytics-charts";

export const metadata = { title: "Admin · Analytics" };

export default async function AdminAnalyticsPage() {
  const [analytics, metrics] = await Promise.all([
    getPlatformAnalytics(),
    getAdminMetrics(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Revenue, growth and churn across the platform."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="MRR"
          value={`${metrics.currency} ${metrics.mrr.toLocaleString()}`}
          icon="banknote"
        />
        <KpiCard label="Active" value={metrics.activeSubscriptions} icon="receipt" />
        <KpiCard label="Trials" value={metrics.trials} icon="activity" />
        <KpiCard label="Churn" value={`${analytics.churnRate}%`} icon="trending-down" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">New organizations (6 mo)</CardTitle>
          </CardHeader>
          <CardContent>
            <OrgGrowthChart data={analytics.orgGrowth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Plan distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionChart data={analytics.planDistribution} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Subscriptions by status</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionChart data={analytics.statusBreakdown} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
