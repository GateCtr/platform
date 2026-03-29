"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { appUrl } from "@/lib/app-url";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Zap,
  GitBranch,
  TrendingDown,
  Clock,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  ChevronRight,
  Sparkles,
  BarChart3,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DemoResult = {
  content: string;
  model_used: string;
  routing_reason: string;
  sandbox: boolean;
  tokens: {
    original: number;
    optimized: number;
    saved: number;
    completion: number;
    total: number;
  };
  compression_ratio: number;
  optimized_prompt: string;
  techniques: string[];
  cost_usd: number;
  cost_saved_usd: number;
  latency_ms: number;
  remaining_requests: number;
};

type ResultTab = "tokens" | "response" | "cost";

const SAMPLE_PROMPTS = [
  {
    label: "React performance",
    text: "You are a helpful assistant. The user is asking about how to optimize their React application for performance. Please provide a comprehensive guide covering code splitting, memoization, lazy loading, and bundle optimization strategies. Include code examples where relevant.",
  },
  {
    label: "API specification",
    text: "Analyze the following business requirements and create a detailed technical specification for a REST API: We need an endpoint that accepts user data, validates it, stores it in a database, sends a confirmation email, and returns a success response.",
  },
  {
    label: "Python function",
    text: "Write a Python function that takes a list of dictionaries containing user data (name, email, age, country) and returns a filtered and sorted list based on multiple criteria. Include error handling and type hints.",
  },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const t = useTranslations("demo");

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("auto");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("tokens");
  const [remaining, setRemaining] = useState<number | null>(null);

  const isSandbox = !apiKey.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          apiKey: apiKey.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "demo_quota_exceeded") {
          setError(isSandbox ? t("errors.sandboxQuotaExceeded") : t("errors.quotaExceeded"));
          setRemaining(0);
        } else if (res.status === 429 || data.error === "provider_error") {
          setError(data.message ?? t("errors.unknown"));
        } else if (data.error === "prompt_too_short") {
          setError(t("errors.tooShort"));
        } else if (data.error === "prompt_too_long") {
          setError(t("errors.tooLong"));
        } else if (data.error === "invalid_api_key") {
          setError(t("errors.invalidApiKey"));
        } else if (data.error === "sandbox_unavailable") {
          setError(t("errors.sandboxUnavailable"));
        } else if (data.error === "timeout") {
          setError(t("errors.timeout"));
        } else {
          setError(t("errors.unknown"));
        }
        return;
      }

      setResult(data);
      setRemaining(data.remaining_requests);
      setActiveTab("tokens");
    } catch {
      setError(t("errors.network"));
    } finally {
      setLoading(false);
    }
  }

  const routingReasonLabel = result
    ? ((t.raw("results.response.routingReason") as Record<string, string>)[result.routing_reason] ?? result.routing_reason)
    : "";

  const monthlySavings = result ? (result.cost_saved_usd * 100000).toFixed(2) : "0";

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <span className="size-1.5 rounded-full bg-secondary-500 animate-pulse" />
              {t("hero.badge")}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {remaining !== null && remaining < 10 && (
              <span className={cn("text-xs font-mono", remaining === 0 ? "text-destructive" : "text-muted-foreground")}>
                {remaining === 0 ? t("playground.quotaExhausted") : t("playground.quotaLabel", { remaining })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main layout: sidebar + output ───────────────────────────────── */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full">

        {/* ── Left sidebar ─────────────────────────────────────────────── */}
        <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 border-r border-border flex flex-col">

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <h1 className="text-base font-semibold text-foreground">{t("hero.headline")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t("hero.description")}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
            <div className="flex-1 px-5 py-4 space-y-5">

              {/* API key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">{t("playground.apiKeyLabel")}</label>
                  <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                    {t("playground.apiKeyOptional")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={t("playground.apiKeyPlaceholder")}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 pr-9 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 font-mono transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                  <Lock className="size-2.5 shrink-0" />
                  {isSandbox ? t("playground.sandboxNote") : t("playground.keyTrustNote")}
                </div>
              </div>

              {/* Model — always visible so user can pick provider before entering key */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">{t("playground.modelLabel")}</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger size="sm" className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">{t("playground.modelAuto")}</SelectItem>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>OpenAI</SelectLabel>
                      <SelectItem value="gpt-5.4">GPT-5.4</SelectItem>
                      <SelectItem value="gpt-5.4-mini">GPT-5.4 mini</SelectItem>
                      <SelectItem value="gpt-5.4-nano">GPT-5.4 nano</SelectItem>
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Google Gemini</SelectLabel>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {isSandbox && (
                  <p className="text-[10px] text-muted-foreground/50">
                    {t("playground.sandboxModelNote")}
                  </p>
                )}
              </div>

              {/* Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">{t("playground.inputLabel")}</label>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">
                    {prompt.length}/{isSandbox ? 500 : 2000}
                  </span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t("playground.inputPlaceholder")}
                  rows={10}
                  maxLength={isSandbox ? 500 : 2000}
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed transition-shadow"
                />
              </div>

              {/* Sample prompts */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">
                  {t("playground.sampleLabel")}
                </p>
                <div className="space-y-1">
                  {SAMPLE_PROMPTS.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPrompt(s.text)}
                      className="w-full text-left flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-2 bg-transparent hover:bg-muted/40 transition-colors group"
                    >
                      <ChevronRight className="size-3 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive leading-relaxed">
                  {error}
                </div>
              )}
            </div>

            {/* Submit — sticky bottom */}
            <div className="px-5 py-4 border-t border-border bg-background/80 backdrop-blur-sm">
              <Button
                type="submit"
                variant="cta-primary"
                size="default"
                className="w-full"
                disabled={loading || !prompt.trim() || remaining === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {t("playground.ctaSending")}
                  </>
                ) : (
                  <>
                    <Zap className="size-3.5" />
                    {t("playground.ctaSend")}
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                {t("hero.trust")}
              </p>
            </div>
          </form>
        </aside>

        {/* ── Right output panel ────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 bg-muted/10">

          {/* Empty state */}
          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-16 text-center">
              <div className="size-16 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
                <Sparkles className="size-7 text-muted-foreground/40" />
              </div>
              <div className="space-y-2 max-w-sm">
                <p className="text-sm font-medium text-foreground/60">{t("playground.emptyState")}</p>
                <p className="text-xs text-muted-foreground/40 leading-relaxed">{t("playground.emptyStateSub")}</p>
              </div>
              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {[
                  { icon: TrendingDown, label: "Context Optimizer" },
                  { icon: GitBranch, label: "Model Router" },
                  { icon: BarChart3, label: "Token Analytics" },
                  { icon: Shield, label: "Cost Tracking" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                    <Icon className="size-3" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="size-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <Zap className="size-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm text-muted-foreground">{t("playground.processing")}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="flex-1 flex flex-col">

              {/* Stats bar */}
              <div className="border-b border-border bg-background/60 backdrop-blur-sm px-6 py-3 flex items-center gap-6 flex-wrap">
                {result.sandbox && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                    <Lock className="size-2.5" />
                    {t("results.sandboxBadge")}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs">
                  <TrendingDown className="size-3.5 text-secondary-500" />
                  <span className="font-semibold text-secondary-500">-{result.compression_ratio}%</span>
                  <span className="text-muted-foreground">tokens</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <GitBranch className="size-3.5 text-muted-foreground" />
                  <span className="font-mono text-foreground/80">{result.model_used}</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-muted-foreground text-[10px]">{routingReasonLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{result.latency_ms}ms</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs ml-auto">
                  <Shield className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">saved</span>
                  <span className="font-semibold text-secondary-500">${result.cost_saved_usd.toFixed(5)}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-border px-6 flex gap-0">
                {(["tokens", "response", "cost"] as ResultTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
                      activeTab === tab
                        ? "text-foreground border-primary"
                        : "text-muted-foreground border-transparent hover:text-foreground",
                    )}
                  >
                    {t(`results.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}` as "results.tabTokens")}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-6">

                {/* Tokens */}
                {activeTab === "tokens" && (
                  <div className="space-y-5 max-w-2xl">

                    {/* Before / After comparison */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Without GateCtr */}
                      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {t("results.tokens.withoutGatectr")}
                        </p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-2xl font-extrabold text-foreground tabular-nums">{result.tokens.original}</p>
                            <p className="text-[10px] text-muted-foreground">{t("results.tokens.unit")}</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-foreground tabular-nums">${result.cost_usd.toFixed(5)}</p>
                            <p className="text-[10px] text-muted-foreground">{t("results.cost.unit")}</p>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate">
                            {model === "auto" ? "gpt-5.4" : model}
                          </div>
                        </div>
                      </div>

                      {/* With GateCtr */}
                      <div className="rounded-xl border border-secondary-500/30 bg-secondary-500/5 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold text-secondary-500 uppercase tracking-wider">
                            {t("results.tokens.withGatectr")}
                          </p>
                          <span className="text-[10px] font-bold text-secondary-500 bg-secondary-500/10 px-1.5 py-0.5 rounded-full">
                            -{result.compression_ratio}%
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-2xl font-extrabold text-secondary-500 tabular-nums">{result.tokens.optimized}</p>
                            <p className="text-[10px] text-muted-foreground">{t("results.tokens.unit")}</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-secondary-500 tabular-nums">
                              ${(result.cost_usd - result.cost_saved_usd).toFixed(5)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{t("results.cost.unit")}</p>
                          </div>
                          <div className="text-[10px] text-secondary-500 font-mono truncate">
                            {result.model_used} · {routingReasonLabel}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Savings summary */}
                    <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">{t("results.tokens.saved")}</p>
                        <p className="text-sm font-semibold text-foreground">
                          {result.tokens.saved} {t("results.tokens.unit")} · ${result.cost_saved_usd.toFixed(5)}
                        </p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-xs text-muted-foreground">{t("results.cost.projection")}</p>
                        <p className="text-sm font-semibold text-secondary-500">${monthlySavings}</p>
                      </div>
                    </div>

                    {/* Token bar */}
                    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{result.tokens.original} {t("results.tokens.unit")}</span>
                          <span>{result.tokens.optimized} {t("results.tokens.unit")}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-secondary-500 to-secondary-400 transition-all duration-700"
                            style={{ width: `${result.tokens.original > 0 ? Math.round((result.tokens.optimized / result.tokens.original) * 100) : 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">{t("results.tokens.withoutGatectr")}</span>
                          <span className="text-secondary-500 font-semibold">{t("results.tokens.withGatectr")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Optimized prompt */}
                    {result.optimized_prompt !== prompt && (
                      <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="px-5 py-3 border-b border-border bg-muted/20">
                          <p className="text-xs font-medium text-foreground">{t("results.tokens.promptAfter")}</p>
                        </div>
                        <pre className="px-5 py-4 text-xs text-foreground/70 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-48">
                          {result.optimized_prompt}
                        </pre>
                      </div>
                    )}

                    {/* Contextual CTA — anchored on the savings just shown */}
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {t("results.tokens.ctaHeadline", {
                            saved: result.tokens.saved,
                            pct: result.compression_ratio,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("results.tokens.ctaSub")}</p>
                      </div>
                      <Button variant="cta-primary" size="sm" className="shrink-0" asChild>
                        <a href={appUrl("/sign-up")}>{t("cta.ctaPrimary")}</a>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Response */}
                {activeTab === "response" && (
                  <div className="space-y-4 max-w-2xl">
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                        <p className="text-xs font-medium text-foreground">{t("results.response.label")}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          <span>{result.model_used}</span>
                          <span>·</span>
                          <span>{result.latency_ms}ms</span>
                        </div>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-sm text-foreground leading-relaxed">{result.content}</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-5 py-3 flex items-center gap-3">
                      <GitBranch className="size-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{t("results.response.modelUsed")}: <span className="font-mono">{result.model_used}</span></p>
                        <p className="text-[10px] text-muted-foreground">{routingReasonLabel}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost */}
                {activeTab === "cost" && (
                  <div className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-5">
                        <p className="text-[10px] text-muted-foreground mb-1">{t("results.cost.saved")}</p>
                        <p className="text-2xl font-extrabold text-secondary-500 tabular-nums">${result.cost_saved_usd.toFixed(5)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t("results.cost.unit")}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-5">
                        <p className="text-[10px] text-muted-foreground mb-1">{t("results.cost.perRequest")}</p>
                        <p className="text-2xl font-extrabold text-foreground tabular-nums">${result.cost_usd.toFixed(5)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t("results.cost.unit")}</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-5 space-y-1">
                      <p className="text-xs text-muted-foreground">{t("results.cost.projection")}</p>
                      <p className="text-3xl font-extrabold text-secondary-500 tabular-nums">${monthlySavings}</p>
                      <p className="text-xs text-muted-foreground">{t("results.cost.projectionSaved")}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom CTA strip */}
              <div className="border-t border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center justify-end gap-4">
                <p className="text-xs text-muted-foreground hidden sm:block">{t("cta.headline")}</p>
                <Button variant="cta-secondary" size="sm" asChild>
                  <a href={appUrl("/pricing")}>{t("cta.ctaSecondary")}</a>
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
