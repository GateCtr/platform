"use client";

import { useTranslations } from "next-intl";
import {
  Send,
  CheckCheck,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/format-date";
import type { OutboxEmailSummary } from "./inbox-dashboard";

interface OutboxEmailListProps {
  emails: OutboxEmailSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; dot: string }
> = {
  QUEUED: { icon: Clock, label: "Queued", dot: "bg-muted-foreground" },
  SENDING: { icon: Clock, label: "Sending", dot: "bg-blue-400" },
  SENT: { icon: Send, label: "Sent", dot: "bg-muted-foreground" },
  DELIVERED: { icon: CheckCheck, label: "Delivered", dot: "bg-green-500" },
  OPENED: { icon: Eye, label: "Opened", dot: "bg-blue-500" },
  CLICKED: { icon: MousePointerClick, label: "Clicked", dot: "bg-primary" },
  BOUNCED: { icon: AlertTriangle, label: "Bounced", dot: "bg-red-500" },
  FAILED: { icon: AlertTriangle, label: "Failed", dot: "bg-red-500" },
};

export function OutboxEmailList({
  emails,
  selectedId,
  onSelect,
}: OutboxEmailListProps) {
  const t = useTranslations("inbox");

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
        <div className="rounded-full bg-muted p-4">
          <Send className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t("empty.sentTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("empty.sent")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {emails.map((email) => {
        const cfg = STATUS_CONFIG[email.status] ?? STATUS_CONFIG.SENT;
        return (
          <div
            key={email.id}
            onClick={() => onSelect(email.id)}
            className={cn(
              "group relative flex flex-col gap-1 px-4 py-3.5 cursor-pointer transition-colors select-none border-l-2",
              selectedId === email.id
                ? "bg-primary/5 border-l-primary"
                : "hover:bg-muted/40 border-l-transparent",
            )}
          >
            {/* Row 1: recipient + date */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate text-muted-foreground">
                {t("outbox.to")} {email.toName ?? email.toEmail}
              </span>
              <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                {formatRelativeDate(email.sentAt ?? email.createdAt)}
              </span>
            </div>

            {/* Row 2: subject */}
            <span className="text-xs font-medium text-foreground truncate">
              {email.subject}
            </span>

            {/* Row 3: preview + status badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground/70 truncate flex-1">
                {email.preview || "—"}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={cn("size-1.5 rounded-full shrink-0", cfg.dot)}
                />
                <span className="text-[11px] text-muted-foreground font-medium">
                  {cfg.label}
                </span>
                {email.openCount > 0 && (
                  <span className="text-[11px] text-muted-foreground/60">
                    · {email.openCount}×
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
