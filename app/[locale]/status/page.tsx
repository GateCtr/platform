"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  Bell,
  X,
  ExternalLink,
  Minus,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = "HEALTHY" | "DEGRADED" | "DOWN" | "unknown";
type DayStatus = "healthy" | "degraded" | "down" | "empty";

type HealthResponse = {
  status: string;
  services: Record<string, { status: string; checkedAt: string | null }>;
};

type UptimeResponse = {
  days: Record<string, DayStatus[]>;
  uptime: Record<string, number>;
  dates: string[];
};

const SERVICES = ["app", "database", "redis", "queue", "stripe"] as const;

const API_BASE = process.env.NEXT_PUBLIC_APP_URL ?? "";

// ─── Subscribe Modal ──────────────────────────────────────────────────────────

function SubscribeModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("status");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/system/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
    } catch {
      // still show success to avoid email enumeration
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-grey-950/80 backdrop-blur-sm px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-grey-800 border border-grey-700 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-grey-400 hover:text-grey-100 transition-colors"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        {success ? (
          <div className="text-center py-6">
            <div className="size-12 rounded-full bg-secondary-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-6 text-secondary-400" />
            </div>
            <p className="text-sm font-medium text-grey-100 mb-1">
              {t("subscribeModal.title")}
            </p>
            <p className="text-sm text-grey-400">
              {t("subscribeModal.success")}
            </p>
            <button
              onClick={onClose}
              className="mt-5 text-sm text-grey-100 border border-grey-600 rounded-lg px-4 py-2 hover:bg-grey-700 transition-colors"
            >
              {t("subscribeModal.cancel")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="size-9 rounded-lg bg-primary-500/15 flex items-center justify-center">
                <Bell className="size-4 text-primary-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-grey-100">
                  {t("subscribeModal.title")}
                </h2>
                <p className="text-xs text-grey-400 mt-0.5">
                  {t("subscribeModal.description")}
                </p>
              </div>
            </div>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-grey-300 mb-1.5">
                  {t("subscribeModal.emailLabel")}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("subscribeModal.emailPlaceholder")}
                  className="w-full bg-grey-900 border border-grey-600 rounded-lg px-3 py-2.5 text-sm text-grey-100 placeholder-grey-500 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/30 transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 text-sm text-grey-400 hover:text-grey-100 transition-colors border border-grey-600 rounded-lg px-4 py-2.5"
                >
                  {t("subscribeModal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-colors rounded-lg px-4 py-2.5"
                >
                  {submitting
                    ? t("subscribeModal.submitting")
                    : t("subscribeModal.submit")}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Uptime Bar ───────────────────────────────────────────────────────────────

function UptimeBar({ days, dates }: { days: DayStatus[]; dates: string[] }) {
  return (
    <div className="flex gap-px h-7">
      {days.map((day, i) => (
        <div
          key={i}
          title={dates[i] ? `${dates[i]}: ${day}` : day}
          className={cn(
            "flex-1 rounded-sm transition-opacity hover:opacity-70 cursor-default",
            day === "healthy" && "bg-secondary-500",
            day === "degraded" && "bg-warning-500",
            day === "down" && "bg-error-500",
            day === "empty" && "bg-grey-700",
          )}
        />
      ))}
    </div>
  );
}

// ─── Status icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: ServiceStatus }) {
  if (status === "HEALTHY")
    return <CheckCircle2 className="size-4 text-secondary-400 shrink-0" />;
  if (status === "DEGRADED")
    return <AlertTriangle className="size-4 text-warning-400 shrink-0" />;
  if (status === "DOWN")
    return <XCircle className="size-4 text-error-400 shrink-0" />;
  return <Minus className="size-4 text-grey-500 shrink-0" />;
}

// ─── Service Row ──────────────────────────────────────────────────────────────

function ServiceRow({
  name,
  status,
  days,
  uptime,
  dates,
}: {
  name: string;
  status: ServiceStatus;
  days: DayStatus[];
  uptime: number;
  dates: string[];
}) {
  const t = useTranslations("status");
  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <StatusIcon status={status} />
          <span className="text-sm font-medium text-grey-100">
            {t(`services.${name}` as Parameters<typeof t>[0])}
          </span>
        </div>
        <span className="text-xs font-mono text-grey-400 tabular-nums">
          {uptime === 100 ? t("uptimeFull") : t("uptime", { value: uptime })}
        </span>
      </div>
      <UptimeBar days={days} dates={dates} />
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-grey-600">{t("days")}</span>
        <span className="text-xs text-grey-600">{t("today")}</span>
      </div>
    </div>
  );
}

// ─── Overall Banner ───────────────────────────────────────────────────────────

function OverallBanner({ status }: { status: string }) {
  const t = useTranslations("status");
  const isHealthy = status === "healthy";
  const isDegraded = status === "degraded";
  return (
    <div
      className={cn(
        "rounded-xl border px-5 py-4 flex items-start gap-4",
        isHealthy && "bg-secondary-500/8 border-secondary-500/20",
        isDegraded && "bg-warning-500/8 border-warning-500/20",
        !isHealthy && !isDegraded && "bg-error-500/8 border-error-500/20",
      )}
    >
      <div
        className={cn(
          "size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          isHealthy && "bg-secondary-500/15",
          isDegraded && "bg-warning-500/15",
          !isHealthy && !isDegraded && "bg-error-500/15",
        )}
      >
        {isHealthy ? (
          <CheckCircle2 className="size-5 text-secondary-400" />
        ) : isDegraded ? (
          <AlertTriangle className="size-5 text-warning-400" />
        ) : (
          <XCircle className="size-5 text-error-400" />
        )}
      </div>
      <div>
        <p className="font-semibold text-grey-100">
          {t(
            `overall.${isHealthy ? "healthy" : isDegraded ? "degraded" : "down"}` as Parameters<
              typeof t
            >[0],
          )}
        </p>
        <p className="text-sm text-grey-400 mt-0.5">
          {t(
            `overall.${isHealthy ? "healthy_sub" : isDegraded ? "degraded_sub" : "down_sub"}` as Parameters<
              typeof t
            >[0],
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatusPage() {
  const t = useTranslations("status");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [uptime, setUptime] = useState<UptimeResponse | null>(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [healthRes, uptimeRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/system/health`),
          fetch(`${API_BASE}/api/v1/system/uptime`),
        ]);
        if (healthRes.ok) setHealth((await healthRes.json()) as HealthResponse);
        if (uptimeRes.ok) setUptime((await uptimeRes.json()) as UptimeResponse);
      } catch {
        /* silent */
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const overallStatus = health?.status ?? "healthy";

  return (
    <div className="min-h-screen bg-grey-900 text-grey-100 flex flex-col">
      {subscribeOpen && (
        <SubscribeModal onClose={() => setSubscribeOpen(false)} />
      )}

      {/* Header */}
      <header className="border-b border-grey-800">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="https://gatectr.com" aria-label="GateCtr home">
            <Logo
              variant="full"
              iconClassName="w-7 h-7"
              textClassName="text-xl"
            />
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={`${process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3000"}/help`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-grey-400 hover:text-grey-100 transition-colors border border-grey-700 hover:border-grey-600 rounded-lg px-3 py-1.5"
            >
              {t("actions.reportIssue")}
              <ExternalLink className="size-3" />
            </a>
            <button
              onClick={() => setSubscribeOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors rounded-lg px-3 py-1.5"
            >
              <Bell className="size-3" />
              {t("actions.subscribe")}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 space-y-6">
        <OverallBanner status={overallStatus} />

        {/* Services card */}
        <div className="bg-grey-800/50 border border-grey-700/60 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-grey-700/60 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-grey-500">
              {t("systemStatus")}
            </h2>
            <span className="text-xs text-grey-600 font-mono">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="px-5 divide-y divide-grey-700/40">
            {SERVICES.map((svc) => {
              const status = (health?.services[svc]?.status ??
                "unknown") as ServiceStatus;
              const days =
                uptime?.days[svc] ?? Array(90).fill("empty" as DayStatus);
              const uptimePct = uptime?.uptime[svc] ?? 100;
              const dates = uptime?.dates ?? [];
              return (
                <ServiceRow
                  key={svc}
                  name={svc}
                  status={status}
                  days={days}
                  uptime={uptimePct}
                  dates={dates}
                />
              );
            })}
          </div>
        </div>

        {/* View history */}
        <div className="flex justify-center pt-2">
          <Link
            href="/status/history"
            className="inline-flex items-center gap-2 text-sm text-grey-400 hover:text-grey-100 transition-colors group"
          >
            <History className="size-4 group-hover:text-secondary-400 transition-colors" />
            {t("actions.viewHistory")}
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-grey-800 py-5">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-grey-600">
            © {new Date().getFullYear()} GateCtr
          </span>
          <a
            href="https://gatectr.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-grey-600 hover:text-grey-400 transition-colors"
          >
            gatectr.com
          </a>
        </div>
      </footer>
    </div>
  );
}
