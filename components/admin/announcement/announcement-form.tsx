"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnnouncementConfig } from "@/lib/announcement-types";

const schema = z.object({
  enabled: z.boolean(),
  message: z.string().min(1, "Required").max(200),
  messageFr: z.string().max(200).optional(),
  cta: z.string().max(50).optional(),
  ctaFr: z.string().max(50).optional(),
  ctaHref: z.string().max(200).optional(),
  variant: z.enum(["info", "warning", "success", "promo"]),
  dismissable: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const VARIANT_PREVIEW: Record<string, string> = {
  info: "bg-secondary-500/10 border-secondary-500/20 text-secondary-600",
  warning: "bg-warning-500/10 border-warning-500/20 text-warning-600",
  success: "bg-success-500/10 border-success-500/20 text-success-600",
  promo:
    "bg-linear-to-r from-primary/10 via-secondary-500/10 to-primary/10 border-primary/20 text-foreground",
};

interface Props {
  flag: { id: string; enabled: boolean; description: string | null } | null;
}

export function AnnouncementForm({ flag }: Props) {
  const [saved, setSaved] = useState(false);

  const existing = flag?.description
    ? (JSON.parse(flag.description) as Partial<AnnouncementConfig>)
    : null;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      enabled: flag?.enabled ?? false,
      message: existing?.message ?? "",
      messageFr: existing?.messageFr ?? "",
      cta: existing?.cta ?? "",
      ctaFr: existing?.ctaFr ?? "",
      ctaHref: existing?.ctaHref ?? "",
      variant: existing?.variant ?? "info",
      dismissable: existing?.dismissable ?? true,
    },
  });

  const { isSubmitting } = form.formState;
  const values = form.watch();

  async function onSubmit(data: FormValues) {
    const res = await fetch("/api/admin/announcement", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Enable toggle */}
        <Card>
          <CardContent className="pt-5">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      Show announcement bar
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Displays on all marketing pages when enabled.
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Message */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>English</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Now in beta — 2,000 developers already saving on LLM costs."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="messageFr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    French{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="En bêta — 2 000 développeurs économisent déjà."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* CTA */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Call to action{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTA label (EN)</FormLabel>
                    <FormControl>
                      <Input placeholder="Join the waitlist" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ctaFr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTA label (FR)</FormLabel>
                    <FormControl>
                      <Input placeholder="Rejoindre la liste" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="ctaHref"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CTA link</FormLabel>
                  <FormControl>
                    <Input placeholder="/waitlist" {...field} />
                  </FormControl>
                  <FormDescription>Internal path or full URL.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Style */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Style</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="variant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="info">Info (cyan)</SelectItem>
                      <SelectItem value="success">Success (green)</SelectItem>
                      <SelectItem value="warning">Warning (orange)</SelectItem>
                      <SelectItem value="promo">Promo (gradient)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dismissable"
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Dismissable</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Show a close button. Dismissed state saved in browser.
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Preview */}
        {values.message && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="size-3.5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden rounded-b-xl">
              <div
                className={cn(
                  "w-full border-b px-4 py-2 text-xs text-center flex items-center justify-center gap-3 relative",
                  VARIANT_PREVIEW[values.variant] ?? VARIANT_PREVIEW.info,
                )}
              >
                <span className="font-medium">{values.message}</span>
                {values.cta && values.ctaHref && (
                  <span className="underline underline-offset-2 shrink-0">
                    {values.cta} →
                  </span>
                )}
                {values.dismissable && (
                  <span className="absolute right-3 text-muted-foreground text-[10px]">
                    ✕
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            Save
          </Button>
          {saved && (
            <Badge
              variant="outline"
              className="text-success-500 border-success-500/30"
            >
              Saved
            </Badge>
          )}
        </div>
      </form>
    </Form>
  );
}
