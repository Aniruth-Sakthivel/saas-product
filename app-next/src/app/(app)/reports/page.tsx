import { requirePermission } from "@/lib/auth";
import { getReportsData } from "@/features/reports/services";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { RevenueChart } from "@/features/dashboard/components/charts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Reports · HotelOS" };

export default async function ReportsPage() {
  const ctx = await requirePermission("reports:view");
  const data = await getReportsData(ctx.organization.id);
  const currency = ctx.organization.currency;
  const maxSource = Math.max(1, ...data.bySource.map((s) => s.revenue));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Revenue, occupancy and channel performance across your property."
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <KpiCard
          label="Revenue (30d)"
          value={formatCurrency(data.totalRevenue, currency)}
          icon="banknote"
          tone="emerald"
        />
        <KpiCard label="Bookings" value={data.totalBookings} icon="calendar-check" tone="indigo" />
        <KpiCard label="Occupancy" value={`${data.occupancyRate}%`} icon="bed-double" tone="sky" />
        <KpiCard label="ADR" value={formatCurrency(data.adr, currency)} icon="trending-up" tone="violet" />
        <KpiCard label="RevPAR" value={formatCurrency(data.revpar, currency)} icon="bar-chart-3" tone="rose" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Revenue — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={data.revenueTrend} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bookings by channel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.bySource.length === 0 ? (
              <EmptyState icon="bar-chart-3" title="No bookings yet" />
            ) : (
              data.bySource.map((s) => (
                <div key={s.source} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.source}</span>
                    <span className="text-muted-foreground">
                      {s.count} · {formatCurrency(s.revenue, currency)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(s.revenue / maxSource) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Reservations by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.byStatus.length === 0 ? (
              <EmptyState icon="calendar-check" title="No reservations yet" />
            ) : (
              data.byStatus.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center justify-between"
                >
                  <StatusBadge status={s.status} />
                  <span className="text-sm font-semibold">{s.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
