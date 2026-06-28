import { z } from "zod";
import { fail, type ActionResult } from "@/lib/errors";

/**
 * Parses input against a schema, returning a typed value or a structured
 * ActionResult error suitable to return straight from a Server Action.
 */
export function parseInput<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown,
):
  | { success: true; data: z.infer<T> }
  | { success: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      result: fail(
        "Please fix the highlighted fields.",
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      ),
    };
  }
  return { success: true, data: parsed.data };
}

/** Converts FormData to a plain object for Zod parsing. */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }
  return obj;
}
