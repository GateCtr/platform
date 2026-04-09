"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProspectsTab } from "./prospects-tab";
import { TemplatesTab } from "./templates-tab";
import { StatsTab } from "./stats-tab";
import type { OutreachStats } from "@/lib/actions/outreach";

// ─── Serialized types (Dates as ISO strings) ──────────────────────────────────

export interface SerializedEmailLog {
  id: string;
  prospectId: string;
  resendId: string | null;
  subject: string;
  step: number;
  status: string;
  trackingId: string;
  targetUrl: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface SerializedProspect {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string | null;
  website: string | null;
  linkedinUrl: string | null;
  tier: string;
  status: string;
  notes: string | null;
  tags: string[];
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
  emailLogs: SerializedEmailLog[];
}

export interface SerializedTemplate {
  id: string;
  step: number;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ActiveFilters {
  search: string;
  statuses: string[];
  tier: string | null;
}

interface OutreachPageClientProps {
  prospects: SerializedProspect[];
  templates: SerializedTemplate[];
  stats: OutreachStats;
}

export function OutreachPageClient({
  prospects: initialProspects,
  templates: initialTemplates,
  stats,
}: OutreachPageClientProps) {
  const t = useTranslations("adminOutreach");

  const [prospects, setProspects] =
    useState<SerializedProspect[]>(initialProspects);
  const [templates, setTemplates] =
    useState<SerializedTemplate[]>(initialTemplates);
  const [selectedProspectIds, setSelectedProspectIds] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    search: "",
    statuses: [],
    tier: null,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProspect, setDialogProspect] =
    useState<SerializedProspect | null>(null);

  function handleProspectUpdate(updated: SerializedProspect) {
    setProspects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    );
  }

  function handleProspectsAdded(newProspects: SerializedProspect[]) {
    setProspects((prev) => [...newProspects, ...prev]);
  }

  function handleTemplateUpdate(updated: SerializedTemplate) {
    setTemplates((prev) =>
      prev.map((tpl) => (tpl.step === updated.step ? updated : tpl)),
    );
  }

  function openSendDialog(prospect: SerializedProspect) {
    setDialogProspect(prospect);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("metadata.title")}
        </h1>
      </div>

      <Tabs defaultValue="prospects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prospects">{t("tabs.prospects")}</TabsTrigger>
          <TabsTrigger value="templates">{t("tabs.templates")}</TabsTrigger>
          <TabsTrigger value="statistics">{t("tabs.statistics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="prospects">
          <ProspectsTab
            prospects={prospects}
            templates={templates}
            selectedIds={selectedProspectIds}
            onSelectionChange={setSelectedProspectIds}
            activeFilters={activeFilters}
            onFiltersChange={setActiveFilters}
            dialogOpen={dialogOpen}
            dialogProspect={dialogProspect}
            onOpenDialog={openSendDialog}
            onCloseDialog={() => {
              setDialogOpen(false);
              setDialogProspect(null);
            }}
            onProspectUpdate={handleProspectUpdate}
            onProspectsAdded={handleProspectsAdded}
          />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab
            templates={templates}
            onTemplateUpdate={handleTemplateUpdate}
          />
        </TabsContent>

        <TabsContent value="statistics">
          <StatsTab stats={stats} prospects={prospects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
