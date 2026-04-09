"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";

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

const API_BASE = process.env.NEXT_PUBLIC_APP_URL ?? "";

// ─── Month helpers ────────────────────────────────────────────────────────────

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function buildMonthRange(monthsBack = 12): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthKey(d));
  }
  return months;
}

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
      const apiBase = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const res = await fetch(`${apiBase}/api/v1/system/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
    } catch {
      setSuccess(true); // avoid email enumeration
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

// ─── Incident status pill ─────────────────────────────────────────────────────

function IncidentPill({ status }: { status: IncidentStatus }) {
  const t = useTranslations("status");
  const config: Record<IncidentStatus, string> = {
    RESOLVED: "bg-secondary-500/10 text-secondary-400 border-secondary-500/20",
    MONITORING: "bg-primary-500/10 text-primary-400 border-primary-500/20",
    IDENTIFIED: "bg-warning-500/10 text-warning-400 border-warning-500/20",
    INVESTIGATING: "bg-warning-500/10 text-warning-400 border-warning-500/20",
  };
  const Icon = status === "RESOLVED" ? CheckCircle2 : AlertTriangle;
  const labelKey = status.toLowerCase() as
    | "resolved"
    | "investigating"
    | "monitoring";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${config[status]}`}
    >
      <Icon className="size-3" />
      {t(`history.${labelKey}` as Parameters<typeof t>[0])}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const t = useTranslations("status");
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const allMonths = buildMonthRange(12);
  const [activeKey, setActiveKey] = useState(allMonths[0]);

  const activeIndex = allMonths.indexOf(activeKey);
  const canGoBack = activeIndex < allMonths.length - 1;
  const canGoForward = activeIndex > 0;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [year, month] = activeKey.split("-").map(Number);
        const res = await fetch(
          `${API_BASE}/api/v1/system/incidents?year=${year}&month=${month}`,
        );
        if (res.ok) {
          const data = (await res.json()) as { incidents: Incident[] };
          setIncidents(data.incidents);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeKey]);

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
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        {/* Back + title + month nav */}
        <div className="mb-8">
          <Link
            href="/status"
            className="inline-flex items-center gap-1.5 text-xs text-grey-500 hover:text-grey-300 transition-colors mb-4 group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            {t("page.title")}
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-grey-100">
              {t("history.title")}
            </h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveKey(allMonths[activeIndex + 1])}
                disabled={!canGoBack}
                className="size-7 flex items-center justify-center rounded-md text-grey-400 hover:text-grey-100 hover:bg-grey-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-medium text-grey-300 min-w-[130px] text-center tabular-nums">
                {formatMonthLabel(activeKey)}
              </span>
              <button
                onClick={() => setActiveKey(allMonths[activeIndex - 1])}
                disabled={!canGoForward}
                className="size-7 flex items-center justify-center rounded-md text-grey-400 hover:text-grey-100 hover:bg-grey-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Incidents */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-grey-800/50 border border-grey-700/60 rounded-xl h-24 animate-pulse"
              />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div className="bg-grey-800/50 border border-grey-700/60 rounded-xl px-5 py-10 text-center">
            <CheckCircle2 className="size-8 text-secondary-500/50 mx-auto mb-3" />
            <p className="text-sm text-grey-500">{t("history.noIncidents")}</p>
          </div>
        ) : (
          <div className="bg-grey-800/50 border border-grey-700/60 rounded-xl overflow-hidden divide-y divide-grey-700/40">
            {incidents.map((inc) => {
              const date = new Date(inc.startedAt);
              const accentColor =
                inc.impact === "CRITICAL"
                  ? "bg-error-500/40"
                  : inc.impact === "MAJOR"
                    ? "bg-warning-500/40"
                    : "bg-warning-500/20";
              return (
                <div key={inc.id} className="px-5 py-5 flex gap-4">
                  <div className="w-14 shrink-0 text-right">
                    <span className="text-sm font-semibold text-grey-100 tabular-nums">
                      {date.getDate().toString().padStart(2, "0")}
                    </span>
                    <p className="text-xs text-grey-500">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                  </div>
                  <div
                    className={`w-px ${accentColor} shrink-0 rounded-full`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-medium text-grey-100 leading-snug">
                        {inc.title}
                      </p>
                      <span className="text-xs text-grey-500 font-mono shrink-0 mt-0.5 tabular-nums">
                        {date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-grey-400 leading-relaxed mb-3">
                      {inc.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <IncidentPill status={inc.status} />
                      {inc.services.length > 0 && (
                        <span className="text-xs text-grey-600">
                          {inc.services.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-grey-800 py-5 mt-10">
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
