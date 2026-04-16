"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  X,
  Archive,
  Reply,
  Loader2,
  CheckCheck,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Send,
  ChevronLeft,
  Paperclip,
  Download,
  FileText,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeDate, formatFullDate } from "@/lib/format-date";

// ─── Gravatar avatar ──────────────────────────────────────────────────────────

function EmailAvatar({
  email,
  name,
  size = 36,
}: {
  email: string;
  name?: string | null;
  size?: number;
}) {
  const initial = (name ?? email).charAt(0).toUpperCase();
  const seed = encodeURIComponent((name ?? email).trim().toLowerCase());
  const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=1B4F82&textColor=ffffff&fontSize=40&fontWeight=600`;

  return (
    <div
      className="rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl}
        alt={name ?? email}
        width={size}
        height={size}
        className="size-full object-cover"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `<span style="font-size:${Math.round(size * 0.38)}px;font-weight:600;color:var(--primary)">${initial}</span>`;
          }
        }}
      />
    </div>
  );
}

interface EmailDetailProps {
  id: string;
  type: "inbox" | "outbox";
  onClose: () => void;
  onArchive?: (id: string) => void;
  onReply?: () => void;
}

interface FullInboxEmail {
  id: string;
  fromEmail: string;
  fromName: string | null;
  toEmail: string;
  subject: string;
  bodyHtml: string | null;
  bodyText: string | null;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  labels: string[];
  createdAt: string;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    r2Key: string;
  }>;
  replies: Array<{
    id: string;
    fromEmail: string;
    fromName: string | null;
    subject: string;
    bodyText: string | null;
    bodyHtml: string | null;
    createdAt: string;
  }>;
}

interface FullOutboxEmail {
  id: string;
  toEmail: string;
  toName: string | null;
  fromEmail: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  openCount: number;
  clickCount: number;
  createdAt: string;
}

// ─── Attachment list ──────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith("image/")) return Image;
  return FileText;
}

function AttachmentList({
  attachments,
}: {
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    r2Key: string;
  }>;
}) {
  function handleDownload(r2Key: string, filename: string) {
    const url = `/api/v1/inbox/attachments/download?key=${encodeURIComponent(r2Key)}&filename=${encodeURIComponent(filename)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }

  return (
    <div className="px-6 pb-4 border-t pt-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        <Paperclip className="size-3" />
        {attachments.length} attachment{attachments.length > 1 ? "s" : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {attachments.map((att) => {
          const Icon = getFileIcon(att.contentType);
          return (
            <button
              key={att.r2Key}
              onClick={() => handleDownload(att.r2Key, att.filename)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30 hover:bg-muted transition-colors text-left group max-w-[200px]"
            >
              <Icon className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{att.filename}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatBytes(att.size)}
                </p>
              </div>
              <Download className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_STEPS = [
  { key: "SENT", icon: Send, label: "Sent", field: "sentAt" },
  {
    key: "DELIVERED",
    icon: CheckCheck,
    label: "Delivered",
    field: "deliveredAt",
  },
  { key: "OPENED", icon: Eye, label: "Opened", field: "openedAt" },
  {
    key: "CLICKED",
    icon: MousePointerClick,
    label: "Clicked",
    field: "clickedAt",
  },
] as const;

export function EmailDetail({
  id,
  type,
  onClose,
  onArchive,
  onReply,
}: EmailDetailProps) {
  const t = useTranslations("inbox");

  const { data, isLoading } = useQuery<FullInboxEmail | FullOutboxEmail>({
    queryKey: ["email-detail", type, id],
    queryFn: () =>
      fetch(`/api/v1/${type === "inbox" ? "inbox" : "outbox"}/${id}`).then(
        (r) => r.json(),
      ),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const isInbox = type === "inbox";
  const email = data as FullInboxEmail & FullOutboxEmail;

  return (
    <div className="flex flex-col md:h-full bg-background">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b bg-background/80 backdrop-blur-sm shrink-0">
        {/* Back — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mr-1"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex-1" />

        {isInbox && onReply && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReply}
            className="gap-1.5 h-7 text-xs"
          >
            <Reply className="size-3.5" />
            {t("actions.reply")}
          </Button>
        )}
        {isInbox && onArchive && !email.isArchived && (
          <button
            onClick={() => onArchive(id)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={t("actions.archive")}
          >
            <Archive className="size-4" />
          </button>
        )}
        {/* Close — desktop only */}
        <button
          onClick={onClose}
          className="hidden md:flex p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* ── Email header ────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4 border-b shrink-0">
        <h2 className="text-lg font-semibold tracking-tight text-foreground mb-3">
          {email.subject}
        </h2>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <EmailAvatar
              email={isInbox ? email.fromEmail : email.toEmail}
              name={isInbox ? email.fromName : email.toName}
              size={36}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {isInbox
                  ? (email.fromName ?? email.fromEmail)
                  : `${t("detail.to")} ${email.toName ?? email.toEmail}`}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {isInbox ? email.fromEmail : email.toEmail}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums pt-0.5">
            {formatFullDate(email.createdAt ?? null)}
          </span>
        </div>
      </div>

      {/* ── Outbox tracking ─────────────────────────────────────────────── */}
      {!isInbox && (
        <div className="px-6 py-3 border-b bg-muted/20 shrink-0">
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_STEPS.map((step, i) => {
              const ts = email[step.field as keyof typeof email] as
                | string
                | null;
              const isBounced =
                email.status === "BOUNCED" || email.status === "FAILED";
              const isActive = !!ts;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center gap-1">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
                      isActive
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 font-medium"
                        : isBounced && i === 0
                          ? "bg-red-500/10 text-red-500 font-medium"
                          : "text-muted-foreground",
                    )}
                  >
                    {isBounced && i === 0 ? (
                      <AlertTriangle className="size-3" />
                    ) : (
                      <Icon className="size-3" />
                    )}
                    <span>{isBounced && i === 0 ? "Bounced" : step.label}</span>
                    {ts && (
                      <span className="opacity-60 font-normal">
                        {formatRelativeDate(ts)}
                      </span>
                    )}
                    {step.key === "OPENED" && email.openCount > 1 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1 py-0 h-4"
                      >
                        ×{email.openCount}
                      </Badge>
                    )}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-px w-4",
                        isActive ? "bg-green-400/50" : "bg-border",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex-1 md:overflow-y-auto scrollbar-none">
        <div className="px-6 py-6">
          {email.bodyHtml ? (
            <div
              className={cn(
                "prose prose-sm max-w-none",
                "dark:prose-invert",
                // Override prose defaults for email content
                "[&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-foreground/80",
                "[&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline",
                "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:not-italic",
                "[&_hr]:border-border",
              )}
              dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            />
          ) : (
            <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">
              {email.bodyText ?? t("detail.noContent")}
            </pre>
          )}
        </div>

        {/* Attachments (inbox only) */}
        {isInbox &&
          (() => {
            const atts = Array.isArray(email.attachments)
              ? email.attachments
              : [];
            return atts.length > 0 ? (
              <AttachmentList attachments={atts} />
            ) : null;
          })()}

        {/* Thread replies */}
        {isInbox && email.replies && email.replies.length > 0 && (
          <div className="px-6 pb-6 space-y-3 border-t pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("detail.thread")} · {email.replies.length}
            </p>
            {email.replies.map((reply) => (
              <div
                key={reply.id}
                className="rounded-lg border bg-muted/20 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <EmailAvatar
                      email={reply.fromEmail}
                      name={reply.fromName}
                      size={24}
                    />
                    <span className="text-xs font-medium">
                      {reply.fromName ?? reply.fromEmail}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeDate(reply.createdAt)}
                  </span>
                </div>
                <div className="px-4 py-3">
                  {reply.bodyHtml ? (
                    <div
                      className="prose prose-xs dark:prose-invert max-w-none [&_p]:text-xs [&_p]:leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: reply.bodyHtml }}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {reply.bodyText}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
