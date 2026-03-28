import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { AuditFilters } from "./_components/audit-filters";
import { AuditRowDetail } from "./_components/audit-row-detail";
import { AuditPagination } from "./_components/audit-pagination";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "adminAuditLogs.metadata",
  });
  return { title: t("title"), description: t("description") };
}

const PAGE_SIZE = 25;

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchLogs({
  page,
  resource,
  status,
  search,
  actor,
  action,
  from,
  to,
}: {
  page: number;
  resource?: string;
  status?: string;
  search?: string;
  actor?: string;
  action?: string;
  from?: string;
  to?: string;
}) {
  // Resolve actor email → actorId
  let actorId: string | undefined;
  if (actor) {
    const actorUser = await prisma.user.findFirst({
      where: { email: { contains: actor, mode: "insensitive" } },
      select: { id: true },
    });
    if (!actorUser) {
      return { logs: [], total: 0, resources: [] as string[] };
    }
    actorId = actorUser.id;
  }

  const where = {
    ...(resource ? { resource } : {}),
    ...(status === "success"
      ? { success: true }
      : status === "failed"
        ? { success: false }
        : {}),
    ...(search
      ? { user: { email: { contains: search, mode: "insensitive" as const } } }
      : {}),
    ...(actorId ? { actorId } : {}),
    ...(action
      ? { action: { contains: action, mode: "insensitive" as const } }
      : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [rawLogs, total, distinctResources] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
    prisma.auditLog.count({ where }),
    // Get distinct resource values for the filter dropdown
    prisma.auditLog.findMany({
      select: { resource: true },
      distinct: ["resource"],
      orderBy: { resource: "asc" },
    }),
  ]);

  // For logs where userId is null but actorId is set, resolve the actor as the display user
  const orphanActorIds = [
    ...new Set(
      rawLogs
        .filter((l) => !l.user && l.actorId)
        .map((l) => l.actorId as string),
    ),
  ];
  const actorMap = new Map<
    string,
    { id: string; email: string; name: string | null }
  >();
  if (orphanActorIds.length > 0) {
    const actors = await prisma.user.findMany({
      where: { id: { in: orphanActorIds } },
      select: { id: true, email: true, name: true },
    });
    actors.forEach((a) => actorMap.set(a.id, a));
  }

  const logs = rawLogs.map((l) => ({
    ...l,
    user: l.user ?? (l.actorId ? (actorMap.get(l.actorId) ?? null) : null),
  }));

  return {
    logs,
    total,
    resources: distinctResources.map((r) => r.resource),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AuditLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    resource?: string;
    status?: string;
    search?: string;
    actor?: string;
    action?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  const page = Math.max(1, Number(sp.page ?? 1));
  const resource = sp.resource || undefined;
  const status = sp.status || undefined;
  const search = sp.search || undefined;
  const actor = sp.actor || undefined;
  const action = sp.action || undefined;
  const from = sp.from || undefined;
  const to = sp.to || undefined;

  const [t, tc, { logs, total, resources }] = await Promise.all([
    getTranslations({ locale, namespace: "adminAuditLogs" }),
    getTranslations({ locale, namespace: "common.pagination" }),
    fetchLogs({ page, resource, status, search, actor, action, from, to }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!(resource || status || search || actor || action || from || to);

  // Build export URL with current filters
  const exportParams = new URLSearchParams();
  if (resource) exportParams.set("resource", resource);
  if (status) exportParams.set("status", status);
  if (search) exportParams.set("search", search);
  if (actor) exportParams.set("actor", actor);
  if (action) exportParams.set("action", action);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);
  const exportHref = `/api/admin/audit-logs?${exportParams.toString()}`;

  const detailLabels = {
    statusSuccess: t("status.success"),
    statusFailed: t("status.failed"),
    detailTitle: t("detail.title"),
    id: t("detail.id"),
    timestamp: t("detail.timestamp"),
    user: t("detail.user"),
    actor: t("detail.actor"),
    resource: t("detail.resource"),
    action: t("detail.action"),
    resourceId: t("detail.resourceId"),
    ip: t("detail.ip"),
    userAgent: t("detail.userAgent"),
    error: t("detail.error"),
    oldValue: t("detail.oldValue"),
    newValue: t("detail.newValue"),
    noData: t("detail.noData"),
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Badge variant="outline" className="text-xs tabular-nums">
          {t("entries", { count: total.toLocaleString() })}
        </Badge>
      </div>

      {/* Filters */}
      <AuditFilters
        resources={resources}
        exportHref={exportHref}
        labels={{
          search: t("filters.search"),
          resource: t("filters.resource"),
          status: t("filters.status"),
          statusAll: t("status.all"),
          statusSuccess: t("status.success"),
          statusFailed: t("status.failed"),
          actor: t("filters.actor"),
          action: t("filters.action"),
          dateRange: t("filters.dateRange"),
          dateFrom: t("filters.dateFrom"),
          dateTo: t("filters.dateTo"),
          applyDateRange: t("filters.applyDateRange"),
          clearDateRange: t("filters.clearDateRange"),
          clearAll: t("filters.clearAll"),
          export: t("filters.export"),
        }}
      />

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[160px]">
                  {t("table.timestamp")}
                </TableHead>
                <TableHead className="w-[180px]">{t("table.user")}</TableHead>
                <TableHead className="w-[120px]">
                  {t("table.resource")}
                </TableHead>
                <TableHead>{t("table.action")}</TableHead>
                <TableHead className="text-right w-[100px]">
                  {t("table.status")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground text-sm"
                  >
                    {hasFilters ? t("emptyFiltered") : t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <AuditRowDetail
                    key={log.id}
                    log={{
                      ...log,
                      createdAt: log.createdAt.toISOString(),
                    }}
                    labels={detailLabels}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <AuditPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          locale={locale}
          resource={resource}
          status={status}
          search={search}
          actor={actor}
          action={action}
          from={from}
          to={to}
          labels={{
            previous: tc("previous"),
            next: tc("next"),
            morePages: tc("morePages"),
            goPrevious: tc("goPrevious"),
            goNext: tc("goNext"),
            showing: tc.raw("showing") as string,
          }}
        />
      )}
    </div>
  );
}
