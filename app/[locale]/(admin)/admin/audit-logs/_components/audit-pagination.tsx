"use client";

import { DataPagination } from "@/components/ui/data-pagination";

interface AuditPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  locale: string;
  resource?: string;
  status?: string;
  search?: string;
  labels: {
    previous: string;
    next: string;
    morePages: string;
    goPrevious: string;
    goNext: string;
    showing: string;
  };
}

export function AuditPagination({
  page,
  totalPages,
  total,
  pageSize,
  locale,
  resource,
  status,
  search,
  labels,
}: AuditPaginationProps) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (resource) params.set("resource", resource);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    const prefix = locale === "en" ? "" : `/${locale}`;
    return `${prefix}/admin/audit-logs?${params.toString()}`;
  };

  return (
    <DataPagination
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      buildHref={buildHref}
      labels={labels}
    />
  );
}
