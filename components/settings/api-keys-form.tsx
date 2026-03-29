"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  KeySquare,
  Plus,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Hash,
  AlertTriangle,
} from "lucide-react";
import {
  createApiKey,
  revokeApiKey,
  deleteApiKey,
} from "@/app/[locale]/(dashboard)/settings/api-keys/_actions";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

const SCOPES = ["complete", "chat", "read", "admin"] as const;
type Scope = (typeof SCOPES)[number];

const ENVIRONMENTS = ["live", "test"] as const;
type KeyEnvironment = (typeof ENVIRONMENTS)[number];

const ENV_STYLES: Record<KeyEnvironment, string> = {
  live: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  test: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
};

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  environment: string;
  scopes: string[];
  projectId: string | null;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: Date | string | null;
  expiresAt: Date | string | null;
  createdAt: Date | string;
}

interface Project {
  id: string;
  name: string;
}

const EXPIRY_OPTIONS = [
  { label: "No expiration", value: "0" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
  { label: "1 year", value: "365" },
] as const;

const SCOPE_COLORS: Record<Scope, string> = {
  complete:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  chat: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  read: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  admin:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

function ScopeBadge({ scope }: { scope: string }) {
  const color = SCOPE_COLORS[scope as Scope] ?? SCOPE_COLORS.read;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0 text-[10px] font-mono font-medium border",
        color,
      )}
    >
      {scope}
    </span>
  );
}

// ─── Reveal dialog (shown once after creation) ────────────────────────────────

