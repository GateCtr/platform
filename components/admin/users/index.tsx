"use client";

import { useState, useTransition, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { UserStats } from "./user-stats";
import { UserFilters } from "./user-filters";
import { UserTable } from "./user-table";
import { UserCards } from "./user-cards";
import { UserSheet } from "./user-sheet";
import { UserDialogs } from "./user-dialogs";

import {
  setRole,
  removeRole,
  suspendUser,
  reactivateUser,
  banUser,
  forceSignOut,
  deleteUser,
  changePlan,
} from "@/app/[locale]/(admin)/admin/users/_actions";

import type {
  UserRow,
  SortField,
  SortDir,
  StatusFilter,
  RoleFilter,
  PlanFilter,
  ConfirmType,
  PlanType,
} from "./types";
import { sortUsers, exportCsv } from "./utils";

// ─── Main orchestrator ────────────────────────────────────────────────────────

export function AdminUsersClient({
  users,
  canWrite,
}: {
  users: UserRow[];
  canWrite: boolean;
}) {
  const t = useTranslations("adminUsers");
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState<StatusFilter>("all");
  const [roleFilter, setRole_] = useState<RoleFilter>("all");
  const [planFilter, setPlan_] = useState<PlanFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── UI state ───────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [confirmAction, setConfirm] = useState<{
    type: ConfirmType;
    user: UserRow;
  } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [feedback, setFeedback] = useState<{
    id: string;
    msg: string;
    ok: boolean;
  } | null>(null);

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const list = users.filter((u) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !u.email.toLowerCase().includes(q) &&
          !(u.name ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      if (statusFilter === "active" && (!u.isActive || u.isBanned))
        return false;
      if (statusFilter === "inactive" && (u.isActive || u.isBanned))
        return false;
      if (statusFilter === "banned" && !u.isBanned) return false;
      if (roleFilter !== "all" && !u.roles.some((r) => r.name === roleFilter))
        return false;
      if (planFilter !== "all" && u.plan !== planFilter) return false;
      return true;
    });
    return sortUsers(list, sortField, sortDir);
  }, [users, search, statusFilter, roleFilter, planFilter, sortField, sortDir]);

  // ── Sort toggle ────────────────────────────────────────────────────────────
  function handleSort(field: SortField) {
    if (field === sortField) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  // ── Generic action runner ──────────────────────────────────────────────────
  function act(
    fn: (fd: FormData) => Promise<{ success?: boolean; error?: string }>,
    userId: string,
    extra?: Record<string, string>,
  ) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("clerkId", userId);
      if (extra) Object.entries(extra).forEach(([k, v]) => fd.set(k, v));
      const res = await fn(fd);
      setFeedback({
        id: userId,
        msg: res.error ?? t("feedback.success"),
        ok: !res.error,
      });
      if (!res.error) {
        setConfirm(null);
        setSelected(null);
        router.refresh();
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  // ── Confirm handler ────────────────────────────────────────────────────────
  function handleConfirm() {
    if (!confirmAction) return;
    const { type, user } = confirmAction;
    if (type === "suspend") act(suspendUser, user.clerkId);
    if (type === "reactivate") act(reactivateUser, user.clerkId);
    if (type === "signout") act(forceSignOut, user.clerkId);
    if (type === "delete") act(deleteUser, user.clerkId);
    if (type === "ban")
      act(banUser, user.clerkId, {
        reason: banReason || "Violation of terms of service",
      });
    if (type === "changePlan")
      act(changePlan, user.clerkId, { plan: selectedPlan ?? user.plan });
  }

  // ── Shared callbacks ───────────────────────────────────────────────────────
  const openConfirm = (type: ConfirmType, user: UserRow) => {
    setSelectedPlan(user.plan);
    setConfirm({ type, user });
  };
  const openBan = (user: UserRow) => {
    setBanReason("");
    setConfirm({ type: "ban", user });
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("subtitle")}
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-xs tabular-nums shrink-0 mt-1"
          >
            <Users className="size-3 mr-1" />
            {filtered.length} / {users.length}
          </Badge>
        </div>

        {/* Stats */}
        <UserStats users={users} t={t} />

        {/* Filters */}
        <UserFilters
          search={search}
          statusFilter={statusFilter}
          roleFilter={roleFilter}
          planFilter={planFilter}
          onSearch={setSearch}
          onStatus={setStatus}
          onRole={setRole_}
          onPlan={setPlan_}
          onExport={() => exportCsv(filtered)}
          t={t}
        />

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border h-24 flex items-center justify-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <>
            <UserCards
              users={filtered}
              canWrite={canWrite}
              locale={locale}
              onView={setSelected}
              onRemoveRole={(u) => act(removeRole, u.clerkId)}
              onConfirm={openConfirm}
              onBanOpen={openBan}
              t={t}
            />
            <UserTable
              users={filtered}
              canWrite={canWrite}
              locale={locale}
              sortField={sortField}
              sortDir={sortDir}
              feedback={feedback}
              onSort={handleSort}
              onView={setSelected}
              onRemoveRole={(u) => act(removeRole, u.clerkId)}
              onConfirm={openConfirm}
              onBanOpen={openBan}
              t={t}
            />
          </>
        )}
      </div>

      {/* Detail sheet */}
      <UserSheet
        user={selected}
        canWrite={canWrite}
        locale={locale}
        onClose={() => setSelected(null)}
        onSetRole={(role) =>
          selected && act(setRole, selected.clerkId, { role })
        }
        onRemoveRole={() => selected && act(removeRole, selected.clerkId)}
        onConfirm={(type) => selected && openConfirm(type, selected)}
        onBanOpen={() => selected && openBan(selected)}
        t={t}
      />

      {/* Confirm dialogs */}
      <UserDialogs
        confirmAction={confirmAction}
        banReason={banReason}
        selectedPlan={selectedPlan}
        onBanReasonChange={setBanReason}
        onPlanChange={setSelectedPlan}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
        t={t}
      />
    </>
  );
}
