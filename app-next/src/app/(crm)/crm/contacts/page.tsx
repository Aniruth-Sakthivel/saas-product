import { requireFeatureContext } from "@/lib/auth";
import { listContacts } from "@/features/crm/services";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/features/crm/components/contact-form";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "CRM · Contacts" };

export default async function CrmContactsPage() {
  const ctx = await requireFeatureContext("crm");
  const contacts = await listContacts(ctx.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description={`${contacts.length} contact${contacts.length === 1 ? "" : "s"}.`}
      />
      <ContactForm />

      {contacts.length === 0 ? (
        <EmptyState
          icon="users"
          title="No contacts yet"
          description="Add your first contact using the form above."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.full_name}
                    {c.title ? (
                      <span className="block text-xs text-muted-foreground">
                        {c.title}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>{c.company?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
