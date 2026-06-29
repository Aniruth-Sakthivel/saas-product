import { z } from "zod";

const STAGES = [
  "LEAD",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export const createContactSchema = z.object({
  fullName: z.string().min(2, "Name is required."),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  title: z.string().optional().default(""),
  companyName: z.string().optional().default(""),
});

export const createDealSchema = z.object({
  title: z.string().min(2, "Title is required."),
  value: z.coerce.number().min(0, "Value must be positive.").default(0),
  stage: z.enum(STAGES).default("LEAD"),
});

export const DEAL_STAGES = STAGES;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
