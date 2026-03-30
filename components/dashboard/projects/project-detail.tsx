"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Power,
  KeySquare,
  Calendar,
  Hash,
  Activity,
  Coins,
  DollarSign,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  isActive: boolean;
  scopes: string[];
  lastUsedAt: string | null;
}

interface Budget {
  maxTokensPerDay: number | null;
  maxTokensPerMonth: number | null;
  maxCostPerDay: number | null;
  maxCostPerMonth: number | null;
}

interface Stats {
  requests: number;
  tokens: number;
  cost: number;
}

interface ProjectDetailProps {
  project: Project;
  apiKeys: ApiKey[];
  budget: Budget | null;
  stats: Stats;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : String(n);
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProjectDetail({
  project: initial,
  apiKeys,
  budget,
  stats,
}: ProjectDetailProps) {
  const t = useTranslations("projects");
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dot = project.color ?? "#1B4F82";
  const created = new Date(project.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const updated = new Date(project.updatedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  function handleToggle() {
    startTransition(async () => {
      await fetch(`/api/v1/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !project.isActive }),
      });
      setProject((p) => ({ ...p, isActive: !p.isActive }));
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await fetch(`/api/v1/projects/${project.id}`, { method: "DELETE" });
      router.push("/projects");
    });
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Back */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        {t("detail.back")}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="size-4 rounded-full shrink-0"
            style={{ backgroundColor: dot }}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              {!project.isActive && (
                <Badge variant="secondary" className="text-[10px]">
                  {t("detail.inactive")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Hash className="size-3" />
                <code className="font-mono">{project.slug}</code>
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                {t("detail.created")} {created}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {t("detail.updated")} {updated}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
          <Button
            variant="cta-secondary"
            size="sm"
            onClick={() => setShowEdit(true)}
            className="flex-1 sm:flex-none"
          >
            <Pencil className="size-3.5 mr-1.5" />
            {t("detail.actions.edit")}
          </Button>
          <Button
            variant="cta-ghost"
            size="sm"
            onClick={handleToggle}
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            <Power className="size-3.5 mr-1.5" />
            {project.isActive
              ? t("detail.actions.deactivate")
              : t("detail.actions.activate")}
          </Button>
          <Button
            variant="cta-danger"
            size="sm"
            onClick={() => setShowDelete(true)}
            className="flex-1 sm:flex-none"
          >
            <Trash2 className="size-3.5 mr-1.5" />
            {t("detail.actions.delete")}
          </Button>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-muted-foreground">{project.description}</p>
      )}

      {/* Stats */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          {t("detail.stats.title")}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Activity className="size-4 text-primary" />}
            label={t("detail.stats.requests")}
            value={fmt(stats.requests)}
          />
          <StatCard
            icon={<Coins className="size-4 text-violet-500" />}
            label={t("detail.stats.tokens")}
            value={fmt(stats.tokens)}
          />
          <StatCard
            icon={<DollarSign className="size-4 text-emerald-500" />}
            label={t("detail.stats.cost")}
            value={`$${stats.cost.toFixed(4)}`}
          />
        </div>
      </div>

      {/* API Keys */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("detail.apiKeys.title")}
          </p>
          <Link
            href="/settings/api-keys"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("detail.apiKeys.manage")} →
          </Link>
        </div>
        {apiKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("detail.apiKeys.empty")}
          </p>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((k) => (
              <div
                key={k.id}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-lg border px-4 py-3",
                  !k.isActive && "opacity-60 bg-muted/40",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <KeySquare className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {k.name}
                      </span>
                      <Badge
                        variant={k.isActive ? "default" : "secondary"}
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          k.isActive &&
                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                        )}
                      >
                        {k.isActive
                          ? t("detail.apiKeys.active")
                          : t("detail.apiKeys.inactive")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <code className="text-[11px] font-mono text-muted-foreground">
                        {k.prefix}••••••••
                      </code>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CheckCircle2 className="size-3" />
                        {t("detail.apiKeys.lastUsed")}:{" "}
                        {k.lastUsedAt
                          ? new Date(k.lastUsedAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : t("detail.apiKeys.never")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap justify-end shrink-0">
                  {k.scopes.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] font-mono border rounded px-1.5 py-0 text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("detail.budget.title")}
          </p>
          <Link
            href="/settings/budget"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("detail.budget.configure")} →
          </Link>
        </div>
        {!budget ? (
          <p className="text-sm text-muted-foreground">
            {t("detail.budget.noBudget")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: t("detail.budget.tokensDay"),
                value: budget.maxTokensPerDay,
              },
              {
                label: t("detail.budget.tokensMonth"),
                value: budget.maxTokensPerMonth,
              },
              {
                label: t("detail.budget.costDay"),
                value: budget.maxCostPerDay,
                isCost: true,
              },
              {
                label: t("detail.budget.costMonth"),
                value: budget.maxCostPerMonth,
                isCost: true,
              },
            ].map(({ label, value, isCost }) => (
              <div
                key={label}
                className="rounded-lg border bg-card px-4 py-3 space-y-1"
              >
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold tabular-nums">
                  {value == null
                    ? t("detail.budget.unlimited")
                    : isCost
                      ? `$${value.toFixed(2)}`
                      : fmt(value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("form.editTitle")}</DialogTitle>
          </DialogHeader>
          <EditProjectForm
            project={{
              id: project.id,
              name: project.name,
              slug: project.slug,
              description: project.description,
              color: project.color,
              isActive: project.isActive,
            }}
            onSaved={(updated) => {
              if (updated) setProject((p) => ({ ...p, ...updated }));
              setShowEdit(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("detail.actions.confirmDelete")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("detail.actions.confirmDeleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("detail.actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("detail.actions.confirmDeleteBtn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
