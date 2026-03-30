"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Bell, Check, Globe, AlertTriangle } from "lucide-react";
import { Link } from "@/i18n/routing";
import { saveBudget } from "@/app/[locale]/(dashboard)/settings/budget/_actions";
import { cn } from "@/lib/utils";
import type { PlanType } from "@prisma/client";
import { PLAN_TOKEN_LIMIT } from "@/constants/billing";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Budget {
  maxTokensPerDay: number | null;
  maxTokensPerMonth: number | null;
  maxCostPerDay: number | null;
  maxCostPerMonth: number | null;
  alertThresholdPct: number;
  hardStop: boolean;
}

interface ProjectWithBudget {
  id: string;
  name: string;
  color: string | null;
  budget: Budget | null;
}

interface BudgetFormProps {
  globalBudget: Budget | null;
  plan: PlanType;
  projects: ProjectWithBudget[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTokens(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function numToStr(n: number | null): string {
  return n === null ? "" : String(n);
}

function parsePositive(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return isNaN(n) || n <= 0 ? -1 : n;
}

function budgetToState(b: Budget | null) {
  return {
    maxTokensPerDay: numToStr(b?.maxTokensPerDay ?? null),
    maxTokensPerMonth: numToStr(b?.maxTokensPerMonth ?? null),
    maxCostPerDay: numToStr(b?.maxCostPerDay ?? null),
    maxCostPerMonth: numToStr(b?.maxCostPerMonth ?? null),
    alertThresholdPct: b?.alertThresholdPct ?? 80,
    hardStop: b?.hardStop ?? false,
  };
}

type FormState = ReturnType<typeof budgetToState>;

// ─── Limit input ──────────────────────────────────────────────────────────────

function LimitInput({
  id,
  label,
  description,
  value,
  onChange,
  placeholder,
  prefix,
  error,
}: {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  prefix?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            prefix && "pl-7",
            error && "border-destructive focus-visible:ring-destructive",
          )}
        />
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// ─── Budget summary row ───────────────────────────────────────────────────────

function BudgetSummaryRow({
  label,
  color,
  budget,
  isGlobal,
  isSelected,
  onClick,
  t,
}: {
  label: string;
  color?: string | null;
  budget: Budget | null;
  isGlobal?: boolean;
  isSelected: boolean;
  onClick: () => void;
  t: ReturnType<typeof useTranslations<"settingsBudget">>;
}) {
  const hasConfig =
    budget !== null &&
    (budget.maxTokensPerMonth !== null || budget.maxCostPerMonth !== null);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        isSelected
          ? "border-primary/40 bg-primary/5"
          : "border-border hover:bg-accent/40",
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {isGlobal ? (
          <Globe className="size-3.5 text-muted-foreground shrink-0" />
        ) : (
          <div
            className="size-3 rounded-full shrink-0"
            style={{ backgroundColor: color ?? "#1B4F82" }}
          />
        )}
        <span className="text-sm font-medium truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {hasConfig ? (
          <span className="text-xs text-muted-foreground">
            {budget.maxTokensPerMonth !== null
              ? formatTokens(budget.maxTokensPerMonth) +
                " " +
                t("list.tokensUnit")
              : budget.maxCostPerMonth !== null
                ? "$" + budget.maxCostPerMonth + "/mo"
                : null}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            {t("list.noLimit")}
          </span>
        )}
        {isSelected && <Check className="size-3.5 text-primary" />}
      </div>
    </button>
  );
}

// ─── Native range slider ──────────────────────────────────────────────────────

function ThresholdSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - 50) / (95 - 50)) * 100;
  return (
    <div className="relative flex w-full touch-none items-center h-5">
      <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
        <div
          className="absolute h-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
      <input
        type="range"
        min={50}
        max={95}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        aria-label="Alert threshold"
      />
      <div
        className="absolute size-4 rounded-full border border-primary bg-white shadow-sm pointer-events-none"
        style={{ left: `calc(${pct}% - 8px)` }}
      />
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function BudgetForm({ globalBudget, plan, projects }: BudgetFormProps) {
  const t = useTranslations("settingsBudget");
  const router = useRouter();
  const planTokenLimit = PLAN_TOKEN_LIMIT[plan];

  const [scope, setScope] = useState<string>("global");
  // Local cache of budgets so scope switches reflect saved values immediately
  const [localGlobalBudget, setLocalGlobalBudget] = useState(globalBudget);
  const [localProjects, setLocalProjects] = useState(projects);
  const [fields, setFields] = useState<FormState>(() =>
    budgetToState(globalBudget),
  );
  const [savedSnapshot, setSavedSnapshot] = useState<FormState>(() =>
    budgetToState(globalBudget),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    maxTokensPerDay,
    maxTokensPerMonth,
    maxCostPerDay,
    maxCostPerMonth,
    alertThresholdPct,
    hardStop,
  } = fields;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleScopeChange(newScope: string) {
    const budget =
      newScope === "global"
        ? localGlobalBudget
        : (localProjects.find((p) => p.id === newScope)?.budget ?? null);
    const state = budgetToState(budget);
    setScope(newScope);
    setFields(state);
    setSavedSnapshot(state);
    setFieldErrors({});
    setSubmitError(null);
    setSaved(false);
  }

  // Warn if project budget exceeds global budget on any dimension
  const globalFields =
    scope === "global" ? null : budgetToState(localGlobalBudget);
  const exceedsGlobal =
    globalFields !== null &&
    (() => {
      const checks = [
        { proj: maxTokensPerMonth, global: globalFields.maxTokensPerMonth },
        { proj: maxTokensPerDay, global: globalFields.maxTokensPerDay },
        { proj: maxCostPerMonth, global: globalFields.maxCostPerMonth },
        { proj: maxCostPerDay, global: globalFields.maxCostPerDay },
      ];
      return checks.some(({ proj, global }) => {
        if (!proj.trim() || !global.trim()) return false;
        const p = Number(proj),
          g = Number(global);
        return !isNaN(p) && !isNaN(g) && p > g;
      });
    })();

  const isDirty =
    maxTokensPerDay !== savedSnapshot.maxTokensPerDay ||
    maxTokensPerMonth !== savedSnapshot.maxTokensPerMonth ||
    maxCostPerDay !== savedSnapshot.maxCostPerDay ||
    maxCostPerMonth !== savedSnapshot.maxCostPerMonth ||
    alertThresholdPct !== savedSnapshot.alertThresholdPct ||
    hardStop !== savedSnapshot.hardStop;

  const validateField = useCallback(
    (
      field: string,
      value: string,
      related?: { field: string; value: string; isDay: boolean },
    ) => {
      setFieldErrors((prev) => {
        const errors = { ...prev };
        if (value.trim() !== "") {
          const n = parsePositive(value);
          if (n === -1) {
            errors[field] = t("errors.invalid_value");
          } else {
            delete errors[field];
            if (related && related.value.trim() !== "") {
              const relatedN = parsePositive(related.value);
              if (relatedN !== null && relatedN !== -1 && n !== null) {
                if (related.isDay && n > relatedN) {
                  errors[field] = field.includes("Cost")
                    ? t("errors.day_exceeds_month_cost")
                    : t("errors.day_exceeds_month_tokens");
                } else if (!related.isDay && relatedN > n) {
                  errors[related.field] = related.field.includes("Cost")
                    ? t("errors.day_exceeds_month_cost")
                    : t("errors.day_exceeds_month_tokens");
                } else {
                  delete errors[related.field];
                }
              }
            }
            if (
              field === "maxTokensPerMonth" &&
              planTokenLimit !== null &&
              n !== null &&
              n > planTokenLimit
            ) {
              errors[field] = t("errors.exceeds_plan_limit", {
                limit: formatTokens(planTokenLimit),
              });
            }
          }
        } else {
          delete errors[field];
          if (related) delete errors[related.field];
        }
        return errors;
      });
    },
    [t, planTokenLimit],
  );

  function handleTokensPerDayChange(v: string) {
    setField("maxTokensPerDay", v);
    validateField("maxTokensPerDay", v, {
      field: "maxTokensPerMonth",
      value: maxTokensPerMonth,
      isDay: true,
    });
  }
  function handleTokensPerMonthChange(v: string) {
    setField("maxTokensPerMonth", v);
    validateField("maxTokensPerMonth", v, {
      field: "maxTokensPerDay",
      value: maxTokensPerDay,
      isDay: false,
    });
  }
  function handleCostPerDayChange(v: string) {
    setField("maxCostPerDay", v);
    validateField("maxCostPerDay", v, {
      field: "maxCostPerMonth",
      value: maxCostPerMonth,
      isDay: true,
    });
  }
  function handleCostPerMonthChange(v: string) {
    setField("maxCostPerMonth", v);
    validateField("maxCostPerMonth", v, {
      field: "maxCostPerDay",
      value: maxCostPerDay,
      isDay: false,
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setSaved(false);
    if (Object.keys(fieldErrors).length > 0) return;

    const fd = new FormData();
    if (scope !== "global") fd.set("projectId", scope);
    fd.set("maxTokensPerDay", maxTokensPerDay);
    fd.set("maxTokensPerMonth", maxTokensPerMonth);
    fd.set("maxCostPerDay", maxCostPerDay);
    fd.set("maxCostPerMonth", maxCostPerMonth);
    fd.set("alertThresholdPct", String(alertThresholdPct));
    fd.set("hardStop", String(hardStop));

    startTransition(async () => {
      const result = await saveBudget(fd);
      if ("error" in result) {
        setSubmitError(t(`errors.${result.error}` as Parameters<typeof t>[0]));
        return;
      }
      const savedState = {
        maxTokensPerDay,
        maxTokensPerMonth,
        maxCostPerDay,
        maxCostPerMonth,
        alertThresholdPct,
        hardStop,
      };
      setSavedSnapshot(savedState);

      // Update local budget cache so scope switches reflect saved values
      const savedBudget = result.data;
      if (scope === "global") {
        setLocalGlobalBudget(savedBudget);
      } else {
        setLocalProjects((prev) =>
          prev.map((p) => (p.id === scope ? { ...p, budget: savedBudget } : p)),
        );
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh(); // re-fetch server data in background
    });
  }

  const thresholdColor =
    alertThresholdPct >= 90
      ? "text-destructive"
      : alertThresholdPct >= 75
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

  const hasErrors = Object.keys(fieldErrors).length > 0;

  return (
    <div className="space-y-6">
      {/* ── Budget list ── */}
      <section className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("list.title")}
        </p>
        <div className="space-y-1.5">
          <BudgetSummaryRow
            label={t("scope.global")}
            budget={globalBudget}
            isGlobal
            isSelected={scope === "global"}
            onClick={() => handleScopeChange("global")}
            t={t}
          />
          {projects.map((p) => (
            <BudgetSummaryRow
              key={p.id}
              label={p.name}
              color={p.color}
              budget={p.budget}
              isSelected={scope === p.id}
              onClick={() => handleScopeChange(p.id)}
              t={t}
            />
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <p className="text-xs text-muted-foreground">
          {scope === "global"
            ? t("scope.globalDescription")
            : t("scope.projectDescription")}
        </p>

        {exceedsGlobal && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 dark:border-amber-800/50 dark:bg-amber-950/30">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t("errors.project_exceeds_global")}
            </p>
          </div>
        )}

        {scope === "global" && planTokenLimit !== null && (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {t("planLimit.note", {
                plan,
                limit: formatTokens(planTokenLimit),
              })}
            </p>
            <Link
              href="/billing"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("planLimit.upgrade")}
            </Link>
          </div>
        )}

        {/* Token limits */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">{t("sections.global")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("sections.globalDescription")}
            </p>
            <Separator className="mt-3" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <LimitInput
              id="maxTokensPerDay"
              label={t("tokens.perDay")}
              description={t("tokens.perDayDescription")}
              value={maxTokensPerDay}
              onChange={handleTokensPerDayChange}
              placeholder={t("tokens.placeholder")}
              error={fieldErrors["maxTokensPerDay"]}
            />
            <LimitInput
              id="maxTokensPerMonth"
              label={t("tokens.perMonth")}
              description={t("tokens.perMonthDescription")}
              value={maxTokensPerMonth}
              onChange={handleTokensPerMonthChange}
              placeholder={t("tokens.placeholder")}
              error={fieldErrors["maxTokensPerMonth"]}
            />
            <LimitInput
              id="maxCostPerDay"
              label={t("cost.perDay")}
              description={t("cost.perDayDescription")}
              value={maxCostPerDay}
              onChange={handleCostPerDayChange}
              placeholder={t("cost.placeholder")}
              prefix="$"
              error={fieldErrors["maxCostPerDay"]}
            />
            <LimitInput
              id="maxCostPerMonth"
              label={t("cost.perMonth")}
              description={t("cost.perMonthDescription")}
              value={maxCostPerMonth}
              onChange={handleCostPerMonthChange}
              placeholder={t("cost.placeholder")}
              prefix="$"
              error={fieldErrors["maxCostPerMonth"]}
            />
          </div>
        </section>

        {/* Behavior */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">{t("sections.behavior")}</h2>
            <Separator className="mt-3" />
          </div>

          {/* Alert threshold — native range input, no Radix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("alert.threshold")}</Label>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  thresholdColor,
                )}
              >
                {alertThresholdPct}%
              </span>
            </div>
            <ThresholdSlider
              value={alertThresholdPct}
              onChange={(v) => setField("alertThresholdPct", v)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50%</span>
              <span>95%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("alert.thresholdDescription")}
            </p>
          </div>

          {/* Hard stop toggle */}
          <button
            type="button"
            onClick={() => setField("hardStop", !hardStop)}
            className={cn(
              "w-full flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors text-left cursor-pointer",
              hardStop
                ? "border-primary/30 bg-primary/5"
                : "border-border hover:bg-accent/40",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg shrink-0 transition-colors",
                  hardStop ? "bg-primary/10" : "bg-muted",
                )}
              >
                {hardStop ? (
                  <ShieldCheck className="size-4 text-primary" />
                ) : (
                  <Bell className="size-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{t("hardStop.label")}</p>
                <p className="text-xs text-muted-foreground">
                  {hardStop ? t("hardStop.on") : t("hardStop.off")}
                </p>
              </div>
            </div>
            {/* Native toggle pill */}
            <div
              className={cn(
                "relative inline-flex h-[1.15rem] w-8 shrink-0 rounded-full border border-transparent transition-colors",
                hardStop ? "bg-primary" : "bg-input",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none block size-4 rounded-full bg-background transition-transform",
                  hardStop ? "translate-x-[calc(100%-2px)]" : "translate-x-0",
                )}
              />
            </div>
          </button>
        </section>

        {submitError && (
          <p className="text-sm text-destructive">{submitError}</p>
        )}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="cta-primary"
            disabled={isPending || hasErrors || !isDirty}
          >
            {isPending ? t("saving") : t("save")}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="size-3.5 text-emerald-500" />
              {t("saved")}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
