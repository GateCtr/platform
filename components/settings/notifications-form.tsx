"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Bell,
  Trash2,
  CheckCircle2,
  Mail,
  Webhook,
  MessageSquare,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  saveAlertRule,
  deleteAlertRule,
} from "@/app/[locale]/(dashboard)/settings/notifications/_actions";

interface AlertRule {
  id: string;
  name: string;
  alertType: string;
  condition: Record<string, unknown>;
  channels: string[];
  createdAt: string;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="size-3" />,
  webhook: <Webhook className="size-3" />,
  slack: <MessageSquare className="size-3" />,
};

const ALERT_TYPE_COLORS: Record<string, string> = {
  budget_threshold:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  token_limit:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  error_rate: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  latency:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function NotificationsForm({
  initialRules,
  isPro,
}: {
  initialRules: AlertRule[];
  isPro: boolean;
}) {
  const t = useTranslations("settingsNotifications");
  const [rules, setRules] = useState(initialRules);
  const [name, setName] = useState("");
  const [alertType, setAlertType] = useState("budget_threshold");
  const [threshold, setThreshold] = useState("80");
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelWebhook, setChannelWebhook] = useState(false);
  const [channelSlack, setChannelSlack] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // ── Validation ────────────────────────────────────────────────────────────
  const noChannel = !channelEmail && !channelWebhook && !channelSlack;
  const thresholdNum = parseInt(threshold, 10);
  const thresholdInvalid =
    !threshold.trim() ||
    isNaN(thresholdNum) ||
    thresholdNum < 1 ||
    thresholdNum > 100;
  const canSubmit = name.trim().length > 0 && !noChannel && !thresholdInvalid;

  // ── Placeholder adapté au type d'alerte ──────────────────────────────────
  const namePlaceholder = t(
    `fields.name.placeholders.${alertType}` as Parameters<typeof t>[0],
  );

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setAdding(true);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("alertType", alertType);
    fd.set("threshold", threshold);
    if (channelEmail) fd.set("channel_email", "on");
    if (channelWebhook) fd.set("channel_webhook", "on");
    if (channelSlack) fd.set("channel_slack", "on");
    if (webhookUrl) fd.set("webhookUrl", webhookUrl);

    const res = await saveAlertRule(fd);
    setAdding(false);

    if (res.error) {
      showToast("error", t(`errors.${res.error}` as Parameters<typeof t>[0]));
    } else if (res.rule) {
      setRules((prev) => [res.rule!, ...prev]);
      setName("");
      setThreshold("80");
      setWebhookUrl("");
      setChannelEmail(true);
      setChannelWebhook(false);
      setChannelSlack(false);
      showToast("success", t("success.added"));
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await deleteAlertRule(id);
    setDeletingId(null);
    if (res.error) {
      showToast("error", t("errors.internal_error"));
    } else {
      setRules((prev) => prev.filter((r) => r.id !== id));
      showToast("success", t("success.deleted"));
    }
  }

  if (!isPro) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted mx-auto">
          <Bell className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{t("planGate.title")}</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          {t("planGate.description")}
        </p>
        <Button variant="cta-accent" size="sm" className="mt-2">
          {t("planGate.cta")}
        </Button>
      </div>
    );
  }

  const showWebhookUrl = channelWebhook || channelSlack;

  return (
    <div className="space-y-6">
      {/* Existing rules */}
      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted mb-4">
            <Bell className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{t("empty.title")}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {t("empty.description")}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("sections.rules")}
            </p>
          </div>
          <div className="divide-y divide-border">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ALERT_TYPE_COLORS[rule.alertType] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {t(
                        `alertTypes.${rule.alertType}` as Parameters<
                          typeof t
                        >[0],
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {rule.channels.map((ch) => (
                      <span
                        key={ch}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {CHANNEL_ICONS[ch]}
                        {t(`fields.channels.${ch}` as Parameters<typeof t>[0])}
                      </span>
                    ))}
                    {typeof rule.condition.threshold === "number" && (
                      <span className="text-xs text-muted-foreground">
                        @ {rule.condition.threshold}%
                      </span>
                    )}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("deleteDialog.title")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("deleteDialog.description", { name: rule.name })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("deleteDialog.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(rule.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deletingId === rule.id
                          ? t("actions.deleting")
                          : t("deleteDialog.confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add rule form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("sections.add")}
        </p>
        <form onSubmit={handleAdd} className="space-y-4">
          {/* Name + type row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name">{t("fields.name.label")}</Label>
              <Input
                id="rule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={namePlaceholder}
              />
              {name.trim().length === 0 && name !== "" && (
                <p className="text-xs text-destructive">
                  {t("errors.name_required")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("fields.alertType.label")}</Label>
              <Select value={alertType} onValueChange={setAlertType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget_threshold">
                    {t("fields.alertType.budget_threshold")}
                  </SelectItem>
                  <SelectItem value="token_limit">
                    {t("fields.alertType.token_limit")}
                  </SelectItem>
                  <SelectItem value="error_rate">
                    {t("fields.alertType.error_rate")}
                  </SelectItem>
                  <SelectItem value="latency">
                    {t("fields.alertType.latency")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Threshold */}
          <div className="space-y-1.5 w-40">
            <Label htmlFor="rule-threshold">
              {t("fields.threshold.label")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="rule-threshold"
                type="number"
                min={1}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            {thresholdInvalid && threshold !== "" && (
              <p className="text-xs text-destructive">
                {t("errors.threshold_range")}
              </p>
            )}
          </div>

          {/* Channels */}
          <div className="space-y-2">
            <Label>{t("fields.channels.label")}</Label>
            <div className="flex items-center gap-3 flex-wrap">
              {(
                [
                  {
                    key: "email",
                    icon: <Mail className="size-3.5" />,
                    state: channelEmail,
                    set: setChannelEmail,
                  },
                  {
                    key: "webhook",
                    icon: <Webhook className="size-3.5" />,
                    state: channelWebhook,
                    set: setChannelWebhook,
                  },
                  {
                    key: "slack",
                    icon: <MessageSquare className="size-3.5" />,
                    state: channelSlack,
                    set: setChannelSlack,
                  },
                ] as const
              ).map(({ key, icon, state, set }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set(!state)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    state
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {icon}
                  {t(`fields.channels.${key}` as Parameters<typeof t>[0])}
                </button>
              ))}
            </div>
            {noChannel && (
              <p className="text-xs text-destructive">
                {t("errors.channel_required")}
              </p>
            )}
          </div>

          {/* Webhook URL (conditional) */}
          {showWebhookUrl && (
            <div className="space-y-1.5">
              <Label htmlFor="rule-webhook-url">
                {t("fields.webhookUrl.label")}
              </Label>
              <Input
                id="rule-webhook-url"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder={t("fields.webhookUrl.placeholder")}
              />
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={adding || !canSubmit}
              variant="cta-primary"
            >
              <Plus className="size-3.5 mr-1.5" />
              {adding ? t("actions.adding") : t("actions.add")}
            </Button>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 shadow-lg text-sm">
          <CheckCircle2
            className={`size-4 shrink-0 ${toast.type === "success" ? "text-emerald-500" : "text-destructive"}`}
          />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
