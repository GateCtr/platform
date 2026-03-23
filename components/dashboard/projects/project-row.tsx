"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  ExternalLink,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditProjectForm } from "./edit-project-form";
import { cn } from "@/lib/utils";

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ProjectRowProps extends Project {
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdited: () => void;
}

export function ProjectRow({
  id,
  name,
  slug,
  description,
  color,
  isActive,
  createdAt,
  onToggleActive,
  onDelete,
  onEdited,
}: ProjectRowProps) {
  const t = useTranslations("projects");
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleToggle() {
    setToggling(true);
    await onToggleActive(id, !isActive);
    setToggling(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await onDelete(id);
    setDeleting(false);
    setShowDelete(false);
  }

  const dot = color ?? "#1B4F82";
  const created = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-opacity",
          !isActive && "opacity-60",
        )}
      >
        {/* Color dot */}
        <div
          className="size-3 rounded-full shrink-0"
          style={{ backgroundColor: dot }}
        />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/projects/${id}`}
              className="text-sm font-medium truncate hover:underline underline-offset-2"
            >
              {name}
            </Link>
            {!isActive && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                {t("row.inactive")}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-[11px] text-muted-foreground">
              {slug}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {t("row.created")} {created}
            </span>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => setShowEdit(true)}
              className="gap-2"
            >
              <Pencil className="size-3.5" />
              {t("row.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2">
              <Link href={`/projects/${id}`}>
                <ExternalLink className="size-3.5" />
                {t("row.view")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleToggle}
              disabled={toggling}
              className="gap-2"
            >
              <Power className="size-3.5" />
              {isActive ? t("row.deactivate") : t("row.activate")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowDelete(true)}
              className="gap-2"
            >
              <Trash2 className="size-3.5" />
              {t("row.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("form.editTitle")}</DialogTitle>
          </DialogHeader>
          <EditProjectForm
            project={{ id, name, slug, description, color, isActive }}
            onSaved={() => {
              setShowEdit(false);
              onEdited();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("row.confirmDelete", { name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("row.confirmDeleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("row.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("row.confirmDeleteBtn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
