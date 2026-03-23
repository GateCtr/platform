"use client";

import { useTranslations } from "next-intl";
import { useState, useRef } from "react";
import { CheckCircle2, Building2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveWorkspace } from "@/app/[locale]/(dashboard)/settings/workspace/_actions";

interface WorkspaceData {
  name: string;
  slug: string;
  usageType: string;
  description: string;
  avatarUrl: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function WorkspaceForm({ initial }: { initial: WorkspaceData }) {
  const t = useTranslations("settingsWorkspace");
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugEdited, setSlugEdited] = useState(false);
  const [usageType, setUsageType] = useState(initial.usageType);
  const [description, setDescription] = useState(initial.description);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState({
    name: initial.name,
    slug: initial.slug,
    usageType: initial.usageType,
    description: initial.description,
    avatarUrl: initial.avatarUrl,
  });
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const isDirty =
    name !== saved.name ||
    slug !== saved.slug ||
    usageType !== saved.usageType ||
    description !== saved.description ||
    avatarUrl !== saved.avatarUrl;

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAvatarUpload(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch("/api/v1/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          scope: "workspace-logos",
        }),
      });
      if (!res.ok) {
        showToast("error", t("errors.upload_failed"));
        return;
      }
      const { uploadUrl, publicUrl } = await res.json();
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        showToast("error", t("errors.upload_failed"));
        return;
      }
      setAvatarUrl(publicUrl);
    } catch {
      showToast("error", t("errors.upload_failed"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("slug", slug);
    fd.set("usageType", usageType);
    fd.set("description", description);
    fd.set("avatarUrl", avatarUrl);
    const res = await saveWorkspace(fd);
    setPending(false);
    if (res.error === "slug_taken") {
      showToast("error", t("errors.slug_taken"));
    } else if (res.error) {
      showToast("error", t("errors.internal_error"));
    } else {
      setSaved({ name, slug, usageType, description, avatarUrl });
      showToast("success", t("actions.saved"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Active workspace banner */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="size-9 rounded-lg object-cover shrink-0 border border-border"
          />
        ) : (
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Building2 className="size-4 text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{name || "—"}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            app.gatectr.com/{slug || "…"}
          </p>
        </div>
      </div>

      {/* Identity section */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("sections.identity")}
        </p>

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="ws-name">{t("fields.name.label")}</Label>
          <Input
            id="ws-name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t("fields.name.placeholder")}
            required
            minLength={2}
          />
          <p className="text-xs text-muted-foreground">
            {t("fields.name.description")}
          </p>
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <Label htmlFor="ws-slug">{t("fields.slug.label")}</Label>
          <div className="flex items-center gap-0 rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
            <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r border-input select-none whitespace-nowrap">
              app.gatectr.com/
            </span>
            <input
              id="ws-slug"
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                );
              }}
              className="flex-1 bg-transparent px-3 py-2 text-sm font-mono outline-none"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("fields.slug.description")}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="ws-description">
            {t("fields.description.label")}
          </Label>
          <Textarea
            id="ws-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("fields.description.placeholder")}
            rows={2}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {t("fields.description.description")}
          </p>
        </div>

        {/* Avatar upload */}
        <div className="space-y-1.5">
          <Label>{t("fields.avatarUrl.label")}</Label>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={name}
                  className="size-16 rounded-xl object-cover border border-border"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-xl bg-muted border border-border">
                  <Building2 className="size-6 text-muted-foreground" />
                </div>
              )}
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-white"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </div>
            {/* Upload button */}
            <div className="space-y-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <Upload className="size-3.5" />
                {uploading
                  ? t("fields.avatarUrl.uploading")
                  : t("fields.avatarUrl.upload")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("fields.avatarUrl.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Usage type */}
        <div className="space-y-1.5">
          <Label>{t("fields.usageType.label")}</Label>
          <Select value={usageType} onValueChange={setUsageType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solo">{t("fields.usageType.solo")}</SelectItem>
              <SelectItem value="team">{t("fields.usageType.team")}</SelectItem>
              <SelectItem value="enterprise">
                {t("fields.usageType.enterprise")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending || !isDirty}
          variant="cta-primary"
        >
          {pending ? t("actions.saving") : t("actions.save")}
        </Button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 shadow-lg text-sm">
          <CheckCircle2
            className={`size-4 shrink-0 ${toast.type === "success" ? "text-emerald-500" : "text-destructive"}`}
          />
          {toast.msg}
        </div>
      )}
    </form>
  );
}
