import { requireActiveContext } from "@/lib/auth";
import { getDashboardData } from "@/features/dashboard/services";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RevenueChart,
  OccupancyChart,
} from "@/features/dashboard/components/charts";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Dashboard · HotelOS" };

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#059669",
  OCCUPIED: "#4F46E5",
  RESERVED: "#8B5CF6",
  CLEANING: "#F59E0B",
  MAINTENANCE: "#DC2626",
};

export default async function DashboardPage() {
  const ctx = await requireActiveContext();
  const data = await getDashboardData(ctx.organization.id);
  const currency = ctx.organization.currency;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Welcome back${ctx.profile?.full_name ? `, ${ctx.profile.full_name.split(" ")[0]}` : ""}`}
        description={`Here's what's happening at ${ctx.organization.name} today.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Occupancy"
          value={`${data.occupancyRate}%`}
          icon="bed-double"
          tone="indigo"
          sub={`${data.occupiedRooms} of ${data.totalRooms} rooms`}
        />
        <KpiCard
          label="Revenue today"
          value={formatCurrency(data.revenueToday, currency)}
          icon="banknote"
          tone="emerald"
        />
        <KpiCard
          label="Arrivals today"
          value={data.arrivalsToday}
          icon="log-in"
          tone="sky"
        />
        <KpiCard
          label="Departures today"
          value={data.departuresToday}
          icon="log-out"
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Revenue trend</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.revenueTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <OccupancyChart data={data.occupancyTrend} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Room status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {Object.entries(data.roomStatusCounts).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: STATUS_COLORS[status] }}
                  />
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.activity.length === 0 ? (
              <EmptyState
                icon="activity"
                title="No activity yet"
                description="Actions across your property will show up here."
              />
            ) : (
              <ul className="space-y-3">
                {data.activity.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Icon name="activity" className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{a.action}</span>{" "}
                        <span className="text-muted-foreground">
                          · {a.entity}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
