"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Ban } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string | null;
  createdAt: string;
}

interface TeamInvitationsTableProps {
  teamId: string;
  invitations: Invitation[];
  canWrite: boolean;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TeamInvitationsTable({
  teamId,
  invitations: initialInvitations,
  canWrite,
}: TeamInvitationsTableProps) {
  const t = useTranslations("adminTeams.invitations");
  const [invitations, setInvitations] = React.useState(initialInvitations);
  const [revoking, setRevoking] = React.useState<string | null>(null);

  async function handleRevoke(invitationId: string) {
    setRevoking(invitationId);
    try {
      const res = await fetch(
        `/api/admin/teams/${teamId}/invitations/${invitationId}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(t("revokeError"));
        return;
      }
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      toast.success(t("revokeSuccess"));
    } catch {
      toast.error(t("revokeError"));
    } finally {
      setRevoking(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {invitations.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    {t("columns.email")}
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    {t("columns.role")}
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    {t("columns.expires")}
                  </th>
                  {canWrite && (
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                      {/* actions */}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 text-sm">{inv.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {inv.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(inv.expiresAt)}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              disabled={revoking === inv.id}
                            >
                              <Ban className="size-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("revoke")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("revokeConfirm")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleRevoke(inv.id)}
                              >
                                {t("revoke")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
