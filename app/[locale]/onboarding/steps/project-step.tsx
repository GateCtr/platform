"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  AlertCircle,
  FolderOpen,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RequiredFormLabel } from "@/components/shared/required-form-label";
import { cn } from "@/lib/utils";
import { createFirstProject } from "../_actions";

type ProjectValues = { projectName: string };

interface ProjectStepProps {
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
  isFinishing?: boolean;
}

const EXAMPLE_NAMES = ["My API", "Production App", "AI Assistant", "Chat Bot"];

export function ProjectStep({
  onComplete,
  onSkip,
  onBack,
  isFinishing = false,
}: ProjectStepProps) {
  const t = useTranslations("onboarding.project");
  const tNav = useTranslations("onboarding.nav");

  const schema = z.object({
    projectName: z
      .string()
      .min(1, t("errors.required"))
      .min(2, t("errors.minLength")),
  });

  const form = useForm<ProjectValues>({
    resolver: zodResolver(schema),
    defaultValues: { projectName: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: ProjectValues) {
    const fd = new FormData();
    fd.set("projectName", values.projectName);
    const res = await createFirstProject(fd);
    if (res?.error) {
      const msg =
        res.error === "quota_exceeded"
          ? t("errors.quotaExceeded")
          : t("errors.failed");
      form.setError("root", { message: msg });
      return;
    }
    onComplete();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Visual hint card */}
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/3 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("projectName.hint")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("projectName.hintSub")}
              </p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="projectName"
          render={({ field }) => (
            <FormItem>
              <RequiredFormLabel required>
                {t("projectName.label")}
              </RequiredFormLabel>
              <FormControl>
                <Input
                  placeholder={t("projectName.placeholder")}
                  autoFocus
                  className="h-11 text-base"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("projectName.description")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quick suggestions */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            {t("suggestions.label")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  form.setValue("projectName", name, { shouldValidate: true })
                }
                className={cn(
                  "rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground",
                  "hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-colors",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Finish CTA — accent to signal this is the final step */}
        <Button
          type="submit"
          variant="cta-accent"
          size="lg"
          className="w-full group"
          disabled={isSubmitting || isFinishing}
        >
          {isSubmitting || isFinishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isFinishing ? t("finishing") : t("submitting")}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t("submit")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="cta-ghost"
            size="sm"
            className="flex-1"
            onClick={onBack}
          >
            {tNav("back")}
          </Button>
          <Button
            type="button"
            variant="cta-ghost"
            size="sm"
            className="flex-1"
            onClick={onSkip}
          >
            {t("skip")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
