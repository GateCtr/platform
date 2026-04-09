"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { updateTemplate } from "@/lib/actions/outreach";
import { applyVariableSubstitution } from "@/lib/outreach-utils";
import type { SerializedTemplate } from "./outreach-page";

// ─── Sample prospect for live preview ────────────────────────────────────────

const SAMPLE_PROSPECT = {
  firstName: "Alex",
  lastName: "Martin",
  company: "Acme AI",
  jobTitle: "CTO",
};
const SAMPLE_SENDER = "GateCtr Team";

// ─── Single template card ─────────────────────────────────────────────────────

interface TemplateCardProps {
  template: SerializedTemplate;
  onUpdate: (updated: SerializedTemplate) => void;
}

function TemplateCard({ template, onUpdate }: TemplateCardProps) {
  const t = useTranslations("adminOutreach");
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState(template.subject);
  const [bodyHtml, setBodyHtml] = useState(template.bodyHtml);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const previewSubject = applyVariableSubstitution(
    subject,
    SAMPLE_PROSPECT,
    SAMPLE_SENDER,
  );
  const previewBody = applyVariableSubstitution(
    bodyHtml,
    SAMPLE_PROSPECT,
    SAMPLE_SENDER,
  );

  function insertVariable(variable: string) {
    const el = bodyRef.current;
    if (!el) {
      setBodyHtml((prev) => prev + `{{${variable}}}`);
      return;
    }
    const start = el.selectionStart ?? bodyHtml.length;
    const end = el.selectionEnd ?? bodyHtml.length;
    const next =
      bodyHtml.slice(0, start) + `{{${variable}}}` + bodyHtml.slice(end);
    setBodyHtml(next);
    // Restore cursor after the inserted text
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + variable.length + 4; // 4 = {{ + }}
      el.setSelectionRange(pos, pos);
    });
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const updated = await updateTemplate(template.step, {
          subject,
          bodyHtml,
        });
        onUpdate({
          ...template,
          subject: updated.subject,
          bodyHtml: updated.bodyHtml,
          updatedAt: updated.updatedAt.toString(),
        });
        toast.success(t("templates.success"));
      } catch {
        toast.error(t("templates.error"));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("templates.step", { step: template.step })}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {template.name}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">{t("templates.preview")}</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4 pt-2">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor={`subject-${template.step}`}>
                {t("templates.subject")}
              </Label>
              <Input
                id={`subject-${template.step}`}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <Label htmlFor={`body-${template.step}`}>
                {t("templates.body")}
              </Label>
              <Textarea
                id={`body-${template.step}`}
                ref={bodyRef}
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
            </div>

            {/* Variable badges */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                {t("templates.variables")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {template.variables.map((v) => (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => insertVariable(v)}
                  >
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="pt-2 space-y-3">
            <div className="rounded-md border p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">
                {t("templates.subject")}
              </p>
              <p className="text-sm font-medium">{previewSubject}</p>
            </div>
            <div
              className="rounded-md border p-4 text-sm prose prose-sm max-w-none dark:prose-invert overflow-auto max-h-64"
              dangerouslySetInnerHTML={{ __html: previewBody }}
            />
            <p className="text-xs text-muted-foreground">
              {t("templates.sampleData")}: {SAMPLE_PROSPECT.firstName}{" "}
              {SAMPLE_PROSPECT.lastName}, {SAMPLE_PROSPECT.company}
            </p>
          </TabsContent>
        </Tabs>

        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? "…" : t("templates.save")}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Templates tab ────────────────────────────────────────────────────────────

interface TemplatesTabProps {
  templates: SerializedTemplate[];
  onTemplateUpdate: (updated: SerializedTemplate) => void;
}

export function TemplatesTab({
  templates,
  onTemplateUpdate,
}: TemplatesTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-1">
      {templates.map((tpl) => (
        <TemplateCard
          key={tpl.step}
          template={tpl}
          onUpdate={onTemplateUpdate}
        />
      ))}
    </div>
  );
}
