"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Shield, Plus, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import {
  addProviderKey,
  revokeProviderKey,
} from "@/app/[locale]/(dashboard)/settings/providers/_actions";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

const PROVIDERS = ["openai", "anthropic", "mistral", "gemini"] as const;
type Provider = (typeof PROVIDERS)[number];

const DOCS_URLS: Record<Provider, string> = {
  openai: "https://platform.openai.com/api-keys",
  anthropic: "https://console.anthropic.com/settings/keys",
  mistral: "https://console.mistral.ai/api-keys",
  gemini: "https://aistudio.google.com/app/apikey",
};

interface ProviderKey {
  id: string;
  provider: string;
  name: string;
  isActive: boolean;
  lastUsedAt: Date | string | null;
  createdAt: Date | string;
}

// ─── Provider icons ───────────────────────────────────────────────────────────

function ProviderIcon({
  provider,
  className,
}: {
  provider: string;
  className?: string;
}) {
  const base = cn("size-5 shrink-0", className);
  if (provider === "openai") {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    );
  }
  if (provider === "anthropic") {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.57 3.52zm4.132 9.959L8.453 7.687 6.205 13.48h4.496z" />
      </svg>
    );
  }
  if (provider === "mistral") {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M0 0h4v4H0zm6 0h4v4H6zm6 0h4v4h-4zm6 0h6v4h-6zM0 6h4v4H0zm12 0h4v4h-4zm6 0h6v4h-6zM0 12h4v4H0zm6 0h4v4H6zm6 0h4v4h-4zm6 0h6v4h-6zM0 18h4v6H0zm6 0h4v6H6zm12 0h6v6h-6z" />
      </svg>
    );
  }
  return (
    <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 24A14.304 14.304 0 0 0 0 12 14.304 14.304 0 0 0 12 0a14.305 14.305 0 0 0 12 12 14.305 14.305 0 0 0-12 12" />
    </svg>
  );
}

// ─── Add dialog ───────────────────────────────────────────────────────────────

function AddProviderDialog({
  onAdded,
}: {
  onAdded: (key: ProviderKey) => void;
}) {
  const t = useTranslations("settingsProviders");
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<Provider | "">("");
  const [keyName, setKeyName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setProvider("");
    setKeyName("");
    setApiKey("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("provider", provider);
    fd.set("keyName", keyName);
    fd.set("apiKey", apiKey);

    startTransition(async () => {
      const result = await addProviderKey(fd);
      if ("error" in result) {
        setError(t(`errors.${result.error}` as Parameters<typeof t>[0]));
        return;
      }
      onAdded(result.data as ProviderKey);
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="cta-primary">
          <Plus className="size-4 mr-2" />
          {t("empty.cta")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("add.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>{t("add.provider")}</Label>
            <Select
              value={provider}
              onValueChange={(v) => setProvider(v as Provider)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("add.provider")} />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="flex items-center gap-2">
                      <ProviderIcon provider={p} />
                      {t(`providers.${p}` as Parameters<typeof t>[0])}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keyName">{t("add.keyName")}</Label>
            <Input
              id="keyName"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder={t("add.keyNamePlaceholder")}
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">
              {t("add.keyNameDescription")}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="apiKey">{t("add.apiKey")}</Label>
              {provider && (
                <a
                  href={DOCS_URLS[provider as Provider]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("add.whereToFind")}
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t("add.apiKeyPlaceholder")}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              {t("add.apiKeyDescription")}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="cta-ghost"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              {t("add.cancel")}
            </Button>
            <Button
              type="submit"
              variant="cta-primary"
              disabled={isPending || !provider || !apiKey.trim()}
            >
              {isPending ? t("add.submitting") : t("add.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Provider card ────────────────────────────────────────────────────────────

function ProviderCard({
  providerKey,
  onRevoked,
  onDeleted,
}: {
  providerKey: ProviderKey;
  onRevoked: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("settingsProviders");
  const [isPending, startTransition] = useTransition();

  const lastUsed = providerKey.lastUsedAt
    ? new Date(providerKey.lastUsedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const addedOn = new Date(providerKey.createdAt).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" },
  );

  function handleRevoke() {
    startTransition(async () => {
      await revokeProviderKey(providerKey.id);
      onRevoked(providerKey.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await fetch(`/api/v1/provider-keys/${providerKey.id}?hard=true`, {
        method: "DELETE",
      });
      onDeleted(providerKey.id);
    });
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors",
        providerKey.isActive
          ? "bg-card border-border"
          : "bg-muted/40 border-border/50 opacity-60",
      )}
    >
      {/* Left — icon + info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <ProviderIcon provider={providerKey.provider} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">
              {t(
                `providers.${providerKey.provider}` as Parameters<typeof t>[0],
              )}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {providerKey.name}
            </span>
            <Badge
              variant={providerKey.isActive ? "default" : "secondary"}
              className={cn(
                "text-[10px] px-1.5 py-0",
                providerKey.isActive &&
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
              )}
            >
              {providerKey.isActive ? t("card.active") : t("card.inactive")}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3" />
              {t("card.added")} {addedOn}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {t("card.lastUsed")}: {lastUsed ?? t("card.never")}
            </span>
          </div>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 shrink-0">
        {providerKey.isActive && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="cta-ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                {t("card.revoke")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("card.confirmRevoke")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("card.confirmRevokeDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("card.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRevoke}
                  disabled={isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending
                    ? t("card.revoking")
                    : t("card.confirmRevokeAction")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {!providerKey.isActive && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="cta-danger" size="sm" disabled={isPending}>
                {t("card.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("card.confirmDelete")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("card.confirmDeleteDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("card.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending
                    ? t("card.deleting")
                    : t("card.confirmDeleteAction")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ProvidersForm({ initialKeys }: { initialKeys: ProviderKey[] }) {
  const t = useTranslations("settingsProviders");
  const [keys, setKeys] = useState<ProviderKey[]>(initialKeys);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleAdded(key: ProviderKey) {
    setKeys((prev) => [key, ...prev]);
    showToast(t("success.connected"));
  }

  function handleRevoked(id: string) {
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, isActive: false } : k)),
    );
    showToast(t("success.revoked"));
  }

  function handleDeleted(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    showToast(t("success.deleted"));
  }

  const activeKeys = keys.filter((k) => k.isActive);
  const inactiveKeys = keys.filter((k) => !k.isActive);

  return (
    <div className="space-y-6">
      {/* Security badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="size-3.5 shrink-0 text-emerald-500" />
        <span>
          <span className="font-medium text-foreground">
            {t("security.badge")}
          </span>{" "}
          — {t("security.note")}
        </span>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activeKeys.length > 0
            ? `${activeKeys.length} provider${activeKeys.length > 1 ? "s" : ""} connected`
            : t("empty.description")}
        </p>
        <AddProviderDialog onAdded={handleAdded} />
      </div>

      {/* Empty state */}
      {keys.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted mb-4">
            <Shield className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{t("empty.title")}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {t("empty.description")}
          </p>
        </div>
      )}

      {/* Active keys */}
      {activeKeys.length > 0 && (
        <div className="space-y-2">
          {activeKeys.map((k) => (
            <ProviderCard
              key={k.id}
              providerKey={k}
              onRevoked={handleRevoked}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* Inactive keys */}
      {inactiveKeys.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("card.inactive")}
          </p>
          {inactiveKeys.map((k) => (
            <ProviderCard
              key={k.id}
              providerKey={k}
              onRevoked={handleRevoked}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 shadow-lg text-sm">
          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
