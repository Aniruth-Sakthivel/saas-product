"use client";

import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  inviteStaffAction,
  removeMembershipAction,
  updateMembershipRoleAction,
} from "@/features/organizations/actions";
import { ROLES, ROLE_LABELS } from "@/lib/rbac";
import { initialsFromName } from "@/lib/utils";
import type { StaffMember } from "@/features/organizations/services";
import type { UserRole } from "@/types/database";

interface StaffManagerProps {
  staff: StaffMember[];
  canManage: boolean;
  currentMembershipId: string;
}

export function StaffManager({
  staff,
  canManage,
  currentMembershipId,
}: StaffManagerProps) {
  const [state, formAction] = useActionState(inviteStaffAction, null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.ok) {
      toast.success(
        state.data.delivered
          ? "Invitation sent."
          : "Invite created (email not configured — link logged to server).",
      );
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="space-y-6">
      {canManage && (
        <form
          action={formAction}
          className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium" htmlFor="invite-email">
              Invite teammate
            </label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="name@hotel.com"
              required
            />
          </div>
          <div className="w-full space-y-1.5 sm:w-44">
            <label className="text-sm font-medium" htmlFor="invite-role">
              Role
            </label>
            <Select name="role" defaultValue="RECEPTIONIST">
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SubmitButton>Send invite</SubmitButton>
        </form>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((m) => {
            const name = m.profile?.full_name ?? m.invited_email ?? "Invited user";
            const email = m.profile?.email ?? m.invited_email ?? "—";
            const isSelf = m.id === currentMembershipId;
            return (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback>{initialsFromName(name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {canManage && !isSelf ? (
                    <Select
                      defaultValue={m.role}
                      disabled={pending}
                      onValueChange={(role) =>
                        startTransition(async () => {
                          const res = await updateMembershipRoleAction(
                            m.id,
                            role as UserRole,
                          );
                          if (res.ok) toast.success("Role updated.");
                          else toast.error(res.error);
                        })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm">{ROLE_LABELS[m.role]}</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={m.status} />
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    {!isSelf && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            const res = await removeMembershipAction(m.id);
                            if (res.ok) toast.success("Member removed.");
                            else toast.error(res.error);
                          })
                        }
                        aria-label="Remove member"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
