import type { RoleName } from "@/types/globals";
import type { PlanType } from "@prisma/client";

export type { RoleName, PlanType };

export type UserRow = {
  id: string;
  clerkId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  plan: PlanType;
  isActive: boolean;
  isBanned: boolean;
  bannedReason: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  authProvider: string | null;
  roles: { name: RoleName; displayName: string }[];
  tokenUsage: number;
  projectCount: number;
};

export type SortField = "name" | "plan" | "createdAt" | "lastLoginAt" | "tokenUsage";
export type SortDir = "asc" | "desc";
export type StatusFilter = "all" | "active" | "inactive" | "banned";
export type RoleFilter = "all" | RoleName;
export type PlanFilter = "all" | PlanType;

export type ConfirmType = "suspend" | "reactivate" | "ban" | "delete" | "signout" | "changePlan";

export const ALL_ROLES: RoleName[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SUPPORT", "DEVELOPER", "VIEWER"];
export const ALL_PLANS: PlanType[] = ["FREE", "PRO", "TEAM", "ENTERPRISE"];

export const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: "bg-primary/10 text-primary border-primary/25",
  ADMIN:       "bg-violet-500/10 text-violet-600 border-violet-500/25 dark:text-violet-400",
  MANAGER:     "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400",
  SUPPORT:     "bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-400",
  DEVELOPER:   "bg-muted text-muted-foreground border-border",
  VIEWER:      "bg-muted text-muted-foreground border-border",
};

export const PLAN_STYLE: Record<string, string> = {
  FREE:       "bg-muted text-muted-foreground border-border",
  PRO:        "bg-primary/10 text-primary border-primary/25",
  TEAM:       "bg-violet-500/10 text-violet-600 border-violet-500/25 dark:text-violet-400",
  ENTERPRISE: "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400",
};
