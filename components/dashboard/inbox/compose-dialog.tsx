"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Send, X, Paperclip, FileText, Image } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { InboxEmailSummary } from "./inbox-dashboard";

// ─── Text → HTML conversion ───────────────────────────────────────────────────

function textToHtml(text: string): string {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs
    .map((block) => {
      const lines = block.split("\n");
      if (lines.every((l) => l.startsWith(">"))) {
        const inner = lines
          .map((l) => escapeHtml(l.replace(/^>\s?/, "")))
          .join("<br>");
        return `<blockquote>${inner}</blockquote>`;
      }
      const html = lines.map((l) => linkify(escapeHtml(l))).join("<br>");
      return `<p>${html}</p>`;
    })
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkify(str: string): string {
  return str.replace(
    /(https?:\/\/[^\s<>"]+)/g,
    '<a href="$1" style="color:#1B4F82">$1</a>',
  );
}

// ─── Attachment types ─────────────────────────────────────────────────────────

interface PendingAttachment {
  file: File;
  key?: string; // R2 key after upload
  uploading: boolean;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ComposeDialogProps {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  replyToId?: string;
  replyToEmail?: InboxEmailSummary;
}

export function ComposeDialog({
  open,
  onClose,
  onSent,
  replyToId,
  replyToEmail,
}: ComposeDialogProps) {
  const t = useTranslations("inbox");
  const isReply = !!replyToEmail;

  const quotedBody = replyToEmail
    ? `\n\n---\nOn ${new Date(replyToEmail.createdAt).toLocaleString()}, ${replyToEmail.fromName ?? replyToEmail.fromEmail} wrote:\n> ${replyToEmail.preview}`
    : "";

  const [to, setTo] = useState(replyToEmail?.fromEmail ?? "");
  const [subject, setSubject] = useState(
    replyToEmail ? `Re: ${replyToEmail.subject}` : "",
  );
  const [body, setBody] = useState(quotedBody);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";

    const newAttachments: PendingAttachment[] = files.map((f) => ({
      file: f,
      uploading: true,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);

    for (const att of newAttachments) {
      try {
        // Upload via server — no CORS issues
        const fd = new FormData();
        fd.append("file", att.file);

        const res = await fetch("/api/v1/inbox/attachments", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const { error: err } = await res.json();
          throw new Error(err ?? "Upload failed");
        }

        const { key } = await res.json();

        setAttachments((prev) =>
          prev.map((a) =>
            a.file === att.file ? { ...a, key, uploading: false } : a,
          ),
        );
      } catch (err) {
        setAttachments((prev) =>
          prev.map((a) =>
            a.file === att.file
              ? {
                  ...a,
                  uploading: false,
                  error: err instanceof Error ? err.message : "Upload failed",
                }
              : a,
          ),
        );
      }
    }
  }

  function removeAttachment(file: File) {
    setAttachments((prev) => prev.filter((a) => a.file !== file));
  }

  async function handleSend() {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setError(t("compose.errorRequired"));
      return;
    }

    // Wait for pending uploads
    if (attachments.some((a) => a.uploading)) {
      setError(t("compose.errorUploading"));
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/outbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          bodyHtml: textToHtml(body),
          bodyText: body,
          inReplyToId: replyToId ?? null,
          attachments: attachments
            .filter((a) => a.key && !a.error)
            .map((a) => ({
              key: a.key,
              filename: a.file.name,
              contentType: a.file.type || "application/octet-stream",
            })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to send");
      }
      setSending(false);
      setTo("");
      setSubject("");
      setBody(quotedBody);
      setAttachments([]);
      setError(null);
      onSent();
    } catch (err) {
      setSending(false);
      setError(err instanceof Error ? err.message : t("compose.errorFailed"));
    }
  }

  function handleClose() {
    if (!sending) {
      setTo(replyToEmail?.fromEmail ?? "");
      setSubject(replyToEmail ? `Re: ${replyToEmail.subject}` : "");
      setBody(quotedBody);
      setError(null);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg sm:max-w-xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b bg-muted/30 space-y-0">
          <DialogTitle className="text-sm font-semibold">
            {isReply ? t("compose.titleReply") : t("compose.title")}
          </DialogTitle>
          <button
            onClick={handleClose}
            disabled={sending}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </DialogHeader>

        {/* Fields */}
        <div className="divide-y divide-border/60">
          {/* To */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">
              {t("compose.to")}
            </span>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={sending || isReply}
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-7 text-sm bg-transparent"
            />
          </div>

          {/* Subject */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">
              {t("compose.subject")}
            </span>
            <Input
              placeholder={t("compose.subjectPlaceholder")}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-7 text-sm bg-transparent"
            />
          </div>
        </div>

        {/* Body */}
        <Textarea
          placeholder={t("compose.bodyPlaceholder")}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={sending}
          className="flex-1 min-h-[160px] max-h-[40vh] resize-none border-0 rounded-none shadow-none focus-visible:ring-0 px-4 py-3 text-sm font-sans leading-relaxed bg-transparent overflow-y-auto"
        />

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t flex flex-wrap gap-2">
            {attachments.map((att) => {
              const isImage = att.file.type.startsWith("image/");
              const Icon = isImage ? Image : FileText;
              return (
                <div
                  key={att.file.name + att.file.size}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-muted/40 text-xs max-w-[180px]"
                >
                  {att.uploading ? (
                    <Loader2 className="size-3 animate-spin text-muted-foreground shrink-0" />
                  ) : att.error ? (
                    <X className="size-3 text-destructive shrink-0" />
                  ) : (
                    <Icon className="size-3 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate flex-1 text-foreground">
                    {att.file.name}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {formatBytes(att.file.size)}
                  </span>
                  <button
                    onClick={() => removeAttachment(att.file)}
                    className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20">
          {error ? (
            <p className="text-xs text-destructive flex-1">{error}</p>
          ) : (
            <div className="flex-1" />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={t("compose.attach")}
            >
              <Paperclip className="size-4" />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={sending}
              className="h-8 text-xs"
            >
              {t("compose.cancel")}
            </Button>
            <Button
              variant="cta-primary"
              size="sm"
              onClick={handleSend}
              disabled={sending}
              className="h-8 text-xs gap-1.5"
            >
              {sending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("compose.sending")}
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  {t("compose.send")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
