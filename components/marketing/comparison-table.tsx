"use client";

import { useTranslations } from "next-intl";
import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type CellValue = "yes" | "no" | "partial" | string;

const COLS = ["gatectr", "direct", "openrouter", "langsmith"] as const;

const ROWS: { key: string; cells: Record<(typeof COLS)[number], CellValue> }[] =
  [
    {
      key: "budget",
      cells: { gatectr: "yes", direct: "no", openrouter: "partial", langsmith: "partial" },
    },
    {
      key: "optimizer",
      cells: { gatectr: "yes", direct: "no", openrouter: "no", langsmith: "no" },
    },
    {
      key: "routing",
      cells: { gatectr: "yes", direct: "no", openrouter: "yes", langsmith: "no" },
    },
    {
      key: "analytics",
      cells: { gatectr: "yes", direct: "no", openrouter: "partial", langsmith: "yes" },
    },
    {
      key: "codeChanges",
      cells: { gatectr: "yes", direct: "no", openrouter: "yes", langsmith: "no" },
    },
    {
      key: "price",
      cells: { gatectr: "free", direct: "tokens", openrouter: "markup", langsmith: "paid" },
    },
  ];

function Cell({ value, t }: { value: CellValue; t: (k: string) => string }) {
  if (value === "yes")
    return <Check className="size-4 text-secondary-500 mx-auto" />;
  if (value === "no")
    return <X className="size-4 text-muted-foreground/40 mx-auto" />;
  if (value === "partial")
    return <Minus className="size-4 text-warning-500 mx-auto" />;
  return (
    <span className="text-xs text-muted-foreground">{t(`cell.${value}`)}</span>
  );
}

export function ComparisonTable() {
  const t = useTranslations("comparison");

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-mono text-secondary-500 uppercase tracking-widest mb-3">
            {t("label")}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("headline")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("description")}
          </p>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-4 font-medium text-muted-foreground w-1/3">
                  {t("colFeature")}
                </th>
                {COLS.map((col) => (
                  <th
                    key={col}
                    className={cn(
                      "px-4 py-4 text-center font-semibold text-sm",
                      col === "gatectr"
                        ? "bg-primary/5 text-primary border-x border-primary/20"
                        : "text-foreground/70",
                    )}
                  >
                    {col === "gatectr" && (
                      <span className="block text-[10px] font-normal text-secondary-500 mb-0.5">
                        ✦
                      </span>
                    )}
                    {t(`col.${col}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.key}
                  className={cn(
                    "border-b border-border last:border-0",
                    i % 2 === 0 ? "bg-card" : "bg-muted/10",
                  )}
                >
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {t(`row.${row.key}`)}
                  </td>
                  {COLS.map((col) => (
                    <td
                      key={col}
                      className={cn(
                        "px-4 py-3.5 text-center",
                        col === "gatectr" ? "bg-primary/5 border-x border-primary/20" : "",
                      )}
                    >
                      <Cell value={row.cells[col]} t={t} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground/50 text-center mt-4">
          {t("footnote")}
        </p>
      </div>
    </section>
  );
}
