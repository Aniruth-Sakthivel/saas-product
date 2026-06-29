import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Plan } from "@/types/database";

export const metadata = { title: "Admin · Plans" };

export default async function AdminPlansPage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("plans").select("*").order("sort_order");
  const plans = (data ?? []) as Plan[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description="The platform plan catalog. Edit via migrations / Stripe sync."
      />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Yearly</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Stripe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>
                  {plan.currency} {Number(plan.price_monthly).toLocaleString()}
                </TableCell>
                <TableCell>
                  {plan.currency} {Number(plan.price_yearly).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(plan.features) ? plan.features : []).map(
                      (f) => (
                        <Badge key={String(f)} variant="secondary">
                          {String(f)}
                        </Badge>
                      ),
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={plan.stripe_product_id ? "default" : "secondary"}>
                    {plan.stripe_product_id ? "Synced" : "Not synced"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
