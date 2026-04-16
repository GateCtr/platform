"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Inbox,
  Send,
  Star,
  Archive,
  Search,
  SquarePen,
  RefreshCw,
  Mail,
  MailOpen,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InboxEmailList } from "./inbox-email-list";
import { OutboxEmailList } from "./outbox-email-list";
import { EmailDetail } from "./email-detail";
import { ComposeDialog } from "./compose-dialog";
import { cn } from "@/lib/utils";

type Tab = "inbox" | "sent";
type InboxFilter = "all" | "unread" | "starred" | "archived";

export interface InboxEmailSummary {
  id: string;
  fromEmail: string;
  fromName: string | null;
  toEmail: string;
  subject: string;
  preview: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  labels: string[];
  threadId: string | null;
  createdAt: string;
}

export interface OutboxEmailSummary {
  id: string;
  toEmail: string;
  toName: string | null;
  fromEmail: string;
  subject: string;
  preview: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  openCount: number;
  clickCount: number;
  createdAt: string;
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────

function NavItem({
  icon: Icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span className="ml-auto min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center px-1.5">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InboxDashboard() {
  const t = useTranslations("inbox");
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("inbox");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  }, []);

  // ── Queries ────────────────────────────────────────────────────────────────
  const inboxQuery = useQuery<{
    emails: InboxEmailSummary[];
    total: number;
    unreadCount: number;
  }>({
    queryKey: ["inbox", filter, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({ filter });
      if (debouncedSearch) params.set("q", debouncedSearch);
      return fetch(`/api/v1/inbox?${params}`).then((r) => r.json());
    },
    enabled: tab === "inbox",
    refetchInterval: 30_000,
  });

  const outboxQuery = useQuery<{ emails: OutboxEmailSummary[]; total: number }>(
    {
      queryKey: ["outbox", debouncedSearch],
      queryFn: () => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("q", debouncedSearch);
        return fetch(`/api/v1/outbox?${params}`).then((r) => r.json());
      },
      enabled: tab === "sent",
    },
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const markRead = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      fetch(`/api/v1/inbox/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox"] }),
  });

  const toggleStar = useMutation({
    mutationFn: ({ id, isStarred }: { id: string; isStarred: boolean }) =>
      fetch(`/api/v1/inbox/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox"] }),
  });

