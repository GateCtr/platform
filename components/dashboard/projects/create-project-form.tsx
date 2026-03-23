"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const COLORS = [
  "#1B4F82",
  "#0E7490",
  "#065F46",
  "#7C3AED",
  "#B45309",
  "#BE185D",
  "#DC2626",
  "#374151",
];

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

interface CreateProjectFormProps {
  onCreated: () => void;
}

export function CreateProjectForm({ onCreated }: CreateProjectFormProps) {
  const t = useTranslations("projects");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [slugManual, setSlugManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(v: string) {
    setName(v);
    if (!slugManual) setSlug(slugify(v));
  }

  function handleSlugChange(v: string) {
    setSlugManual(true);
    setSlug(
      v
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-"),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.length < 2) return setError(t("form.nameMin"));
    if (slug.length < 2) return setError(t("form.slugMin"));
    if (!/^[a-z0-9-]+$/.test(slug)) return setError(t("form.slugInvalid"));

    setLoading(true);
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description: description || undefined,
          color,
        }),
      });
      if (res.status === 409) return setError(t("form.slugTaken"));
      if (!res.ok) return setError(t("form.genericError"));
      onCreated();
    } catch {
      setError(t("form.genericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="proj-name">{t("form.name")}</Label>
        <Input
          id="proj-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={t("form.namePlaceholder")}
          maxLength={64}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="proj-slug">{t("form.slug")}</Label>
        <Input
          id="proj-slug"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder={t("form.slugPlaceholder")}
          maxLength={48}
          required
          className="font-mono text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          {t("form.slugHint")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="proj-desc">{t("form.description")}</Label>
        <Textarea
          id="proj-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("form.descriptionPlaceholder")}
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("form.color")}</Label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="size-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor:
                  color === c ? "hsl(var(--foreground))" : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          variant="cta-primary"
          size="sm"
          disabled={loading}
        >
          {loading ? t("form.creating") : t("form.create")}
        </Button>
      </div>
    </form>
  );
}
