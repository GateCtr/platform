"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RangeOption } from "./analytics-date-range-picker";

interface ExportButtonProps {
  range: RangeOption;
}

export function ExportButton({ range }: ExportButtonProps) {
  const t = useTranslations("adminAnalytics.export");
  const [isExporting, setIsExporting] = React.useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/analytics?export=csv&range=${range}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        `analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="size-3.5 mr-1.5" />
      {isExporting ? t("exporting") : t("button")}
    </Button>
  );
}