  const archive = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/v1/inbox/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
      setSelectedId(null);
      setMobileView("list");
    },
  });

  const inboxEmails = inboxQuery.data?.emails ?? [];
  const outboxEmails = outboxQuery.data?.emails ?? [];
  const unreadCount = inboxQuery.data?.unreadCount ?? 0;
  const isLoading =
    tab === "inbox" ? inboxQuery.isLoading : outboxQuery.isLoading;

  function handleSelectEmail(id: string) {
    setSelectedId(id);
    setMobileView("detail");
    if (tab === "inbox") {
      const email = inboxEmails.find((e) => e.id === id);
      if (email && !email.isRead) markRead.mutate({ id, isRead: true });
    }
  }

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    setSelectedId(null);
    setMobileView("list");
  }

  function handleFilterChange(f: InboxFilter) {
    setFilter(f);
    setSelectedId(null);
    setMobileView("list");
  }

  const INBOX_FILTERS: {
    key: InboxFilter;
    icon: React.ElementType;
    label: string;
  }[] = [
    { key: "all", icon: MailOpen, label: t("filters.all") },
    { key: "unread", icon: Mail, label: t("filters.unread") },
    { key: "starred", icon: Star, label: t("filters.starred") },
    { key: "archived", icon: Archive, label: t("filters.archived") },
  ];

  return (
    <>
      {/* ── Mobile layout ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:hidden min-h-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 border rounded-xl mb-2 bg-card">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg">
            <button
              onClick={() => handleTabChange("inbox")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                tab === "inbox"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              <Inbox className="size-3.5" />
              {t("tabs.inbox")}
              {unreadCount > 0 && (
                <span className="min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("sent")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                tab === "sent"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              <Send className="size-3.5" />
              {t("tabs.sent")}
            </button>
          </div>

          <div className="flex-1" />

          {/* Search toggle + compose */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              placeholder={t("search.placeholder")}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-7 h-7 w-32 text-xs bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <SquarePen className="size-4" />
          </button>
        </div>

        {/* Mobile inbox filters (inbox tab only) */}
        {tab === "inbox" && mobileView === "list" && (
          <div className="flex items-center gap-1 px-1 mb-2 overflow-x-auto scrollbar-none">
            {INBOX_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                  filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                <f.icon className="size-3" />
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Mobile: list view */}
        {mobileView === "list" && (
          <div className="rounded-xl border bg-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : tab === "inbox" ? (
              <InboxEmailList
                emails={inboxEmails}
                selectedId={selectedId}
                onSelect={handleSelectEmail}
                onStar={(id, starred) =>
                  toggleStar.mutate({ id, isStarred: starred })
                }
                onArchive={(id) => archive.mutate(id)}
              />
            ) : (
              <OutboxEmailList
                emails={outboxEmails}
                selectedId={selectedId}
                onSelect={handleSelectEmail}
              />
            )}
          </div>
        )}

        {/* Mobile: detail view */}
        {mobileView === "detail" && selectedId && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <EmailDetail
              id={selectedId}
              type={tab === "inbox" ? "inbox" : "outbox"}
              onClose={() => {
                setSelectedId(null);
                setMobileView("list");
              }}
              onArchive={
                tab === "inbox" ? (id) => archive.mutate(id) : undefined
              }
              onReply={() => setShowCompose(true)}
            />
          </div>
        )}
      </div>

      {/* ── Desktop layout ────────────────────────────────────────────────── */}
      <div className="hidden md:flex h-[calc(100vh-8rem)] min-h-[500px] rounded-xl border bg-card overflow-hidden">
        {/* Left sidebar */}
        <aside className="flex flex-col w-52 shrink-0 border-r bg-muted/20">
          <div className="p-3 border-b">
            <Button
              variant="cta-primary"
              size="sm"
              className="w-full gap-2"
              onClick={() => setShowCompose(true)}
            >
              <SquarePen className="size-3.5" />
              {t("actions.compose")}
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {t("tabs.inbox")}
            </p>
            <NavItem
              icon={Inbox}
              label={t("tabs.inbox")}
              active={tab === "inbox" && filter === "all"}
              badge={unreadCount}
              onClick={() => {
                handleTabChange("inbox");
                handleFilterChange("all");
              }}
            />
            {INBOX_FILTERS.filter((f) => f.key !== "all").map((f) => (
              <NavItem
                key={f.key}
                icon={f.icon}
                label={f.label}
                active={tab === "inbox" && filter === f.key}
                onClick={() => {
                  handleTabChange("inbox");
                  handleFilterChange(f.key);
                }}
              />
            ))}
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {t("tabs.sent")}
            </p>
            <NavItem
              icon={Send}
              label={t("tabs.sent")}
              active={tab === "sent"}
              onClick={() => handleTabChange("sent")}
            />
          </nav>

          <div className="p-2 border-t">
            <button
              onClick={() => {
                qc.invalidateQueries({ queryKey: ["inbox"] });
                qc.invalidateQueries({ queryKey: ["outbox"] });
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <RefreshCw className="size-3.5" />
              {t("actions.refresh")}
            </button>
          </div>
        </aside>

        {/* Center: list */}
        <div
          className={cn(
            "flex flex-col border-r",
            selectedId ? "w-72 lg:w-80 shrink-0" : "flex-1",
          )}
        >
          {/* List header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-background/50 shrink-0">
            <span className="text-xs font-semibold text-foreground">
              {tab === "inbox"
                ? (INBOX_FILTERS.find((f) => f.key === filter)?.label ??
                  t("tabs.inbox"))
                : t("tabs.sent")}
            </span>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <Input
                placeholder={t("search.placeholder")}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-7 h-7 text-xs bg-muted/50 border-0 focus-visible:ring-1"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Email list */}
          <div className="flex-1 overflow-y-auto scrollbar-none">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : tab === "inbox" ? (
              <InboxEmailList
                emails={inboxEmails}
                selectedId={selectedId}
                onSelect={handleSelectEmail}
                onStar={(id, starred) =>
                  toggleStar.mutate({ id, isStarred: starred })
                }
                onArchive={(id) => archive.mutate(id)}
              />
            ) : (
              <OutboxEmailList
                emails={outboxEmails}
                selectedId={selectedId}
                onSelect={handleSelectEmail}
              />
            )}
          </div>
        </div>

        {/* Right: detail */}
        <div className="flex-1 min-w-0 flex flex-col">
          {selectedId ? (
            <EmailDetail
              id={selectedId}
              type={tab === "inbox" ? "inbox" : "outbox"}
              onClose={() => setSelectedId(null)}
              onArchive={
                tab === "inbox" ? (id) => archive.mutate(id) : undefined
              }
              onReply={() => setShowCompose(true)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="rounded-full bg-muted p-5">
                <Inbox className="size-7 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {t("empty.selectTitle")}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {t("empty.select")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Compose dialog ────────────────────────────────────────────────── */}
      <ComposeDialog
        open={showCompose}
        onClose={() => setShowCompose(false)}
        onSent={() => {
          setShowCompose(false);
          setSelectedId(null);
          setMobileView("list");
          handleTabChange("sent");
          qc.invalidateQueries({ queryKey: ["outbox"] });
        }}
        replyToId={tab === "inbox" && selectedId ? selectedId : undefined}
        replyToEmail={
          tab === "inbox" && selectedId
            ? inboxEmails.find((e) => e.id === selectedId)
            : undefined
        }
      />
    </>
  );
}
