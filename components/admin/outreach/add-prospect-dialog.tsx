"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { UserPlus, Upload, X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createProspect, importProspectsFromCsv } from "@/lib/actions/outreach";
import type { SerializedProspect } from "./outreach-page";

interface AddProspectDialogProps {
  open: boolean;
  onClose: () => void;
  onProspectsAdded: (prospects: SerializedProspect[]) => void;
}

// ─── Manual add form ──────────────────────────────────────────────────────────

function ManualAddForm({
  onSuccess,
}: {
  onSuccess: (p: SerializedProspect) => void;
}) {
  const t = useTranslations("adminOutreach");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
    website: "",
    linkedinUrl: "",
    tier: "TIER_2" as "TIER_1" | "TIER_2",
    notes: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const prospect = await createProspect(form);
        // serialize dates
        const serialized: SerializedProspect = {
          ...prospect,
          lastContactedAt: prospect.lastContactedAt?.toISOString() ?? null,
          createdAt: prospect.createdAt.toISOString(),
          updatedAt: prospect.updatedAt.toISOString(),
          emailLogs: [],
        };
        toast.success(t("addProspect.success"));
        onSuccess(serialized);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("addProspect.error"),
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{t("addProspect.firstName")} *</Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">{t("addProspect.lastName")} *</Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("addProspect.email")} *</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="company">{t("addProspect.company")} *</Label>
        <Input
          id="company"
          value={form.company}
          onChange={(e) => set("company", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="jobTitle">{t("addProspect.jobTitle")}</Label>
          <Input
            id="jobTitle"
            value={form.jobTitle}
            onChange={(e) => set("jobTitle", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tier">{t("addProspect.tier")} *</Label>
          <Select value={form.tier} onValueChange={(v) => set("tier", v)}>
            <SelectTrigger id="tier">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TIER_1">
                {t("prospects.tier.TIER_1")}
              </SelectItem>
              <SelectItem value="TIER_2">
                {t("prospects.tier.TIER_2")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="website">{t("addProspect.website")}</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://"
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="linkedinUrl">{t("addProspect.linkedin")}</Label>
        <Input
          id="linkedinUrl"
          type="url"
          placeholder="https://linkedin.com/in/..."
          value={form.linkedinUrl}
          onChange={(e) => set("linkedinUrl", e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t("addProspect.adding") : t("addProspect.add")}
      </Button>
    </form>
  );
}

// ─── CSV import form ──────────────────────────────────────────────────────────

function CsvImportForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("adminOutreach");
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseCsv(text: string): Array<Record<string, string>> {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCsv(ev.target?.result as string);
        if (parsed.length === 0) {
          setParseError(t("csvImport.emptyFile"));
          setRows([]);
        } else {
          setRows(parsed);
        }
      } catch {
        setParseError(t("csvImport.parseError"));
      }
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (rows.length === 0) return;
    startTransition(async () => {
      try {
        const result = await importProspectsFromCsv(rows);
        toast.success(
          t("csvImport.success", {
            imported: result.imported,
            skipped: result.skipped,
          }),
        );
        onSuccess();
      } catch {
        toast.error(t("csvImport.error"));
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Format hint */}
      <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">
          {t("csvImport.formatTitle")}
        </p>
        <p className="font-mono">{t("csvImport.formatExample")}</p>
        <p>{t("csvImport.formatNote")}</p>
      </div>

      {/* File picker */}
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
        {fileName ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-medium">{fileName}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFileName(null);
                setRows([]);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              <X className="size-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("csvImport.dropzone")}
          </p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {parseError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {parseError}
        </div>
      )}

      {rows.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {t("csvImport.rowsDetected", { count: rows.length })}
        </p>
      )}

      <Button
        className="w-full"
        disabled={rows.length === 0 || isPending}
        onClick={handleImport}
      >
        {isPending
          ? t("csvImport.importing")
          : t("csvImport.import", { count: rows.length })}
      </Button>
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export function AddProspectDialog({
  open,
  onClose,
  onProspectsAdded,
}: AddProspectDialogProps) {
  const t = useTranslations("adminOutreach");

  function handleManualSuccess(prospect: SerializedProspect) {
    onProspectsAdded([prospect]);
    onClose();
  }

  function handleCsvSuccess() {
    // Trigger a full refresh by closing — parent will re-fetch or user can refresh
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4" />
            {t("addProspect.title")}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="manual" className="flex-1">
              {t("addProspect.tabManual")}
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex-1">
              {t("addProspect.tabCsv")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="mt-4">
            <ManualAddForm onSuccess={handleManualSuccess} />
          </TabsContent>
          <TabsContent value="csv" className="mt-4">
            <CsvImportForm onSuccess={handleCsvSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
