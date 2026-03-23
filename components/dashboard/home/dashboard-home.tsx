"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Zap,
  ArrowRight,
  Cpu,
  FolderOpen,
  ShieldCheck,
  TrendingUp,
  Activity,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanType } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  tokensToday: number;
  savedToday: number;
  requestsToday: number;
  costToday: number;
  tokensMonth: number;
  costMonth: number;
}

interface Budget {
  maxTokensPerMonth: number | null;
  maxCostPerMonth: number | null;
  alertThresholdPct: number;
  hardStop: boolean;
}

interface Project {
  id: string;
  name: string;
  color: string | null;
  _count: { usageLogs: number };
}

interface RecentLog {
  id: string;
  model: string;
  provider: string;
  totalTokens: number;
  savedTokens: number;
  costUsd: number;
  latencyMs: number;
  optimized: boolean;
  createdAt: string;
}

interface DashboardHomeProps {
  workspaceName: string;
  planType: PlanType;
  stats: Stats;
  budget: Budget | null;
  topProjects: Project[];
  recentLogs: RecentLog[];
  setupSteps: {
    hasProvider: boolean;
    hasProject: boolean;
    hasBudget: boolean;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatCost(n: number): string {
  if (n < 0.01) return "< $0.01";
  return `$${n.toFixed(2)}`;
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border bg-card px-5 py-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Budget Bar ────────────────────────────────────────────────────────────────

function BudgetBar({
  used,
  limit,
  alertPct,
  label,
}: {
  used: number;
  limit: number;
  alertPct: number;
  label: string;
}) {
  const pct = Math.min((used / limit) * 100, 100);
  const isAlert = pct >= alertPct;
  const isOver = pct >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            "tabular-nums font-medium",
            isOver
              ? "text-red-500"
              : isAlert
                ? "text-amber-500"
                : "text-foreground",
          )}
        >
          {formatTokens(used)} / {formatTokens(limit)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isOver ? "bg-red-500" : isAlert ? "bg-amber-500" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {pct.toFixed(1)}% used
      </p>
    </div>
  );
}

// ── Setup Checklist ───────────────────────────────────────────────────────────

function SetupChecklist({
  t,
  steps,
}: {
  t: ReturnType<typeof useTranslations>;
  steps: { hasProvider: boolean; hasProject: boolean; hasBudget: boolean };
}) {
  const items = [
    {
      done: steps.hasProvider,
      icon: <Cpu className="size-4 text-primary" />,
      title: t("empty.connectProvider"),
      desc: t("empty.connectProviderDesc"),
      href: "/settings/providers",
    },
    {
      done: steps.hasProject,
      icon: <FolderOpen className="size-4 text-primary" />,
      title: t("empty.createProject"),
      desc: t("empty.createProjectDesc"),
      href: "/projects",
    },
    {
      done: steps.hasBudget,
      icon: <ShieldCheck className="size-4 text-primary" />,
      title: t("empty.setBudget"),
      desc: t("empty.setBudgetDesc"),
      href: "/settings/budget",
    },
  ];

  const remaining = items.filter((i) => !i.done);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t("empty.setupTitle")}</p>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length - remaining.length}/{items.length}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${((items.length - remaining.length) / items.length) * 100}%`,
          }}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {items.map((item) =>
          item.done ? (
            <div
              key={item.href}
              className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5 opacity-50"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold shrink-0">
                ✓
              </span>
              <span className="text-xs font-medium line-through text-muted-foreground truncate">
                {item.title}
              </span>
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col gap-1.5 rounded-lg border bg-card px-3 py-2.5 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span className="text-xs font-medium truncate">
                  {item.title}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground leading-snug">
                {item.desc}
              </span>
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DashboardHome({
  workspaceName,
  planType,
  stats,
  budget,
  topProjects,
  recentLogs,
  setupSteps,
}: DashboardHomeProps) {
  const t = useTranslations("dashboardHome");

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("greetingMorning")
      : hour < 18
        ? t("greetingAfternoon")
        : t("greetingEvening");

  const showSetup =
    !setupSteps.hasProvider || !setupSteps.hasProject || !setupSteps.hasBudget;
  const showStats = setupSteps.hasProvider;

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
          <p className="text-sm text-muted-foreground">
            {workspaceName}
            <span className="ml-2 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {planType.toLowerCase()}
            </span>
          </p>
        </div>
        <Link href="/analytics">
          <Button variant="cta-secondary" size="sm">
            <TrendingUp className="size-3.5 mr-1.5" />
            {t("viewAnalytics")}
          </Button>
        </Link>
      </div>

      {/* ── Setup checklist ─────────────────────────────────────────────── */}
      {showSetup && <SetupChecklist t={t} steps={setupSteps} />}

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      {showStats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={<Zap className="size-3.5" />}
            label={t("stats.tokensToday")}
            value={formatTokens(stats.tokensToday)}
            sub={
              stats.savedToday > 0
                ? `${formatTokens(stats.savedToday)} ${t("stats.saved")}`
                : undefined
            }
          />
          <StatCard
            icon={<Activity className="size-3.5" />}
            label={t("stats.requestsToday")}
            value={String(stats.requestsToday)}
          />
          <StatCard
            icon={<DollarSign className="size-3.5" />}
            label={t("stats.costToday")}
            value={formatCost(stats.costToday)}
          />
          <StatCard
            icon={<TrendingUp className="size-3.5" />}
            label={t("stats.tokensMonth")}
            value={formatTokens(stats.tokensMonth)}
            sub={formatCost(stats.costMonth)}
          />
        </div>
      )}

      {/* ── Budget firewall ─────────────────────────────────────────────── */}
      {showStats && budget?.maxTokensPerMonth && (
        <div className="rounded-xl border bg-card px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-primary" />
              {t("budget.title")}
            </div>
            <Link
              href="/settings/budget"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("budget.adjust")}
            </Link>
          </div>
          <BudgetBar
            used={stats.tokensMonth}
            limit={budget.maxTokensPerMonth}
            alertPct={budget.alertThresholdPct}
            label={t("budget.monthlyTokens")}
          />
        </div>
      )}

      {/* ── Bottom grid ─────────────────────────────────────────────────── */}
      {showStats && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Projects */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b">
              <span className="text-sm font-medium">{t("projects.title")}</span>
              <Link
                href="/projects"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("projects.viewAll")}
                <ArrowRight className="size-3" />
              </Link>
            </div>
            {topProjects.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                {t("projects.empty")}
              </div>
            ) : (
              <div className="divide-y">
                {topProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-accent/40 transition-colors"
                  >
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ background: p.color ?? "#1B4F82" }}
                    />
                    <span className="flex-1 text-sm truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatTokens(p._count.usageLogs)}{" "}
                      {t("projects.requests")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b">
              <span className="text-sm font-medium">{t("activity.title")}</span>
              <Link
                href="/analytics"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("activity.viewAll")}
                <ArrowRight className="size-3" />
              </Link>
            </div>
            {recentLogs.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                {t("activity.empty")}
              </div>
            ) : (
              <div className="divide-y">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs font-mono truncate">{log.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTokens(log.totalTokens)} tokens
                        {log.optimized && (
                          <span className="ml-1.5 text-green-500">
                            -{formatTokens(log.savedTokens)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatMs(log.latencyMs)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        {timeAgo(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
