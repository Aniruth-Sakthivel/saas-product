import { listOrganizations } from "@/features/admin/services";
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

export const metadata = { title: "Admin · Organizations" };

export default async function AdminOrganizationsPage() {
  const orgs = await listOrganizations();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description={`${orgs.length} tenant${orgs.length === 1 ? "" : "s"} on the platform.`}
      />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map(({ organization, plan, status }) => (
              <TableRow key={organization.id}>
                <TableCell className="font-medium">{organization.name}</TableCell>
                <TableCell>{plan?.name ?? "—"}</TableCell>
                <TableCell>
                  {status ? (
                    <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
                      {status}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(organization.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
