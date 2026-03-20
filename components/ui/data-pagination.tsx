"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaginationLabels {
  previous: string;
  next: string;
  morePages: string;
  goPrevious: string;
  goNext: string;
  /** e.g. "Showing {from}–{to} of {total}" — pass the formatted string */
  showing: string;
}

/** Client-side mode: calls onPageChange */
interface DataPaginationClientProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  labels: PaginationLabels;
  onPageChange: (page: number) => void;
  buildHref?: never;
  /** Compact mode: shows only Prev/Next + counter, no page numbers */
  compact?: boolean;
}

/** Server-side mode: builds href strings */
interface DataPaginationServerProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  labels: PaginationLabels;
  buildHref: (page: number) => string;
  onPageChange?: never;
  /** Compact mode: shows only Prev/Next + counter, no page numbers */
  compact?: boolean;
}

type DataPaginationProps =
  | DataPaginationClientProps
  | DataPaginationServerProps;

// ─── Page range builder ───────────────────────────────────────────────────────

function buildPageRange(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | null)[] = [];
  const seen = new Set<number>();
  const addPage = (p: number) => {
    if (!seen.has(p)) {
      seen.add(p);
      pages.push(p);
    }
  };

  addPage(1);
  if (current > 3) pages.push(null);

  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  ) {
    addPage(p);
  }

  if (current < total - 2) pages.push(null);
  addPage(total);

  return pages;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataPagination({
  page,
  totalPages,
  total,
  pageSize,
  labels,
  onPageChange,
  buildHref,
  compact = false,
}: DataPaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const range = buildPageRange(page, totalPages);

  const linkProps = (p: number) =>
    buildHref ? { href: buildHref(p) } : { onClick: () => onPageChange!(p) };

  const prevProps = buildHref
    ? { href: buildHref(page - 1) }
    : { onClick: () => onPageChange!(page - 1) };

  const nextProps = buildHref
    ? { href: buildHref(page + 1) }
    : { onClick: () => onPageChange!(page + 1) };

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-2 py-3">
        <p className="text-xs text-muted-foreground tabular-nums">
          {labels.showing
            .replace("{from}", from.toLocaleString())
            .replace("{to}", to.toLocaleString())
            .replace("{total}", total.toLocaleString())}
        </p>
        <div className="flex items-center gap-1">
          <PaginationPrevious
            label={labels.previous}
            ariaLabel={labels.goPrevious}
            {...prevProps}
            aria-disabled={page <= 1}
            className={
              page <= 1
                ? "pointer-events-none opacity-40 h-7 px-2 text-xs"
                : "cursor-pointer h-7 px-2 text-xs"
            }
          />
          <span className="text-xs text-muted-foreground tabular-nums px-1">
            {page} / {totalPages}
          </span>
          <PaginationNext
            label={labels.next}
            ariaLabel={labels.goNext}
            {...nextProps}
            aria-disabled={page >= totalPages}
            className={
              page >= totalPages
                ? "pointer-events-none opacity-40 h-7 px-2 text-xs"
                : "cursor-pointer h-7 px-2 text-xs"
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3">
      {/* Counter */}
      <p className="text-xs text-muted-foreground tabular-nums shrink-0">
        {labels.showing
          .replace("{from}", from.toLocaleString())
          .replace("{to}", to.toLocaleString())
          .replace("{total}", total.toLocaleString())}
      </p>

      {/* Pages */}
      <Pagination className="mx-0 w-auto">
        <PaginationContent className="gap-0.5">
          <PaginationItem>
            <PaginationPrevious
              label={labels.previous}
              ariaLabel={labels.goPrevious}
              {...prevProps}
              aria-disabled={page <= 1}
              className={
                page <= 1 ? "pointer-events-none opacity-40" : "cursor-pointer"
              }
            />
          </PaginationItem>

          {range.map((p, i) =>
            p === null ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis label={labels.morePages} />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === page}
                  {...linkProps(p)}
                  className="cursor-pointer size-9"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              label={labels.next}
              ariaLabel={labels.goNext}
              {...nextProps}
              aria-disabled={page >= totalPages}
              className={
                page >= totalPages
                  ? "pointer-events-none opacity-40"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
