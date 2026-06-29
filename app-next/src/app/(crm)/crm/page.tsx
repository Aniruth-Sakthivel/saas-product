import Link from "next/link";
import { requireFeatureContext } from "@/lib/auth";
import { getCrmOverview } from "@/features/crm/services";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "CRM · Overview" };

export default async function CrmOverviewPage() {
  const ctx = await requireFeatureContext("crm");
  const o = await getCrmOverview(ctx.organization.id);
  const currency = ctx.organization.currency;

  return (
    <div className="space-y-6">
      <PageHeader title="CRM overview" description="Your pipeline at a glance.">
        <Button asChild variant="outline">
          <Link href="/crm/contacts">Contacts</Link>
        </Button>
        <Button asChild>
          <Link href="/crm/deals">Deals</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Companies" value={o.companies} icon="layout-dashboard" />
        <KpiCard label="Contacts" value={o.contacts} icon="users" />
        <KpiCard label="Open deals" value={o.openDeals} icon="activity" />
        <KpiCard
          label="Pipeline value"
          value={`${currency} ${o.pipelineValue.toLocaleString()}`}
          icon="banknote"
        />
      </div>
    </div>
  );
}
