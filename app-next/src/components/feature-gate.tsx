import { hasFeature, type FeatureKey } from "@/lib/entitlements";

/**
 * Server component that renders `children` only when the organization's plan
 * includes `feature`. Otherwise renders `fallback` (default: nothing).
 *
 * Usage:
 *   <FeatureGate organizationId={org.id} feature="analytics" fallback={<Upgrade />}>
 *     <AnalyticsDashboard />
 *   </FeatureGate>
 */
export async function FeatureGate({
  organizationId,
  feature,
  children,
  fallback = null,
}: {
  organizationId: string;
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const allowed = await hasFeature(organizationId, feature);
  return <>{allowed ? children : fallback}</>;
}
