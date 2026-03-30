"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Mail,
  CheckCircle2,
  Clock,
  Send,
  Filter,
  Search,
  Download,
  Trash2,
  Ban,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataPagination } from "@/components/ui/data-pagination";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  useCase: string | null;
  position: number;
  status: "WAITING" | "INVITED" | "JOINED" | "SKIPPED";
  referralCode: string | null;
  createdAt: string;
}

type FilterValue = "all" | "WAITING" | "INVITED" | "JOINED" | "SKIPPED";

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({
  total,
  waiting,
  invited,
  joined,
  loading,
  labels,
}: {
  total: number;
  waiting: number;
  invited: number;
  joined: number;
  loading: boolean;
  labels: { total: string; waiting: string; invited: string; joined: string };
}) {
  const items = [
    { label: labels.total, value: total, dot: "bg-muted-foreground" },
    { label: labels.waiting, value: waiting, dot: "bg-muted-foreground" },
    { label: labels.invited, value: invited, dot: "bg-amber-500" },
    { label: labels.joined, value: joined, dot: "bg-secondary-500" },
  ];
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-1">
          {i > 0 && <span className="text-border mx-1 select-none">·</span>}
          <span className={`size-1.5 rounded-full shrink-0 ${item.dot}`} />
          <span className="text-xs text-muted-foreground">{item.label}</span>
          {loading ? (
            <Skeleton className="h-3.5 w-6 inline-block" />
          ) : (
            <span className="text-xs font-semibold tabular-nums">
              {item.value.toLocaleString()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  WAITING: {
    icon: Clock,
    className: "bg-muted text-muted-foreground border-border",
  },
  INVITED: {
    icon: Mail,
    className:
      "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400",
  },
  JOINED: {
    icon: CheckCircle2,
    className:
      "bg-secondary-500/10 text-secondary-700 border-secondary-500/25 dark:text-secondary-400",
  },
  SKIPPED: {
    icon: Ban,
    className: "bg-destructive/10 text-destructive border-destructive/25",
  },
} as const;

function StatusBadge({
  status,
  label,
}: {
  status: WaitlistEntry["status"];
  label: string;
}) {
  const { icon: Icon, className } = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={`gap-1 text-[10px] font-semibold uppercase tracking-wider h-5 px-1.5 ${className}`}
    >
      <Icon className="size-3 shrink-0" />
      {label}
    </Badge>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminWaitlistPage() {
  const t = useTranslations("adminWaitlist");
  const tc = useTranslations("common.pagination");

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    waiting: 0,
    invited: 0,
    joined: 0,
    skipped: 0,
  });
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmEntry, setConfirmEntry] = useState<{
    id: string;
    email: string;
    action: "delete" | "skip";
  } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PAGE_SIZE = 50;

  // Debounce search input
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (filter !== "all") params.append("status", filter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      const res = await fetch(`/api/waitlist?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(data.entries);
      setTotal(data.pagination.total);
      if (data.counts) setStatusCounts(data.counts);
      setSelectedIds(new Set());
    } catch {
      setAlert({ type: "error", text: t("messages.loadFailed") });
    } finally {
      setLoading(false);
    }
  }, [filter, page, debouncedSearch, t]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const waitingEntries = entries.filter((e) => e.status === "WAITING");
  const allWaitingSelected =
    waitingEntries.length > 0 && selectedIds.size === waitingEntries.length;

  const toggleAll = () =>
    setSelectedIds(
      allWaitingSelected ? new Set() : new Set(waitingEntries.map((e) => e.id)),
    );

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const sendInvites = async (ids: string[]) => {
    setInviting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/waitlist/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryIds: ids, expiryDays: 7 }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({
          type: "success",
          text: t("messages.inviteSuccess", { count: data.invited }),
        });
        fetchEntries();
      } else {
        setAlert({
          type: "error",
          text: data.error ?? t("messages.inviteFailed"),
        });
      }
    } catch {
      setAlert({ type: "error", text: t("messages.inviteFailed") });
    } finally {
      setInviting(false);
    }
  };

  const handleEntryAction = async (id: string, action: "delete" | "skip") => {
    try {
      const res = await fetch("/api/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setAlert({
          type: "success",
          text:
            action === "delete"
              ? t("messages.deleteSuccess")
              : t("messages.skipSuccess"),
        });
        fetchEntries();
      } else {
        const data = await res.json();
        setAlert({
          type: "error",
          text: data.error ?? t("messages.actionFailed"),
        });
      }
    } catch {
      setAlert({ type: "error", text: t("messages.actionFailed") });
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams({ export: "csv" });
    if (filter !== "all") params.append("status", filter);
    if (debouncedSearch) params.append("search", debouncedSearch);
    window.open(`/api/waitlist?${params}`, "_blank");
  };

  const waitingCount = statusCounts.waiting;
  const invitedCount = statusCounts.invited;
  const joinedCount = statusCounts.joined;
  const showCheckbox = filter === "all" || filter === "WAITING";

  const statusLabel = (s: WaitlistEntry["status"]) =>
    t(
      `filters.${s.toLowerCase() as "waiting" | "invited" | "joined" | "skipped"}`,
    );

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <StatsBar
          total={total}
          waiting={waitingCount}
          invited={invitedCount}
          joined={joinedCount}
          loading={loading}
          labels={{
            total: t("stats.total"),
            waiting: t("stats.waiting"),
            invited: t("stats.invited"),
            joined: t("stats.joined"),
          }}
        />
      </div>

      {alert && (
        <Alert variant={alert.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{alert.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">{t("title")}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {t("subtitle")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("search.placeholder")}
                  className="h-8 pl-8 w-[180px] text-xs"
                />
              </div>

              {/* Filter */}
              <Select
                value={filter}
                onValueChange={(v) => {
                  setFilter(v as FilterValue);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[150px] text-xs gap-1.5">
                  <Filter className="size-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  <SelectItem value="WAITING">
                    {t("filters.waiting")}
                  </SelectItem>
                  <SelectItem value="INVITED">
                    {t("filters.invited")}
                  </SelectItem>
                  <SelectItem value="JOINED">{t("filters.joined")}</SelectItem>
                  <SelectItem value="SKIPPED">
                    {t("filters.skipped")}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Export CSV */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleExportCsv}
              >
                <Download className="size-3.5" />
                {t("actions.export")}
              </Button>

              {/* Invite selected */}
              {selectedIds.size > 0 && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => sendInvites(Array.from(selectedIds))}
                  disabled={inviting}
                >
                  <Send className="size-3.5" />
                  {inviting
                    ? t("actions.sending")
                    : t("actions.inviteSelected", { count: selectedIds.size })}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* ── Desktop table ─────────────────────────────────────────────── */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  {showCheckbox && (
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={allWaitingSelected}
                        onCheckedChange={toggleAll}
                        disabled={waitingEntries.length === 0 || loading}
                        aria-label="Select all waiting"
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-12">{t("table.position")}</TableHead>
                  <TableHead>{t("table.email")}</TableHead>
                  <TableHead>{t("table.company")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.joined")}
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {showCheckbox && (
                        <TableCell className="pl-4">
                          <Skeleton className="size-4 rounded" />
                        </TableCell>
                      )}
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={showCheckbox ? 7 : 6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {debouncedSearch ? t("search.noResults") : t("empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => {
                    const initials = (entry.name ?? entry.email)
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <TableRow
                        key={entry.id}
                        className={
                          selectedIds.has(entry.id) ? "bg-muted/30" : ""
                        }
                      >
                        {showCheckbox && (
                          <TableCell className="pl-4">
                            {entry.status === "WAITING" && (
                              <Checkbox
                                checked={selectedIds.has(entry.id)}
                                onCheckedChange={() => toggleOne(entry.id)}
                                aria-label={`Select ${entry.email}`}
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] px-1.5"
                          >
                            #{entry.position}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-7 rounded-md shrink-0">
                              <AvatarFallback className="text-[10px] font-semibold rounded-md bg-muted">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-sm font-medium truncate">
                                {entry.email}
                              </span>
                              {entry.name && (
                                <span className="text-[11px] text-muted-foreground truncate">
                                  {entry.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.company ?? "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={entry.status}
                            label={statusLabel(entry.status)}
                          />
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right pr-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                              >
                                <MoreHorizontal className="size-3.5" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {entry.status === "WAITING" && (
                                <DropdownMenuItem
                                  className="gap-2 text-xs"
                                  onClick={() => sendInvites([entry.id])}
                                  disabled={inviting}
                                >
                                  <Mail className="size-3.5" />
                                  {t("actions.invite")}
                                </DropdownMenuItem>
                              )}
                              {entry.status === "WAITING" && (
                                <DropdownMenuSeparator />
                              )}
                              <DropdownMenuItem
                                className="gap-2 text-xs text-destructive focus:text-destructive"
                                onClick={() =>
                                  setConfirmEntry({
                                    id: entry.id,
                                    email: entry.email,
                                    action: "skip",
                                  })
                                }
                              >
                                <Ban className="size-3.5" />
                                {t("actions.blacklist")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-xs text-destructive focus:text-destructive"
                                onClick={() =>
                                  setConfirmEntry({
                                    id: entry.id,
                                    email: entry.email,
                                    action: "delete",
                                  })
                                }
                              >
                                <Trash2 className="size-3.5" />
                                {t("actions.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Mobile card list ──────────────────────────────────────────── */}
          <div className="md:hidden divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="size-9 rounded-md shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              ))
            ) : entries.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                {debouncedSearch ? t("search.noResults") : t("empty")}
              </div>
            ) : (
              entries.map((entry) => {
                const initials = (entry.name ?? entry.email)
                  .slice(0, 2)
                  .toUpperCase();
                const isSelected = selectedIds.has(entry.id);
                return (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${isSelected ? "bg-muted/30" : ""}`}
                  >
                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                      {showCheckbox && entry.status === "WAITING" && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(entry.id)}
                          aria-label={`Select ${entry.email}`}
                        />
                      )}
                      <Avatar className="size-9 rounded-md">
                        <AvatarFallback className="text-xs font-semibold rounded-md bg-muted">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">
                          {entry.email}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] px-1 h-4 shrink-0"
                        >
                          #{entry.position}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {entry.name && (
                          <span className="text-xs text-muted-foreground">
                            {entry.name}
                          </span>
                        )}
                        {entry.company && (
                          <span className="text-xs text-muted-foreground">
                            · {entry.company}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge
                        status={entry.status}
                        label={statusLabel(entry.status)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {entry.status === "WAITING" && (
                            <DropdownMenuItem
                              className="gap-2 text-xs"
                              onClick={() => sendInvites([entry.id])}
                              disabled={inviting}
                            >
                              <Mail className="size-3.5" />
                              {t("actions.invite")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-xs text-destructive focus:text-destructive"
                            onClick={() =>
                              setConfirmEntry({
                                id: entry.id,
                                email: entry.email,
                                action: "skip",
                              })
                            }
                          >
                            <Ban className="size-3.5" />
                            {t("actions.blacklist")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-xs text-destructive focus:text-destructive"
                            onClick={() =>
                              setConfirmEntry({
                                id: entry.id,
                                email: entry.email,
                                action: "delete",
                              })
                            }
                          >
                            <Trash2 className="size-3.5" />
                            {t("actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Pagination ────────────────────────────────────────────────── */}
          {!loading && total > PAGE_SIZE && (
            <div className="border-t border-border">
              <DataPagination
                page={page}
                totalPages={Math.ceil(total / PAGE_SIZE)}
                total={total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                labels={{
                  previous: tc("previous"),
                  next: tc("next"),
                  morePages: tc("morePages"),
                  goPrevious: tc("goPrevious"),
                  goNext: tc("goNext"),
                  showing: tc("showing"),
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Confirm dialog ────────────────────────────────────────────────── */}
      <AlertDialog
        open={!!confirmEntry}
        onOpenChange={(open) => !open && setConfirmEntry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmEntry?.action === "delete"
                ? t("confirm.deleteTitle")
                : t("confirm.blacklistTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmEntry?.action === "delete"
                ? t("confirm.deleteDescription", {
                    email: confirmEntry?.email ?? "",
                  })
                : t("confirm.blacklistDescription", {
                    email: confirmEntry?.email ?? "",
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmEntry) {
                  handleEntryAction(confirmEntry.id, confirmEntry.action);
                  setConfirmEntry(null);
                }
              }}
            >
              {confirmEntry?.action === "delete"
                ? t("confirm.confirmDelete")
                : t("confirm.confirmBlacklist")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
