"use client";

import { useState } from "react";
import {
  CheckCircle2, XCircle, ChevronRight,
  UserPlus, UserCog, UserX, ShieldCheck, ShieldOff,
  Receipt, CreditCard, RefreshCw, XOctagon, CalendarX,
  Users, UserCheck,
  Webhook,
  ShieldAlert, LogIn,
  HelpCircle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";

interface AuditLog {
  id: string;
  userId: string | null;
  actorId: string | null;
  resource: string;
  action: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  error: string | null;
  createdAt: string;
  oldValue: unknown;
  newValue: unknown;
  user: { id: string; email: string; name: string | null } | null;
}

interface AuditRowDetailProps {
  log: AuditLog;
  labels: {
    statusSuccess: string;
    statusFailed: string;
    detailTitle: string;
    id: string;
    timestamp: string;
    user: string;
    actor: string;
    resource: string;
    action: string;
    resourceId: string;
    ip: string;
    userAgent: string;
    error: string;
    oldValue: string;
    newValue: string;
    noData: string;
  };
  showCheckbox?: boolean;
}

// ─── Resource badge ───────────────────────────────────────────────────────────

const RESOURCE_COLORS: Record<string, string> = {
  billing: "bg-violet-500/10 text-violet-700 border-violet-500/25 dark:text-violet-400",
  user:    "bg-primary/10 text-primary border-primary/25",
  team:    "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400",
  webhook: "bg-secondary-500/10 text-secondary-700 border-secondary-500/25 dark:text-secondary-400",
  role:    "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400",
};

function ResourceBadge({ resource }: { resource: string }) {
  const cls = RESOURCE_COLORS[resource] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={`text-[10px] font-medium px-1.5 h-5 capitalize ${cls}`}>
      {resource}
    </Badge>
  );
}

// ─── Action registry ──────────────────────────────────────────────────────────

type ActionMeta = {
  label: string;
  icon: React.ElementType;
  cls: string; // badge color classes
};

const ACTION_MAP: Record<string, ActionMeta> = {
  // User
  "user.created":   { label: "User created",   icon: UserPlus,   cls: "bg-secondary-500/10 text-secondary-700 border-secondary-500/25 dark:text-secondary-400" },
  "user.updated":   { label: "User updated",   icon: UserCog,    cls: "bg-primary/10 text-primary border-primary/25" },
  "user.deleted":   { label: "User deleted",   icon: UserX,      cls: "bg-destructive/10 text-destructive border-destructive/25" },
  // Roles
  "role.granted":   { label: "Role granted",   icon: ShieldCheck, cls: "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400" },
  "role.revoked":   { label: "Role revoked",   icon: ShieldOff,  cls: "bg-destructive/10 text-destructive border-destructive/25" },
  // Billing
  "billing.subscription_activated":              { label: "Subscription activated",    icon: CreditCard,  cls: "bg-secondary-500/10 text-secondary-700 border-secondary-500/25 dark:text-secondary-400" },
  "billing.subscription_updated":                { label: "Subscription updated",      icon: RefreshCw,   cls: "bg-primary/10 text-primary border-primary/25" },
  "billing.subscription_canceled":               { label: "Subscription canceled",     icon: XOctagon,    cls: "bg-destructive/10 text-destructive border-destructive/25" },
  "billing.subscription_cancellation_scheduled": { label: "Cancellation scheduled",    icon: CalendarX,   cls: "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400" },
  "billing.coupon_created":                      { label: "Coupon created",            icon: Receipt,     cls: "bg-primary/10 text-primary border-primary/25" },
  "billing.coupon_deleted":                      { label: "Coupon deleted",            icon: Receipt,     cls: "bg-destructive/10 text-destructive border-destructive/25" },
  "billing.refund_issued":                       { label: "Refund issued",             icon: Receipt,     cls: "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400" },
  // Team
  "team.created":   { label: "Team created",   icon: Users,      cls: "bg-secondary-500/10 text-secondary-700 border-secondary-500/25 dark:text-secondary-400" },
  "team.updated":   { label: "Team updated",   icon: Users,      cls: "bg-primary/10 text-primary border-primary/25" },
  "team.deleted":   { label: "Team deleted",   icon: Users,      cls: "bg-destructive/10 text-destructive border-destructive/25" },
  "team.member_added":   { label: "Member added",   icon: UserCheck, cls: "bg-secondary-500/10 text-secondary-700 border-secondary-500/25 dark:text-secondary-400" },
  "team.member_removed": { label: "Member removed", icon: UserX,     cls: "bg-destructive/10 text-destructive border-destructive/25" },
  // Webhooks
  "webhook.signature_failed": { label: "Webhook signature failed", icon: Webhook,       cls: "bg-destructive/10 text-destructive border-destructive/25" },
  "webhook.delivery_failed":  { label: "Webhook delivery failed",  icon: Webhook,       cls: "bg-destructive/10 text-destructive border-destructive/25" },
  // Access
  "access.denied":  { label: "Access denied",  icon: ShieldAlert, cls: "bg-destructive/10 text-destructive border-destructive/25" },
  "auth.login":     { label: "Login",          icon: LogIn,       cls: "bg-muted text-muted-foreground border-border" },
};

