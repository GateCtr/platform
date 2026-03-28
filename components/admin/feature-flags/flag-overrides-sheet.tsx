"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Trash2, Plus, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addOverride,
  removeOverride,
} from "@/app/[locale]/(admin)/admin/feature-flags/_actions";

interface Override {
  id: string;
  userId: string;
  enabled: boolean;
  user: { id: string; email: string; name: string | null };
}

interface FlagOverridesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flagId: string;
  flagKey: string;
  overrides: Override[];
  onOverridesChange: (overrides: Override[]) => void;
}

export function FlagOverridesSheet({
  open,
  onOpenChange,
  flagId,
  flagKey,
  overrides,
  onOverridesChange,
}: FlagOverridesSheetProps) {
  const t = useTranslations("adminFeatureFlags");

  const [email, setEmail] = React.useState("");
  const [enabledValue, setEnabledValue] = React.useState<"true" | "false">(
    "true",
  );
  const [adding, setAdding] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    setAddError(null);
    const result = await addOverride(
      flagId,
      email.trim(),
      enabledValue === "true",
    );
    setAdding(false);
    if (!result.success) {
      setAddError(result.error);
      return;
    }
    // Optimistically append — parent will re-fetch on next load
    const newOverride: Override = {
      id: result.data.id,
      userId: result.data.userId,
      enabled: result.data.enabled,
      user: { id: result.data.userId, email: email.trim(), name: null },
    };
    onOverridesChange([newOverride, ...overrides]);
    setEmail("");
    setEnabledValue("true");
  }

  async function handleRemove(overrideId: string) {
    setRemovingId(overrideId);
    const result = await removeOverride(overrideId);
    setRemovingId(null);
    if (!result.success) return;
    onOverridesChange(overrides.filter((o) => o.id !== overrideId));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>{t("overrides.title")}</SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {flagKey}
          </SheetDescription>
        </SheetHeader>

        {/* Add override form */}
        <form onSubmit={handleAdd} className="p-4 border-b flex flex-col gap-3">
          <p className="text-sm font-medium">{t("overrides.add")}</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder={t("overrides.user")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Select
              value={enabledValue}
              onValueChange={(v) => setEnabledValue(v as "true" | "false")}
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t("overrides.enabled")}</SelectItem>
                <SelectItem value="false">{t("overrides.disabled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {addError && <p className="text-xs text-destructive">{addError}</p>}
          <Button
            type="submit"
            size="sm"
            disabled={adding}
            className="self-start"
          >
            {adding ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {t("overrides.add")}
          </Button>
        </form>

        {/* Existing overrides list */}
        <div className="flex-1 overflow-y-auto p-4">
          {overrides.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("overrides.empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {overrides.map((override) => (
                <li
                  key={override.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm truncate">
                      {override.user.email}
                    </span>
                    {override.user.name && (
                      <span className="text-xs text-muted-foreground truncate">
                        {override.user.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={override.enabled ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {override.enabled
                        ? t("overrides.enabled")
                        : t("overrides.disabled")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0 text-muted-foreground hover:text-destructive"
                      disabled={removingId === override.id}
                      onClick={() => handleRemove(override.id)}
                      aria-label={t("overrides.remove")}
                    >
                      {removingId === override.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
