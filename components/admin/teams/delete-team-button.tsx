"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Trash2 } from "lucide-react";

interface DeleteTeamButtonProps {
  teamId: string;
  teamName: string;
}

export function DeleteTeamButton({ teamId, teamName }: DeleteTeamButtonProps) {
  const t = useTranslations("adminTeams.actions");
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(t("deleteError"));
        return;
      }
      toast.success(t("deleteSuccess"));
      router.push("/admin/teams");
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          disabled={loading}
        >
          <Trash2 className="size-4" />
          {t("deleteTeam")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{teamName}</span>
            {" — "}
            {t("deleteConfirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={loading}
          >
            {t("deleteConfirmButton")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
