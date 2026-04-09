"use client";

import { useState, useTransition } from "react";
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

  const template = templates.find((tpl) => tpl.step === step);

  const previewSubject = template
    ? applyVariableSubstitution(template.subject, prospect, SENDER_NAME)
    : "";

  const previewBody = template
    ? applyVariableSubstitution(template.bodyHtml, prospect, SENDER_NAME)
    : "";

  function handleSend() {
    startTransition(async () => {
      try {
        const result = await sendEmail(prospect.id, step);
        if (result.success) {
          toast.success(t("sendDialog.success"));
          // Optimistically update prospect status if it was NEW
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("sendDialog.title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">
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
            >
              {t("sendDialog.stepLabel", { step: s })}
            </Button>
          ))}
        </div>

        {template ? (
          <Tabs defaultValue="preview" className="mt-2">
            <TabsList>
              <TabsTrigger value="preview">
                {t("sendDialog.preview")}
              </TabsTrigger>
              <TabsTrigger value="raw">HTML</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-3">
              <div className="rounded-md border p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">
                  {t("sendDialog.step")}:{" "}
                  <Badge variant="secondary">{step}</Badge>
                </p>
                <p className="text-sm font-medium">{previewSubject}</p>
              </div>
              <div
                className="rounded-md border p-4 text-sm prose prose-sm max-w-none dark:prose-invert overflow-auto max-h-64"
                dangerouslySetInnerHTML={{ __html: previewBody }}
              />
            </TabsContent>

            <TabsContent value="raw">
              <pre className="rounded-md border p-3 text-xs overflow-auto max-h-64 bg-muted/30 whitespace-pre-wrap">
                {previewBody}
              </pre>
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("errors.templateNotFound")}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t("sendDialog.cancel")}
          </Button>
          <Button onClick={handleSend} disabled={isPending || !template}>
            {isPending ? "…" : t("sendDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
