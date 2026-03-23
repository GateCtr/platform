"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecretReveal } from "./secret-reveal";
import { WEBHOOK_EVENTS } from "@/lib/webhook-events";
import { cn } from "@/lib/utils";

// ── Event groups ──────────────────────────────────────────────────────────────

const EVENT_GROUPS: {
  key: string;
  events: (typeof WEBHOOK_EVENTS)[number][];
}[] = [
  {
    key: "requests",
    events: ["request.completed", "request.failed", "request.routed"],
  },
  {
    key: "budget",
    events: ["budget.threshold", "budget.exceeded", "budget.reset"],
  },
  { key: "provider", events: ["provider.fallback", "provider.error"] },
  {
    key: "apiKeys",
    events: ["api_key.created", "api_key.revoked", "api_key.expired"],
  },
  { key: "projects", events: ["project.created"] },
  { key: "team", events: ["team.member.added", "team.member.removed"] },
  {
    key: "billing",
    events: [
      "billing.plan_upgraded",
      "billing.plan_downgraded",
      "billing.payment_failed",
      "billing.trial_started",
      "billing.trial_ending",
      "billing.subscription_cancellation_scheduled",
    ],
  },
  { key: "webhook", events: ["webhook.test", "webhook.failed"] },
];

// Convert "request.completed" → "request_completed" for next-intl keys
function eventKey(ev: string) {
  return ev.replace(/\./g, "_");
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CreateWebhookFormProps {
  onCreated: () => void;
}

export function CreateWebhookForm({ onCreated }: CreateWebhookFormProps) {
  const t = useTranslations("webhooks");

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([
    "budget.threshold",
    "budget.exceeded",
  ]);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  // ── Real-time field validation ──────────────────────────────────────────────
  const [nameTouched, setNameTouched] = useState(false);
  const [urlTouched, setUrlTouched] = useState(false);

  const nameError =
    nameTouched && name.trim().length < 2 ? t("form.nameMinLength") : null;

  const urlError = urlTouched
    ? !url
      ? t("form.urlRequired")
      : !url.startsWith("https://")
        ? t("form.urlHttpsError")
        : (() => {
            try {
              new URL(url);
              return null;
            } catch {
              return t("form.urlInvalid");
            }
          })()
    : null;

  const isFormValid =
    name.trim().length >= 2 &&
    !urlError &&
    url.startsWith("https://") &&
    events.length > 0;

  // ── Filtered groups based on search ────────────────────────────────────────
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return EVENT_GROUPS;
    const q = search.toLowerCase();
    return EVENT_GROUPS.map((g) => ({
      ...g,
      events: g.events.filter((ev) => ev.toLowerCase().includes(q)),
    })).filter((g) => g.events.length > 0);
  }, [search]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function toggleEvent(ev: string) {
    setEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev],
    );
  }

  function toggleGroup(groupEvents: string[]) {
    const allSelected = groupEvents.every((ev) => events.includes(ev));
    setEvents((prev) =>
      allSelected
        ? prev.filter((e) => !groupEvents.includes(e))
        : [...new Set([...prev, ...groupEvents])],
    );
  }

  function toggleCollapse(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function selectAll() {
    setEvents([...WEBHOOK_EVENTS]);
  }

  function clearAll() {
    setEvents([]);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Touch all fields to surface any remaining errors
    setNameTouched(true);
    setUrlTouched(true);
    if (!isFormValid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, events }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("form.genericError"));
        return;
      }
      setSecret(data.secret);
      // onCreated is called from SecretReveal after user copies the secret
    } catch {
      setError(t("form.genericError"));
    } finally {
      setLoading(false);
    }
  }

  if (secret) {
    return (
      <SecretReveal
        secret={secret}
        warningLabel={t("secret.warning")}
        copyLabel={t("secret.copy")}
        copiedLabel={t("secret.copied")}
        doneLabel={t("secret.done")}
        onDone={onCreated}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* ── Row 1: Name + URL ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("form.name")}</label>
          <input
            className={cn(
              "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
              nameError && "border-red-500 focus:ring-red-500",
            )}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setNameTouched(true)}
            placeholder={t("form.namePlaceholder")}
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("form.url")}</label>
          <input
            className={cn(
              "w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
              urlError && "border-red-500 focus:ring-red-500",
            )}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setUrlTouched(true)}
            placeholder="https://your-server.com/webhook"
            type="url"
          />
          {urlError && <p className="text-xs text-red-500">{urlError}</p>}
        </div>
      </div>

      {/* ── Row 2: Events ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-sm font-medium">{t("form.events")}</label>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {events.length} / {WEBHOOK_EVENTS.length}{" "}
              {t("form.eventsSelected")}
            </span>
            <button
              type="button"
              onClick={selectAll}
              className="hover:text-foreground transition-colors"
            >
              {t("form.selectAll")}
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={clearAll}
              className="hover:text-foreground transition-colors"
            >
              {t("form.clearAll")}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("form.searchEvents")}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Groups — fixed height, internal scroll like Stripe */}
        <div className="rounded-xl border overflow-hidden">
          <div className="max-h-52 overflow-y-auto divide-y scrollbar-none">
            {filteredGroups.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                {t("form.noResults")}
              </div>
            )}

            {filteredGroups.map((group) => {
              const isCollapsed = collapsed[group.key] && !search;
              const selectedInGroup = group.events.filter((ev) =>
                events.includes(ev),
              );
              const allSelected =
                selectedInGroup.length === group.events.length;
              const someSelected = selectedInGroup.length > 0 && !allSelected;

              return (
                <div key={group.key}>
                  {/* Group header */}
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors sticky top-0 z-10">
                    {/* Collapse toggle */}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(group.key)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      aria-label="toggle group"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                    </button>

                    {/* Group checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.events)}
                      className="flex items-center gap-2.5 flex-1 text-left"
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs font-bold transition-colors",
                          allSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : someSelected
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-border bg-background",
                        )}
                      >
                        {allSelected ? "✓" : someSelected ? "–" : ""}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t(`form.groups.${group.key}`)}
                      </span>
                    </button>

                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {selectedInGroup.length}/{group.events.length}
                    </span>
                  </div>

                  {/* Events list */}
                  {!isCollapsed && (
                    <div className="divide-y">
                      {group.events.map((ev) => {
                        const selected = events.includes(ev);
                        return (
                          <button
                            key={ev}
                            type="button"
                            onClick={() => toggleEvent(ev)}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/40",
                              selected && "bg-primary/5 hover:bg-primary/10",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs font-bold transition-colors",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background",
                              )}
                            >
                              {selected && "✓"}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-xs font-mono text-foreground truncate">
                                {ev}
                              </span>
                              <span className="block text-xs text-muted-foreground truncate">
                                {t(`eventLabels.${eventKey(ev)}`)}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="cta-primary"
          disabled={loading || !isFormValid}
          className="w-full sm:w-auto"
        >
          {loading ? t("form.creating") : t("form.create")}
        </Button>
      </div>
    </form>
  );
}