function RevealDialog({
  rawKey,
  onClose,
}: {
  rawKey: string;
  onClose: () => void;
}) {
  const t = useTranslations("settingsApiKeys");
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(rawKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeySquare className="size-4" />
            {t("reveal.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {t("reveal.warning")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border bg-muted px-3 py-2 text-xs font-mono break-all select-all">
              {rawKey}
            </code>
            <Button
              type="button"
              variant="cta-secondary"
              size="sm"
              className="shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-3.5 mr-1.5" />
              ) : (
                <Copy className="size-3.5 mr-1.5" />
              )}
              {copied ? t("reveal.copied") : t("reveal.copy")}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="cta-primary" onClick={onClose}>
            {t("reveal.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create dialog ────────────────────────────────────────────────────────────

function CreateApiKeyDialog({
  projects,
  onCreated,
}: {
  projects: Project[];
  onCreated: (key: ApiKey, raw: string) => void;
}) {
  const t = useTranslations("settingsApiKeys");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<KeyEnvironment>("live");
  const [projectId, setProjectId] = useState<string>("none");
  const [scopes, setScopes] = useState<Scope[]>(["complete", "read"]);
  const [expiresInDays, setExpiresInDays] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setEnvironment("live");
    setProjectId("none");
    setScopes(["complete", "read"]);
    setExpiresInDays("0");
    setError(null);
  }

  function toggleScope(scope: Scope) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("name", name);
    fd.set("environment", environment);
    if (projectId !== "none") fd.set("projectId", projectId);
    scopes.forEach((s) => fd.append("scopes", s));
    fd.set("expiresInDays", expiresInDays);

    startTransition(async () => {
      const result = await createApiKey(fd);
      if ("error" in result) {
        setError(t(`errors.${result.error}` as Parameters<typeof t>[0]));
        return;
      }
      onCreated(result.data as ApiKey, result.raw);
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("create.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="keyName">{t("create.name")}</Label>
            <Input
              id="keyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("create.namePlaceholder")}
              maxLength={60}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {t("create.nameDescription")}
            </p>
          </div>

          {/* Environment */}
          <div className="space-y-1.5">
            <Label>{t("create.environment")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {ENVIRONMENTS.map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setEnvironment(env)}
                  className={cn(
                    "flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-colors",
                    environment === env
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/50",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-mono font-medium px-1.5 py-0 rounded border",
                      ENV_STYLES[env],
                    )}
                  >
                    gct_{env}_
                  </span>
                  <span className="text-xs text-muted-foreground mt-1.5">
                    {t(`create.env_${env}` as Parameters<typeof t>[0])}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Scopes */}
          <div className="space-y-2">
            <Label>{t("create.scopes")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {SCOPES.map((scope) => (
                <label
                  key={scope}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={scopes.includes(scope)}
                    onCheckedChange={() => toggleScope(scope)}
                  />
                  <span className="text-sm font-mono">{scope}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Expiration + Project on same row */}
          <div
            className={cn(
              "gap-3",
              projects.length > 0 ? "grid grid-cols-2" : "",
            )}
          >
            <div className="space-y-1.5">
              <Label>{t("create.expiration")}</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(
                        `create.expiry_${opt.value}` as Parameters<typeof t>[0],
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {projects.length > 0 && (
              <div className="space-y-1.5">
                <Label>{t("create.project")}</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("create.projectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {t("create.projectPlaceholder")}
                    </SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
              {t("create.cancel")}
            </Button>
            <Button
              type="submit"
              variant="cta-primary"
              disabled={isPending || !name.trim() || scopes.length === 0}
            >
              {isPending ? t("create.submitting") : t("create.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── API Key card ─────────────────────────────────────────────────────────────

function ApiKeyCard({
  apiKey,
  projects,
  onRevoked,
  onDeleted,
}: {
  apiKey: ApiKey;
  projects: Project[];
  onRevoked: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("settingsApiKeys");
  const [isRevoking, startRevoke] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const project = projects.find((p) => p.id === apiKey.projectId);

  const lastUsed = apiKey.lastUsedAt
    ? new Date(apiKey.lastUsedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const expiresAt = apiKey.expiresAt
    ? new Date(apiKey.expiresAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const isExpired = apiKey.expiresAt
    ? new Date(apiKey.expiresAt) < new Date()
    : false;

  const createdOn = new Date(apiKey.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function handleRevoke() {
    startRevoke(async () => {
      await revokeApiKey(apiKey.id);
      onRevoked(apiKey.id);
    });
  }

  function handleDelete() {
    startDelete(async () => {
      await deleteApiKey(apiKey.id);
      onDeleted(apiKey.id);
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        apiKey.isActive
          ? "bg-card border-border"
          : "bg-muted/40 border-border/50 opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
            <KeySquare className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 space-y-1.5">
            {/* Name + status */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{apiKey.name}</span>
              <span
                className={cn(
                  "inline-flex items-center rounded px-1.5 py-0 text-[10px] font-mono font-medium border",
                  ENV_STYLES[(apiKey.environment as KeyEnvironment) ?? "live"],
                )}
              >
                gct_{apiKey.environment ?? "live"}_
              </span>
              <Badge
                variant={apiKey.isActive ? "default" : "secondary"}
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  apiKey.isActive &&
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                )}
              >
                {apiKey.isActive ? t("card.active") : t("card.inactive")}
              </Badge>
            </div>

            {/* Prefix */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Hash className="size-3" />
              <code className="font-mono">{apiKey.prefix}••••••••</code>
            </div>

            {/* Scopes */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {apiKey.scopes.map((s) => (
                <ScopeBadge key={s} scope={s} />
              ))}
              {project && (
                <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0">
                  {project.name}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="size-3" />
                {t("card.created")} {createdOn}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {t("card.lastUsed")}: {lastUsed ?? t("card.never")}
              </span>
              {expiresAt && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    isExpired ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  <Clock className="size-3" />
                  {isExpired ? t("card.expired") : t("card.expires")}:{" "}
                  {expiresAt}
                </span>
              )}
              {apiKey.usageCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {apiKey.usageCount.toLocaleString()} {t("card.usageCount")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Revoke — active keys only */}
          {apiKey.isActive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="cta-ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
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
                    disabled={isRevoking}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isRevoking
                      ? t("card.revoking")
                      : t("card.confirmRevokeAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Delete — always visible */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="cta-ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
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
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting
                    ? t("card.deleting")
                    : t("card.confirmDeleteAction")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ApiKeysForm({
  initialKeys,
  projects,
}: {
  initialKeys: ApiKey[];
  projects: Project[];
}) {
  const t = useTranslations("settingsApiKeys");
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [pendingReveal, setPendingReveal] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleCreated(key: ApiKey, raw: string) {
    setKeys((prev) => [key, ...prev]);
    setPendingReveal(raw);
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
      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <KeySquare className="size-3.5 shrink-0 text-muted-foreground" />
        <span>{t("security.note")}</span>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activeKeys.length > 0
            ? `${activeKeys.length} active key${activeKeys.length > 1 ? "s" : ""}`
            : t("empty.description")}
        </p>
        <CreateApiKeyDialog projects={projects} onCreated={handleCreated} />
      </div>

      {/* Empty state */}
      {keys.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted mb-4">
            <KeySquare className="size-5 text-muted-foreground" />
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
            <ApiKeyCard
              key={k.id}
              apiKey={k}
              projects={projects}
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
            <ApiKeyCard
              key={k.id}
              apiKey={k}
              projects={projects}
              onRevoked={handleRevoked}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* Reveal dialog — shown once after creation */}
      {pendingReveal && (
        <RevealDialog
          rawKey={pendingReveal}
          onClose={() => {
            setPendingReveal(null);
            showToast(t("success.created"));
          }}
        />
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
