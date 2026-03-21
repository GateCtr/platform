"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Building2,
  Users,
  Briefcase,
  CheckCircle2,
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
import { AlertCircle } from "lucide-react";
import { RequiredFormLabel } from "@/components/shared/required-form-label";
import { cn } from "@/lib/utils";
import { createWorkspace } from "../_actions";
import type { UsageType } from "@/types/onboarding";

type WorkspaceValues = { workspaceName: string; usageType: UsageType };

const USAGE_OPTIONS: {
  value: UsageType;
  icon: React.ElementType;
  labelKey: string;
  descKey: string;
}[] = [
  { value: "solo", icon: Briefcase, labelKey: "solo", descKey: "soloDesc" },
  { value: "team", icon: Users, labelKey: "team", descKey: "teamDesc" },
  {
    value: "enterprise",
    icon: Building2,
    labelKey: "enterprise",
    descKey: "enterpriseDesc",
  },
];

interface WorkspaceStepProps {
  onComplete: () => void;
}

export function WorkspaceStep({ onComplete }: WorkspaceStepProps) {
  const t = useTranslations("onboarding.workspace");

  const schema = z.object({
    workspaceName: z
      .string()
      .min(1, t("errors.required"))
      .min(2, t("errors.minLength")),
    usageType: z.enum(["solo", "team", "enterprise"]),
  });

  const form = useForm<WorkspaceValues>({
    resolver: zodResolver(schema),
    defaultValues: { workspaceName: "", usageType: "solo" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: WorkspaceValues) {
    const fd = new FormData();
    fd.set("workspaceName", values.workspaceName);
    fd.set("usageType", values.usageType);
    const res = await createWorkspace(fd);
    if (res?.error) {
      form.setError("root", { message: t("errors.failed") });
      return;
    }
    onComplete();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="workspaceName"
          render={({ field }) => (
            <FormItem>
              <RequiredFormLabel required>
                {t("workspaceName.label")}
              </RequiredFormLabel>
              <FormControl>
                <Input
                  placeholder={t("workspaceName.placeholder")}
                  autoFocus
                  className="h-11 text-base"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("workspaceName.hint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="usageType"
          render={({ field }) => (
            <FormItem>
              <RequiredFormLabel>{t("usageType.label")}</RequiredFormLabel>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {USAGE_OPTIONS.map(
                  ({ value, icon: Icon, labelKey, descKey }) => {
                    const selected = field.value === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        className={cn(
                          "relative flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-all duration-200",
                          selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent/30",
                        )}
                      >
                        {selected && (
                          <CheckCircle2 className="absolute top-2 right-2 h-3.5 w-3.5 text-primary" />
                        )}
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                            selected ? "bg-primary/10" : "bg-muted",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4.5 w-4.5",
                              selected
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            "font-medium text-xs leading-tight text-center",
                            selected ? "text-primary" : "text-foreground",
                          )}
                        >
                          {t(`usageType.${labelKey}`)}
                        </span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">
                          {t(`usageType.${descKey}`)}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          variant="cta-primary"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("submit")}
        </Button>
      </form>
    </Form>
  );
}
