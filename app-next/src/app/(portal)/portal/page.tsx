import Link from "next/link";
import { requireActiveContext } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { PRODUCTS } from "@/constants/products";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";

export const metadata = { title: "My Products · Portal" };

export default async function PortalHomePage() {
  const ctx = await requireActiveContext();
  const ent = await getEntitlements(ctx.organization.id);
  const unlocked = ent?.isActive ? ent.features : new Set<string>();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${ctx.organization.name}`}
        description="Launch your products and manage your subscription from one place."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {PRODUCTS.map((product) => {
          const entitled = unlocked.has(product.feature);
          const launchable = product.status === "live" && entitled && product.href;

          return (
            <Card key={product.key}>
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={product.icon} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      {product.status === "soon" && (
                        <Badge variant="secondary">Coming soon</Badge>
                      )}
                      {product.status === "live" && !entitled && (
                        <Badge variant="secondary">Upgrade</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="mt-auto">
                  {launchable ? (
                    <Button asChild>
                      <Link href={product.href!}>Open {product.name}</Link>
                    </Button>
                  ) : product.status === "live" ? (
                    <Button asChild variant="outline">
                      <Link href="/portal/billing">Upgrade to unlock</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      Not available yet
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
