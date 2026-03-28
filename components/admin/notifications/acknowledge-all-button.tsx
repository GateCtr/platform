"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acknowledgeAllAlerts } from "@/app/[locale]/(admin)/admin/notifications/_actions";

interface AcknowledgeAllButtonProps {
  count: number;
  onAcknowledgedAll: () => void;
}

export function AcknowledgeAllButton({
  count,
  onAcknowledgedAll,
}: AcknowledgeAllButtonProps) {
  const t = useTranslations("adminNotifications.unacknowledged");
  const [loading, setLoading] = React.useState(false);

  async function handleAcknowledgeAll() {
    setLoading(true);
    try {
      const result = await acknowledgeAllAlerts();
      if (result.success) {
        toast.success(t("acknowledgeAllSuccess", { count: result.data.count }));
        onAcknowledgedAll();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("acknowledgeAllError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-2"
      disabled={loading || count === 0}
      onClick={handleAcknowledgeAll}
    >
      <CheckCheck className="size-4" />
      {loading ? t("acknowledging") : t("acknowledgeAll")}
    </Button>
  );
}
