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

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
}

interface EditProjectFormProps {
  project: Project;
  onSaved: (updated?: Partial<Project>) => void;
}

export function EditProjectForm({ project, onSaved }: EditProjectFormProps) {
  const t = useTranslations("projects");
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [color, setColor] = useState(project.color ?? COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.length < 2) return setError(t("form.nameMin"));
    if (name.length > 64) return setError(t("form.nameMax"));

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null, color }),
      });
      if (!res.ok) return setError(t("form.genericError"));
      onSaved({ name, description: description || null, color });
    } catch {
      setError(t("form.genericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="edit-proj-name">{t("form.name")}</Label>
        <Input
          id="edit-proj-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("form.namePlaceholder")}
          maxLength={64}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("form.slug")}</Label>
        <Input
          value={project.slug}
          disabled
          className="font-mono text-sm opacity-60"
        />
        <p className="text-[11px] text-muted-foreground">
          {t("form.slugHint")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-proj-desc">{t("form.description")}</Label>
        <Textarea
          id="edit-proj-desc"
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
          {loading ? t("form.saving") : t("form.save")}
        </Button>
      </div>
    </form>
  );
}
