import { createClient } from "@/lib/supabase/server";
import type { CrmContact, CrmDeal, DealStage } from "@/types/database";

export type ContactWithCompany = CrmContact & { company: { name: string } | null };

export type CrmOverview = {
  companies: number;
  contacts: number;
  openDeals: number;
  pipelineValue: number;
};

const OPEN_STAGES: DealStage[] = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION"];

/** Top-line CRM KPIs for the org. */
export async function getCrmOverview(organizationId: string): Promise<CrmOverview> {
  const supabase = await createClient();
  const [companies, contacts, deals] = await Promise.all([
    supabase
      .from("crm_companies")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("crm_contacts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("crm_deals")
      .select("value, stage")
      .eq("organization_id", organizationId),
  ]);

  const open = (deals.data ?? []).filter((d) =>
    OPEN_STAGES.includes(d.stage as DealStage),
  );

  return {
    companies: companies.count ?? 0,
    contacts: contacts.count ?? 0,
    openDeals: open.length,
    pipelineValue: open.reduce((sum, d) => sum + Number(d.value), 0),
  };
}

/** Contacts with their company name. */
export async function listContacts(
  organizationId: string,
): Promise<ContactWithCompany[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_contacts")
    .select("*, company:crm_companies(name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as ContactWithCompany[];
}

/** All deals for the org (caller groups by stage). */
export async function listDeals(organizationId: string): Promise<CrmDeal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_deals")
    .select("*")
    .eq("organization_id", organizationId)
    .order("value", { ascending: false });
  return (data ?? []) as CrmDeal[];
}
