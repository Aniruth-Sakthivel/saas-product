import { requireActiveContext } from "@/lib/auth";
import { getSubscriptionOverview } from "@/features/billing/services/subscription";
import { BillingPanel } from "@/features/billing/components/billing-panel";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Billing · Portal" };

export default async function PortalBillingPage() {
  const ctx = await requireActiveContext();
  const billing = await getSubscriptionOverview(ctx.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & subscription"
        description="Manage your plan, usage and payments."
      />
      <Card>
        <CardContent className="p-6">
          <BillingPanel overview={billing} />
        </CardContent>
      </Card>
    </div>
  );
}
