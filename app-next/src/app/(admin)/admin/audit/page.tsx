import { recentAuditLogs } from "@/features/admin/services";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Admin · Audit Logs" };

export default async function AdminAuditPage() {
  const logs = await recentAuditLogs(100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit logs"
        description="The latest activity across every tenant."
      />
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Actor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {new Date(l.created_at).toLocaleString()}
                </TableCell>
                <TableCell>{l.organizationName}</TableCell>
                <TableCell className="font-medium">{l.action}</TableCell>
                <TableCell className="text-muted-foreground">{l.entity}</TableCell>
                <TableCell className="text-muted-foreground">{l.actorEmail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