function getActionMeta(action: string): ActionMeta {
  if (ACTION_MAP[action]) return ACTION_MAP[action];
  // Fallback: derive a readable label from the raw string
  const label = action
    .replace(/\./g, " › ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { label, icon: HelpCircle, cls: "bg-muted text-muted-foreground border-border" };
}

function ActionBadge({ action }: { action: string }) {
  const { label, icon: Icon, cls } = getActionMeta(action);
  return (
    <Badge
      variant="outline"
      className={`gap-1 text-[10px] font-medium px-1.5 h-5 ${cls}`}
      title={action} // show raw string on hover
    >
      <Icon className="size-3 shrink-0" />
      {label}
    </Badge>
  );
}

// ─── Detail field ─────────────────────────────────────────────────────────────

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </span>
      <span className="text-sm break-all">{value}</span>
    </div>
  );
}

function JsonField({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </span>
      <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-40 whitespace-pre-wrap break-all">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AuditRowDetail({ log, labels }: AuditRowDetailProps) {
  const [open, setOpen] = useState(false);

  const hasExtra =
    log.ipAddress ||
    log.userAgent ||
    log.error ||
    log.oldValue ||
    log.newValue ||
    log.resourceId ||
    log.actorId;

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setOpen(true)}
      >
        <TableCell className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString()}
        </TableCell>
        <TableCell className="text-xs">
          {log.user ? (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium truncate max-w-[140px]">
                {log.user.name ?? log.user.email}
              </span>
              {log.user.name && (
                <span className="text-muted-foreground truncate max-w-[140px]">
                  {log.user.email}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          <ResourceBadge resource={log.resource} />
        </TableCell>
        <TableCell>
          <ActionBadge action={log.action} />
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-2">
            {log.success ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary-700 dark:text-secondary-400">
                <CheckCircle2 className="size-3.5" />
                {labels.statusSuccess}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                <XCircle className="size-3.5" />
                {labels.statusFailed}
              </span>
            )}
            {hasExtra && (
              <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0" />
            )}
          </div>
        </TableCell>
      </TableRow>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">{labels.detailTitle}</SheetTitle>
            <SheetDescription className="font-mono text-xs">
              {log.id}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 pb-6">
            {/* Status */}
            <div className="flex items-center gap-2 py-2 border-b border-border">
              <ResourceBadge resource={log.resource} />
              <ActionBadge action={log.action} />
              {log.success ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary-700 dark:text-secondary-400 ml-auto">
                  <CheckCircle2 className="size-3.5" />
                  {labels.statusSuccess}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive ml-auto">
                  <XCircle className="size-3.5" />
                  {labels.statusFailed}
                </span>
              )}
            </div>

            <DetailField
              label={labels.timestamp}
              value={new Date(log.createdAt).toLocaleString()}
            />
            <DetailField
              label={labels.resource}
              value={log.resource}
            />
            <DetailField
              label={labels.action}
              value={<span className="font-mono text-xs">{log.action}</span>}
            />
            {log.resourceId && (
              <DetailField label={labels.resourceId} value={log.resourceId} />
            )}
            {log.user && (
              <DetailField
                label={labels.user}
                value={`${log.user.name ? log.user.name + " — " : ""}${log.user.email}`}
              />
            )}
            {log.actorId && (
              <DetailField label={labels.actor} value={log.actorId} />
            )}
            {log.ipAddress && (
              <DetailField label={labels.ip} value={log.ipAddress} />
            )}
            {log.userAgent && (
              <DetailField label={labels.userAgent} value={log.userAgent} />
            )}
            {log.error && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-destructive font-medium">
                  {labels.error}
                </span>
                <span className="text-sm text-destructive break-all">{log.error}</span>
              </div>
            )}
            <JsonField label={labels.oldValue} value={log.oldValue} />
            <JsonField label={labels.newValue} value={log.newValue} />

            {!hasExtra && (
              <p className="text-xs text-muted-foreground">{labels.noData}</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
