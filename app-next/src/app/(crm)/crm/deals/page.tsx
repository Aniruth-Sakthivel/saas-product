import { requireFeatureContext } from "@/lib/auth";
import { listDeals } from "@/features/crm/services";
import { DEAL_STAGES } from "@/features/crm/schemas";
import { PageHeader } from "@/components/page-header";
import { DealForm } from "@/features/crm/components/deal-form";
import { Card } from "@/components/ui/card";
import type { CrmDeal, DealStage } from "@/types/database";

export const metadata = { title: "CRM · Deals" };

export default async function CrmDealsPage() {
  const ctx = await requireFeatureContext("crm");
  const deals = await listDeals(ctx.organization.id);
  const currency = ctx.organization.currency;

  const byStage = (stage: DealStage) => deals.filter((d) => d.stage === stage);

  return (
    <div className="space-y-6">
      <PageHeader title="Deals" description="Your sales pipeline by stage." />
      <DealForm />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {DEAL_STAGES.map((stage) => {
          const items = byStage(stage);
          const total = items.reduce((s, d) => s + Number(d.value), 0);
          return (
            <div key={stage} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  {stage}
                </span>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {currency} {total.toLocaleString()}
              </p>
              <div className="space-y-2">
                {items.map((d: CrmDeal) => (
                  <Card key={d.id} className="p-3">
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {currency} {Number(d.value).toLocaleString()}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
