"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  setOrgStatusAction,
  deleteOrganizationAction,
} from "@/features/admin/actions";

export function OrgRowActions({
  organizationId,
  name,
}: {
  organizationId: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, done: string) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error ?? "Something went wrong.");
      else {
        toast.success(done);
        router.refresh();
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => router.push(`/admin/organizations/${organizationId}`)}>
            Manage
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            onClick={() =>
              run(
                () => setOrgStatusAction({ organizationId, status: "ACTIVE" }),
                "Organization activated.",
              )
            }
          >
            Activate
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            onClick={() =>
              run(
                () => setOrgStatusAction({ organizationId, status: "PAST_DUE" }),
                "Organization suspended.",
              )
            }
          >
            Suspend
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            Delete…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the organization and all of its data
              (staff, rooms, reservations, billing). This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const res = await deleteOrganizationAction(organizationId);
                  if (res.ok) setConfirmOpen(false);
                  return res;
                }, "Organization deleted.")
              }
            >
              {pending ? "Deleting…" : "Delete organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
