"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LogOut, UserX, UserCheck, Ban, Trash2, ShieldAlert,
  Copy, Check, CreditCard,
} from "lucide-react";
import { StatusBadge } from "./status-badge";
import type { UserRow, ConfirmType } from "./types";
import { ALL_ROLES, ROLE_STYLE, PLAN_STYLE } from "./types";
import { formatRelative } from "./utils";

interface Props {
  user: UserRow | null;
  canWrite: boolean;
  onClose: () => void;
  onSetRole: (role: string) => void;
  onRemoveRole: () => void;
  onConfirm: (type: ConfirmType) => void;
  onBanOpen: () => void;
  t: (k: string) => string;
  locale: string;
}

const PROVIDER_MAP: Record<string, { icon: React.ReactNode; label: string }> = {
  google: {
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="size-3" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  github: {
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" className="size-3 fill-current" aria-hidden>
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    ),
  },
  microsoft: {
    label: "Microsoft",
    icon: (
      <svg viewBox="0 0 24 24" className="size-3" aria-hidden>
        <path fill="#F25022" d="M1 1h10v10H1z"/>
        <path fill="#00A4EF" d="M13 1h10v10H13z"/>
        <path fill="#7FBA00" d="M1 13h10v10H1z"/>
        <path fill="#FFB900" d="M13 13h10v10H13z"/>
      </svg>
    ),
  },
  apple: {
    label: "Apple",
    icon: (
      <svg viewBox="0 0 24 24" className="size-3 fill-current" aria-hidden>
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  email: {
    label: "Email",
    icon: (
      <svg viewBox="0 0 24 24" className="size-3 fill-none stroke-current stroke-2" aria-hidden>
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m2 7 10 7 10-7"/>
      </svg>
    ),
  },
  password: {
    label: "Email / Password",
    icon: (
      <svg viewBox="0 0 24 24" className="size-3 fill-none stroke-current stroke-2" aria-hidden>
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m2 7 10 7 10-7"/>
      </svg>
    ),
  },
};

function AuthProviderBadge({ provider }: { provider: string | null }) {
  const key = provider?.toLowerCase() ?? "password";
  const config = PROVIDER_MAP[key] ?? {
    label: provider ?? "Email / Password",
    icon: (
      <svg viewBox="0 0 24 24" className="size-3 fill-none stroke-current stroke-2" aria-hidden>
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m2 7 10 7 10-7"/>
      </svg>
    ),
  };

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      {config.icon}
      {config.label}
    </span>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={copy} className="ml-1 text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="size-3 text-secondary-500" /> : <Copy className="size-3" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">{copied ? "Copied!" : "Copy"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function UserSheet({ user, canWrite, onClose, onSetRole, onRemoveRole, onConfirm, onBanOpen, t, locale }: Props) {
  return (
    <Sheet open={!!user} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-0 p-0">
        {user && (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 rounded-xl shrink-0">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-sm font-semibold rounded-xl">
                    {(user.name ?? user.email).split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-base truncate">{user.name ?? "—"}</SheetTitle>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <CopyButton value={user.email} />
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-0 flex-1 overflow-y-auto">
              {/* Badges */}
              <div className="px-6 py-4 flex flex-wrap gap-1.5">
                <StatusBadge user={user} t={t} />
                <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${PLAN_STYLE[user.plan]}`}>{user.plan}</Badge>
                {user.roles.map((r) => (
                  <Badge key={r.name} variant="outline" className={`text-[10px] h-5 px-1.5 ${ROLE_STYLE[r.name] ?? ROLE_STYLE.VIEWER}`}>{r.displayName}</Badge>
                ))}
              </div>

              {/* Stats */}
              <div className="px-6 pb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("detail.tokenUsage")}</span>
                  <span className="text-lg font-bold tabular-nums">{user.tokenUsage.toLocaleString()}</span>
                </div>
                <div className="rounded-lg border border-border p-3 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("detail.projects")}</span>
                  <span className="text-lg font-bold tabular-nums">{user.projectCount}</span>
                </div>
              </div>

              {/* Meta */}
              <div className="px-6 pb-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("detail.joined")}</span>
                  <span className="tabular-nums">{new Date(user.createdAt).toLocaleDateString(locale)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("detail.lastLogin")}</span>
                  <span className="tabular-nums">
                    {user.lastLoginAt ? formatRelative(user.lastLoginAt, locale) : <span className="text-muted-foreground/50">—</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("detail.authProvider")}</span>
                  <AuthProviderBadge provider={user.authProvider ?? null} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">ID</span>
                  <div className="flex items-center gap-0.5 font-mono text-[10px] text-muted-foreground">
                    {user.clerkId.slice(0, 16)}…
                    <CopyButton value={user.clerkId} />
                  </div>
                </div>
              </div>

              {/* Ban reason */}
              {user.isBanned && user.bannedReason && (
                <div className="mx-6 mb-4 rounded-lg border border-error-500/25 bg-error-500/5 p-3 flex gap-2">
                  <ShieldAlert className="size-4 text-error-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-error-700 dark:text-error-400">{t("detail.banReason")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{user.bannedReason}</p>
                  </div>
                </div>
              )}

              {canWrite && (
                <>
                  <Separator />

                  {/* Role */}
                  <div className="px-6 py-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("detail.assignRole")}</p>
                    <div className="flex gap-2">
                      <Select
                        defaultValue={user.roles[0]?.name ?? "DEVELOPER"}
                        onValueChange={onSetRole}
                      >
                        <SelectTrigger className="h-8 text-sm flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={onRemoveRole}>
                        {t("actions.revokeRole")}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Plan */}
                  <div className="px-6 py-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("detail.changePlan")}</p>
                    <Button
                      size="sm" variant="outline"
                      className="justify-start gap-2 h-8"
                      onClick={() => onConfirm("changePlan")}
                    >
                      <CreditCard className="size-3.5" />{t("actions.changePlan")} — {user.plan}
                    </Button>
                  </div>

                  <Separator />

                  {/* Account actions */}
                  <div className="px-6 py-4 flex flex-col gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("detail.accountActions")}</p>

                    {/* Safe actions */}
                    <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                        onClick={() => onConfirm("signout")}
                      >
                        <span className="flex items-center justify-center size-7 rounded-md bg-muted shrink-0">
                          <LogOut className="size-3.5 text-muted-foreground" />
                        </span>
                        <span className="flex-1 font-medium">{t("actions.forceSignOut")}</span>
                      </button>

                      {user.isActive && !user.isBanned ? (
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-amber-500/5 transition-colors text-left"
                          onClick={() => onConfirm("suspend")}
                        >
                          <span className="flex items-center justify-center size-7 rounded-md bg-amber-500/10 shrink-0">
                            <UserX className="size-3.5 text-amber-600" />
                          </span>
                          <span className="flex-1 font-medium text-amber-700 dark:text-amber-400">{t("actions.suspend")}</span>
                        </button>
                      ) : (
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                          onClick={() => onConfirm("reactivate")}
                        >
                          <span className="flex items-center justify-center size-7 rounded-md bg-muted shrink-0">
                            <UserCheck className="size-3.5 text-muted-foreground" />
                          </span>
                          <span className="flex-1 font-medium">{t("actions.reactivate")}</span>
                        </button>
                      )}
                    </div>

                    {/* Destructive actions */}
                    <div className="rounded-lg border border-error-500/20 overflow-hidden divide-y divide-error-500/10">
                      {!user.isBanned && (
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-error-500/5 transition-colors text-left"
                          onClick={onBanOpen}
                        >
                          <span className="flex items-center justify-center size-7 rounded-md bg-error-500/10 shrink-0">
                            <Ban className="size-3.5 text-error-600" />
                          </span>
                          <span className="flex-1 font-medium text-error-700 dark:text-error-400">{t("actions.ban")}</span>
                        </button>
                      )}
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-error-500/5 transition-colors text-left"
                        onClick={() => onConfirm("delete")}
                      >
                        <span className="flex items-center justify-center size-7 rounded-md bg-error-500/10 shrink-0">
                          <Trash2 className="size-3.5 text-error-600" />
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-error-700 dark:text-error-400">{t("actions.delete")}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{t("actions.deleteHint")}</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
