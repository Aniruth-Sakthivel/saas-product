import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";

interface ComingSoonProps {
  title: string;
  description: string;
  phase: string;
  icon: string;
  features: string[];
}

export function ComingSoon({
  title,
  description,
  phase,
  icon,
  features,
}: ComingSoonProps) {
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description}>
        <Badge variant="secondary">{phase}</Badge>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={icon}
            title={`${title} is scaffolded`}
            description="This module's data model, schemas and RLS are ready. The UI and actions land in the phase noted above."
          />
          <div className="mx-auto mt-2 flex max-w-md flex-wrap justify-center gap-1.5">
            {features.map((f) => (
              <Badge key={f} variant="outline">
                {f}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
