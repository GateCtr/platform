import type { UserRow, SortField, SortDir } from "./types";

export function formatRelative(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return locale === "fr" ? "À l'instant" : "Just now";
  if (diffMins < 60)
    return locale === "fr" ? `Il y a ${diffMins}m` : `${diffMins}m ago`;
  if (diffHours < 24)
    return locale === "fr" ? `Il y a ${diffHours}h` : `${diffHours}h ago`;
  if (diffDays < 7)
    return locale === "fr" ? `Il y a ${diffDays}j` : `${diffDays}d ago`;
  return date.toLocaleDateString(locale);
}

export function sortUsers(
  users: UserRow[],
  field: SortField,
  dir: SortDir,
): UserRow[] {
  return [...users].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "name":
        cmp = (a.name ?? a.email).localeCompare(b.name ?? b.email);
        break;
      case "plan": {
        const order = { FREE: 0, PRO: 1, TEAM: 2, ENTERPRISE: 3 };
        cmp = (order[a.plan] ?? 0) - (order[b.plan] ?? 0);
        break;
      }
      case "createdAt":
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "lastLoginAt":
        cmp =
          (a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0) -
          (b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0);
        break;
      case "tokenUsage":
        cmp = a.tokenUsage - b.tokenUsage;
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

export function exportCsv(users: UserRow[]) {
  const headers = [
    "Name",
    "Email",
    "Plan",
    "Status",
    "Roles",
    "Tokens (30d)",
    "Projects",
    "Joined",
    "Last Login",
  ];
  const rows = users.map((u) => [
    u.name ?? "",
    u.email,
    u.plan,
    u.isBanned ? "banned" : u.isActive ? "active" : "suspended",
    u.roles.map((r) => r.name).join("|"),
    u.tokenUsage,
    u.projectCount,
    new Date(u.createdAt).toISOString().split("T")[0],
    u.lastLoginAt ? new Date(u.lastLoginAt).toISOString().split("T")[0] : "",
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
