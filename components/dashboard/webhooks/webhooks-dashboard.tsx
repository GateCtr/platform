"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Plus, Zap, CheckCircle2, XCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateWebhookForm } from "./create-webhook-form";
import { WebhookRow } from "./webhook-row";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastFiredAt: string | null;
  successCount: number;
  failCount: number;
  createdAt: string;
}

interface WebhooksDashboardProps {
  maxWebhooks: number | null;
}

export function WebhooksDashboard({ maxWebhooks }: WebhooksDashboardProps) {
  const t = useTranslations("webhooks");
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery<{ webhooks: Webhook[] }>({
    queryKey: ["webhooks"],
    queryFn: () => fetch("/api/v1/webhooks").then((r) => r.json()),
  });

  const webhooks = data?.webhooks ?? [];
  const activeCount = webhooks.filter((w) => w.isActive).length;
  const totalSuccess = webhooks.reduce((s, w) => s + w.successCount, 0);
  const totalFail = webhooks.reduce((s, w) => s + w.failCount, 0);
  const atLimit = maxWebhooks !== null && webhooks.length >= maxWebhooks;

  async function handleToggleActive(id: string, active: boolean) {
    await fetch(`/api/v1/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: active }),
    });
    qc.invalidateQueries({ queryKey: ["webhooks"] });
  }

  async function handleDelete(id: string) {
    await fetch(`/api/v1/webhooks/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["webhooks"] });
  }

  function handleCreated() {
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["webhooks"] });
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────────────────── */}
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

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      {!isLoading && webhooks.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Zap className="size-4 text-primary" />}
            label={t("stats.total")}
            value={`${webhooks.length}${maxWebhooks ? ` / ${maxWebhooks}` : ""}`}
          />
          <StatCard
            icon={<Activity className="size-4 text-green-500" />}
            label={t("stats.active")}
            value={String(activeCount)}
          />
          <StatCard
            icon={<CheckCircle2 className="size-4 text-green-500" />}
            label={t("stats.delivered")}
            value={String(totalSuccess)}
          />
          <StatCard
            icon={<XCircle className="size-4 text-red-500" />}
            label={t("stats.failed")}
            value={String(totalFail)}
          />
        </div>
      )}

      {/* ── Quota warning ───────────────────────────────────────────────── */}
      {atLimit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          {t("quota.limitReached", { max: maxWebhooks })}
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg border bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!isLoading && webhooks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center gap-4">
          <div className="rounded-full bg-muted p-4">
            <Zap className="size-6 text-muted-foreground" />
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

      {/* ── Webhook list ────────────────────────────────────────────────── */}
      {!isLoading && webhooks.length > 0 && (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <WebhookRow
              key={wh.id}
              {...wh}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Create dialog ───────────────────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{t("form.title")}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1 scrollbar-none">
            <CreateWebhookForm onCreated={handleCreated} />
          </div>
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
