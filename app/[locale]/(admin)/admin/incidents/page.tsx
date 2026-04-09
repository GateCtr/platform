"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type IncidentStatus =
  | "INVESTIGATING"
  | "IDENTIFIED"
  | "MONITORING"
  | "RESOLVED";
type IncidentImpact = "MINOR" | "MAJOR" | "CRITICAL";

interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  impact: IncidentImpact;
  services: string[];
  startedAt: string;
  resolvedAt: string | null;
}

const SERVICES = ["app", "database", "redis", "queue", "stripe"] as const;

// ─── Status / Impact config ───────────────────────────────────────────────────

const STATUS_COLORS: Record<IncidentStatus, string> = {
  INVESTIGATING:
    "bg-warning-500/10 text-warning-600 dark:text-warning-400 border-warning-500/20",
  IDENTIFIED:
    "bg-warning-500/10 text-warning-600 dark:text-warning-400 border-warning-500/20",
  MONITORING: "bg-primary/10 text-primary border-primary/20",
  RESOLVED:
    "bg-success-500/10 text-success-600 dark:text-success-400 border-success-500/20",
};

const IMPACT_COLORS: Record<IncidentImpact, string> = {
  MINOR: "bg-muted text-muted-foreground border-border",
  MAJOR:
    "bg-warning-500/10 text-warning-600 dark:text-warning-400 border-warning-500/20",
  CRITICAL: "bg-destructive/10 text-destructive border-destructive/20",
};

// ─── Incident Form Dialog ─────────────────────────────────────────────────────

function IncidentDialog({
  open,
  incident,
  onClose,
  onSave,
}: {
  open: boolean;
  incident?: Incident;
  onClose: () => void;
  onSave: () => void;
}) {
  const t = useTranslations("adminIncidents");
  const isEdit = !!incident;

  const [title, setTitle] = useState(incident?.title ?? "");
  const [description, setDescription] = useState(incident?.description ?? "");
  const [status, setStatus] = useState<IncidentStatus>(
    incident?.status ?? "INVESTIGATING",
  );
  const [impact, setImpact] = useState<IncidentImpact>(
    incident?.impact ?? "MINOR",
  );
  const [services, setServices] = useState<string[]>(incident?.services ?? []);
  const [saving, setSaving] = useState(false);

  // Reset form when incident changes
  useEffect(() => {
    setTitle(incident?.title ?? "");
    setDescription(incident?.description ?? "");
    setStatus(incident?.status ?? "INVESTIGATING");
    setImpact(incident?.impact ?? "MINOR");
    setServices(incident?.services ?? []);
  }, [incident]);

  function toggleService(svc: string) {
    setServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/incidents/${incident.id}`
        : "/api/admin/incidents";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, status, impact, services }),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? t("form.save") : t("form.create"));
      onSave();
    } catch {
      toast.error(t("form.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {isEdit ? t("form.editDescription") : t("form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <form
          id="incident-form"
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-4 py-2"
        >
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="inc-title">{t("form.titleLabel")}</Label>
            <Input
              id="inc-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("form.titlePlaceholder")}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="inc-desc">{t("form.descriptionLabel")}</Label>
            <Textarea
              id="inc-desc"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("form.descriptionPlaceholder")}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Status + Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("form.statusLabel")}</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as IncidentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "INVESTIGATING",
                      "IDENTIFIED",
                      "MONITORING",
                      "RESOLVED",
                    ] as IncidentStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`status.${s}` as Parameters<typeof t>[0])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("form.impactLabel")}</Label>
              <Select
                value={impact}
                onValueChange={(v) => setImpact(v as IncidentImpact)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["MINOR", "MAJOR", "CRITICAL"] as IncidentImpact[]).map(
                    (i) => (
                      <SelectItem key={i} value={i}>
                        {t(`impact.${i}` as Parameters<typeof t>[0])}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Affected services */}
          <div className="space-y-2">
            <Label>{t("form.servicesLabel")}</Label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((svc) => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => toggleService(svc)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    services.includes(svc)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50",
                  )}
                >
                  {t(`services.${svc}` as Parameters<typeof t>[0])}
                </button>
              ))}
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("form.cancel")}
          </Button>
          <Button type="submit" form="incident-form" disabled={saving}>
            {saving
              ? t("form.saving")
              : isEdit
                ? t("form.save")
                : t("form.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminIncidentsPage() {
  const t = useTranslations("adminIncidents");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Incident | undefined>();

  async function load() {
    setLoading(true);
    try {
      const [incRes, subRes] = await Promise.all([
        fetch("/api/admin/incidents"),
        fetch("/api/admin/incidents/subscribers"),
      ]);
      if (incRes.ok) {
        const data = (await incRes.json()) as { incidents: Incident[] };
        setIncidents(data.incidents);
      }
      if (subRes.ok) {
        const data = (await subRes.json()) as { count: number };
        setSubscriberCount(data.count);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm(t("delete.confirm"))) return;
    try {
      const res = await fetch(`/api/admin/incidents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Incident deleted.");
      void load();
    } catch {
      toast.error(t("delete.error"));
    }
  }

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }
  function openEdit(inc: Incident) {
    setEditTarget(inc);
    setDialogOpen(true);
  }

  const statusIcon = (status: IncidentStatus) => {
    if (status === "RESOLVED")
      return <CheckCircle2 className="size-3.5 text-success-500" />;
    if (status === "MONITORING")
      return <Clock className="size-3.5 text-primary" />;
    return <AlertTriangle className="size-3.5 text-warning-500" />;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            {t("subtitle")}
            {subscriberCount !== null && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
                <Users className="size-3" />
                {subscriberCount === 1
                  ? t("subscribers", { count: subscriberCount })
                  : t("subscribers_plural", { count: subscriberCount })}
              </span>
            )}
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="size-4" />
          {t("newIncident")}
        </Button>
      </div>

      {/* Table card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <CheckCircle2 className="size-10 text-success-500/40 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {t("noIncidents.title")}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {t("noIncidents.description")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.incident")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.impact")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("table.services")}
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t("table.date")}
                  </TableHead>
                  <TableHead className="w-20">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0">
                          {statusIcon(inc.status)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate max-w-[240px]">
                            {inc.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {inc.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", STATUS_COLORS[inc.status])}
                      >
                        {t(`status.${inc.status}` as Parameters<typeof t>[0])}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", IMPACT_COLORS[inc.impact])}
                      >
                        {t(`impact.${inc.impact}` as Parameters<typeof t>[0])}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {inc.services.length > 0
                          ? inc.services
                              .map((s) =>
                                t(`services.${s}` as Parameters<typeof t>[0]),
                              )
                              .join(", ")
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {new Date(inc.startedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(inc)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void handleDelete(inc.id)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <IncidentDialog
        open={dialogOpen}
        incident={editTarget}
        onClose={() => setDialogOpen(false)}
        onSave={() => {
          setDialogOpen(false);
          void load();
        }}
      />
    </div>
  );
}
