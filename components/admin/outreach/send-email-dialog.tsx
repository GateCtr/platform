"use client";

import { useState, useTransition } from "react";
import DOMPurify from "dompurify";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sendEmail } from "@/lib/actions/outreach";
import { applyVariableSubstitution } from "@/lib/outreach-utils";
import type { SerializedProspect, SerializedTemplate } from "./outreach-page";

interface SendEmailDialogProps {
  open: boolean;
  prospect: SerializedProspect;
  templates: SerializedTemplate[];
  onClose: () => void;
  onProspectUpdate: (p: SerializedProspect) => void;
}

const SENDER_NAME =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_OUTREACH_SENDER_NAME ?? "GateCtr Team")
    : "GateCtr Team";

export function SendEmailDialog({
  open,
  prospect,
  templates,
  onClose,
  onProspectUpdate,
}: SendEmailDialogProps) {
  const t = useTranslations("adminOutreach");
  const [step, setStep] = useState<number>(1);
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState("preview");

  const template = templates.find((tpl) => tpl.step === step);

  const resolvedSubject = template
    ? applyVariableSubstitution(template.subject, prospect, SENDER_NAME)
    : "";
  const resolvedBody = template
    ? applyVariableSubstitution(template.bodyHtml, prospect, SENDER_NAME)
    : "";

  // Track last rendered step to reset editable fields on step change
  const [lastStep, setLastStep] = useState(step);
  const [editSubject, setEditSubject] = useState(resolvedSubject);
  const [editBody, setEditBody] = useState(resolvedBody);

  if (lastStep !== step) {
    setLastStep(step);
    setEditSubject(resolvedSubject);
    setEditBody(resolvedBody);
  }

  function handleSend() {
    startTransition(async () => {
      try {
        const result = await sendEmail(prospect.id, step, {
          subject: editSubject,
          bodyHtml: editBody,
        });
        if (result.success) {
          toast.success(t("sendDialog.success"));
          if (prospect.status === "NEW") {
            onProspectUpdate({
              ...prospect,
              status: "CONTACTED",
              lastContactedAt: new Date().toISOString(),
            });
          }
          onClose();
        } else {
          toast.error(result.error ?? t("sendDialog.error"));
        }
      } catch {
        toast.error(t("sendDialog.error"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>{t("sendDialog.title")}</DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground break-all">
              {prospect.firstName} {prospect.lastName} &lt;{prospect.email}&gt;
            </p>
          </DialogHeader>

          {/* Step selector */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={step === s ? "default" : "outline"}
                onClick={() => setStep(s)}
                className="flex-1 sm:flex-none"
              >
                {t("sendDialog.stepLabel", { step: s })}
              </Button>
            ))}
          </div>

          {template ? (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="preview" className="flex-1 sm:flex-none">
                  {t("sendDialog.preview")}
                </TabsTrigger>
                <TabsTrigger value="edit" className="flex-1 sm:flex-none">
                  {t("sendDialog.edit")}
                </TabsTrigger>
                <TabsTrigger value="raw" className="flex-1 sm:flex-none">
                  HTML
                </TabsTrigger>
              </TabsList>

              {/* Preview — rendered from editSubject/editBody (sanitized) */}
              <TabsContent value="preview" className="space-y-3 mt-2">
                <div className="rounded-md border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("sendDialog.step")}:{" "}
                    <Badge variant="secondary">{step}</Badge>
                  </p>
                  <p className="text-sm font-medium">{editSubject}</p>
                </div>
                <div
                  className="rounded-md border p-3 sm:p-4 text-sm prose prose-sm max-w-none dark:prose-invert overflow-auto max-h-48 sm:max-h-64"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(editBody, {
                      USE_PROFILES: { html: true },
                    }),
                  }}
                />
              </TabsContent>

              {/* Edit — subject + body textarea */}
              <TabsContent value="edit" className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t("sendDialog.subjectLabel")}
                  </Label>
                  <Input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("sendDialog.bodyLabel")}</Label>
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={10}
                    className="text-xs font-mono resize-y max-h-64"
                  />
                </div>
              </TabsContent>

              {/* Raw HTML read-only */}
              <TabsContent value="raw" className="mt-2">
                <pre className="rounded-md border p-3 text-xs overflow-auto max-h-48 sm:max-h-64 bg-muted/30 whitespace-pre-wrap">
                  {editBody}
                </pre>
              </TabsContent>
            </Tabs>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("errors.templateNotFound")}
            </p>
          )}
        </div>

        <DialogFooter className="border-t px-4 py-3 sm:px-6 flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            {t("sendDialog.cancel")}
          </Button>
          <Button
            onClick={handleSend}
            disabled={isPending || !template}
            className="flex-1 sm:flex-none"
          >
            {isPending ? "…" : t("sendDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
