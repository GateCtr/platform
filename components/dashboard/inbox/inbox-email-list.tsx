"use client";

import { useTranslations } from "next-intl";
import { Star, Archive, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/format-date";
import type { InboxEmailSummary } from "./inbox-dashboard";

interface InboxEmailListProps {
  emails: InboxEmailSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onStar: (id: string, starred: boolean) => void;
  onArchive: (id: string) => void;
}

export function InboxEmailList({
  emails,
  selectedId,
  onSelect,
  onStar,
  onArchive,
}: InboxEmailListProps) {
  const t = useTranslations("inbox");

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
        <div className="rounded-full bg-muted p-4">
          <Inbox className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t("empty.inboxTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("empty.inbox")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {emails.map((email) => (
        <div
          key={email.id}
          onClick={() => onSelect(email.id)}
          className={cn(
            "group relative flex flex-col gap-1 px-4 py-3.5 cursor-pointer transition-colors select-none",
            selectedId === email.id
              ? "bg-primary/5 border-l-2 border-l-primary"
              : "hover:bg-muted/40 border-l-2 border-l-transparent",
            !email.isRead && selectedId !== email.id && "border-l-primary/60",
          )}
        >
          {/* Row 1: sender + date */}
          <div className="flex items-center justify-between gap-2 pr-12">
            <span
              className={cn(
                "text-sm truncate",
                !email.isRead
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground",
              )}
            >
              {email.fromName ?? email.fromEmail}
            </span>
            <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
              {formatRelativeDate(email.createdAt)}
            </span>
          </div>

          {/* Row 2: subject */}
          <span
            className={cn(
              "text-xs truncate",
              !email.isRead
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {email.subject}
          </span>

          {/* Row 3: preview */}
          <span className="text-xs text-muted-foreground/70 truncate leading-relaxed">
            {email.preview || "—"}
          </span>

          {/* Hover actions */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-card/90 backdrop-blur-sm rounded-md border shadow-sm px-1 py-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStar(email.id, !email.isStarred);
              }}
              className={cn(
                "p-1 rounded transition-colors",
                email.isStarred
                  ? "text-amber-400 hover:text-amber-500"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title={email.isStarred ? t("actions.unstar") : t("actions.star")}
            >
              <Star
                className="size-3.5"
                fill={email.isStarred ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(email.id);
              }}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              title={t("actions.archive")}
            >
              <Archive className="size-3.5" />
            </button>
          </div>

          {/* Unread indicator */}
          {!email.isRead && (
            <span className="absolute right-4 top-4 size-1.5 rounded-full bg-primary" />
          )}
        </div>
      ))}
    </div>
  );
}
