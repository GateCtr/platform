"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/app/[locale]/(dashboard)/settings/profile/_actions";
import { TriangleAlert } from "lucide-react";

interface DeleteAccountDialogProps {
  email: string;
}

export function DeleteAccountDialog({ email }: DeleteAccountDialogProps) {
  const t = useTranslations("settingsProfile.deleteAccount");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const isMatch = input.trim().toLowerCase() === email.toLowerCase();

  function handleDelete() {
    if (!isMatch) return;
    startTransition(async () => {
      await deleteAccount();
      // Clerk session is gone — hard redirect to home
      window.location.href = "/";
    });
  }

  function handleOpenChange(val: boolean) {
    if (!val) setInput("");
    setOpen(val);
  }

  // Translated consequences array
  const consequences = t.raw("consequences") as string[];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="cta-danger" size="sm" className="shrink-0">
          {t("trigger")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex size-8 items-center justify-center rounded-full bg-destructive/10">
              <TriangleAlert className="size-4 text-destructive" />
            </div>
            <DialogTitle>{t("title")}</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p>{t("description")}</p>
              <ul className="space-y-1.5">
                {consequences.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-1.5 rounded-full bg-destructive shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="confirm-email" className="text-sm">
            {t("confirmLabel")}
          </Label>
          <Input
            id="confirm-email"
            type="email"
            placeholder={email}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            aria-invalid={input.length > 0 && !isMatch}
          />
          {input.length > 0 && !isMatch && (
            <p className="text-xs text-destructive">{t("confirmMismatch")}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="cta-danger"
            onClick={handleDelete}
            disabled={!isMatch || isPending}
          >
            {isPending ? t("deleting") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
