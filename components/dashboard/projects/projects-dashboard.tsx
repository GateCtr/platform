"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Plus, Boxes, Activity, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateProjectForm } from "./create-project-form";
import { ProjectRow, type Project } from "./project-row";

interface ProjectsDashboardProps {
  maxProjects: number | null;
  isTeamPlan: boolean;
}

export function ProjectsDashboard({
  maxProjects,
  isTeamPlan,
}: ProjectsDashboardProps) {
  const t = useTranslations("projects");
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery<{ projects: Project[] }>({
    queryKey: ["projects"],
    queryFn: () => fetch("/api/v1/projects").then((r) => r.json()),
  });

  const projects = data?.projects ?? [];
  const activeCount = projects.filter((p) => p.isActive).length;
  const inactiveCount = projects.length - activeCount;
  const atLimit = maxProjects !== null && projects.length >= maxProjects;

  async function handleToggleActive(id: string, active: boolean) {
    await fetch(`/api/v1/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: active }),
    });
    qc.invalidateQueries({ queryKey: ["projects"] });
  }

  async function handleDelete(id: string) {
    await fetch(`/api/v1/projects/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["projects"] });
  }

  function handleCreated() {
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["projects"] });
  }

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("page.title")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            {t("page.subtitle")}
          </p>
        </div>
        <Button
          variant="cta-primary"
          size="sm"
          onClick={() => setShowForm(true)}
          disabled={atLimit}
        >
          <Plus className="size-4 mr-1.5" />
          {t("page.create")}
        </Button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      {!isLoading && projects.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Boxes className="size-4 text-primary" />}
            label={t("stats.total")}
            value={`${projects.length}${maxProjects ? ` / ${maxProjects}` : ""}`}
          />
          <StatCard
            icon={<Activity className="size-4 text-green-500" />}
            label={t("stats.active")}
            value={String(activeCount)}
          />
          <StatCard
            icon={<PowerOff className="size-4 text-muted-foreground" />}
            label={t("stats.inactive")}
            value={String(inactiveCount)}
          />
        </div>
      )}

      {/* ── Quota warning ──────────────────────────────────────────────── */}
      {atLimit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          {t("quota.limitReached", { max: maxProjects })}
        </div>
      )}

      {/* ── Team scope badge ───────────────────────────────────────────── */}
      {isTeamPlan && !isLoading && (
        <p className="text-xs text-muted-foreground">{t("page.teamScope")}</p>
      )}

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg border bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {!isLoading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center gap-4">
          <div className="rounded-full bg-muted p-4">
            <Boxes className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("page.emptyTitle")}</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {t("page.empty")}
            </p>
          </div>
          <Button
            variant="cta-primary"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <Plus className="size-4 mr-1.5" />
            {t("page.create")}
          </Button>
        </div>
      )}

      {/* ── Project list ───────────────────────────────────────────────── */}
      {!isLoading && projects.length > 0 && (
        <div className="space-y-3">
          {projects.map((p) => (
            <ProjectRow
              key={p.id}
              {...p}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              onEdited={() => qc.invalidateQueries({ queryKey: ["projects"] })}
            />
          ))}
        </div>
      )}

      {/* ── Create dialog ──────────────────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("form.createTitle")}</DialogTitle>
          </DialogHeader>
          <CreateProjectForm onCreated={handleCreated} />
        </DialogContent>
      </Dialog>
    </div>
  );
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
