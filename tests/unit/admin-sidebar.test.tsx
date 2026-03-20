/**
 * Unit Tests for AdminSidebar Component
 *
 * Tests that the sidebar filters menu items based on the current user's
 * permissions, covering SUPER_ADMIN (all items), MANAGER (limited items),
 * and SUPPORT (users + audit logs only).
 *
 * Validates Requirements: 6.5, 6.6, 6.7
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminSidebar } from "@/components/admin/sidebar";
import type { Permission } from "@/lib/permissions";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/users",
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: null }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  SidebarMenuButton: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => asChild ? <>{children}</> : <button>{children}</button>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  SidebarSeparator: () => <hr />,
  SidebarTrigger: () => <button />,
  useSidebar: () => ({ state: "expanded", open: true }),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AvatarImage: () => null,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/shared/logo", () => ({
  Logo: () => <div>Logo</div>,
}));

import { usePermissions } from "@/hooks/use-permissions";

const mockUsePermissions = vi.mocked(usePermissions);

// ─── Permission sets per role ─────────────────────────────────────────────────

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  "users:read",
  "users:write",
  "analytics:read",
  "billing:read",
  "system:read",
  "audit:read",
];

const MANAGER_PERMISSIONS: Permission[] = [
  "analytics:read",
  "users:read",
  "billing:read",
];

const SUPPORT_PERMISSIONS: Permission[] = ["users:read", "audit:read"];

const DEVELOPER_PERMISSIONS: Permission[] = ["analytics:read"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockPermissions(permissions: Permission[], isLoading = false) {
  mockUsePermissions.mockReturnValue({
    data: permissions,
    isLoading,
  } as ReturnType<typeof usePermissions>);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AdminSidebar", () => {
  describe("loading state", () => {
    it("renders nothing while permissions are loading", () => {
      mockPermissions([], true);

      render(<AdminSidebar />);

      // While loading, skeletons are shown instead of nav items
      expect(screen.queryByText("sidebar.users")).not.toBeInTheDocument();
      expect(screen.queryByText("sidebar.plans")).not.toBeInTheDocument();
    });
  });

  describe("SUPER_ADMIN – sees all menu items", () => {
    it("renders all 6 menu items", () => {
      mockPermissions(SUPER_ADMIN_PERMISSIONS);

      render(<AdminSidebar />);

      expect(screen.getByText("sidebar.users")).toBeInTheDocument();
      expect(screen.getByText("sidebar.billing")).toBeInTheDocument();
      expect(screen.getByText("sidebar.featureFlags")).toBeInTheDocument();
      expect(screen.getByText("sidebar.auditLogs")).toBeInTheDocument();
      expect(screen.getByText("sidebar.systemHealth")).toBeInTheDocument();
      expect(screen.getByText("sidebar.waitlist")).toBeInTheDocument();
    });

    it("renders links with correct hrefs", () => {
      mockPermissions(SUPER_ADMIN_PERMISSIONS);

      render(<AdminSidebar />);

      expect(
        screen.getByRole("link", { name: "sidebar.users" }),
      ).toHaveAttribute("href", "/admin/users");
      expect(
        screen.getByRole("link", { name: "sidebar.billing" }),
      ).toHaveAttribute("href", "/admin/billing");
      expect(
        screen.getByRole("link", { name: "sidebar.featureFlags" }),
      ).toHaveAttribute("href", "/admin/feature-flags");
      expect(
        screen.getByRole("link", { name: "sidebar.auditLogs" }),
      ).toHaveAttribute("href", "/admin/audit-logs");
      expect(
        screen.getByRole("link", { name: "sidebar.systemHealth" }),
      ).toHaveAttribute("href", "/admin/system");
      expect(
        screen.getByRole("link", { name: "sidebar.waitlist" }),
      ).toHaveAttribute("href", "/admin/waitlist");
    });
  });

  describe("MANAGER – sees analytics, users, billing items", () => {
    it("renders Users, billing, and Waitlist (users:read + billing:read)", () => {
      mockPermissions(MANAGER_PERMISSIONS);

      render(<AdminSidebar />);

      expect(screen.getByText("sidebar.users")).toBeInTheDocument();
      expect(screen.getByText("sidebar.billing")).toBeInTheDocument();
      expect(screen.getByText("sidebar.waitlist")).toBeInTheDocument();
    });

    it("does not render Feature Flags, Audit Logs, or System Health", () => {
      mockPermissions(MANAGER_PERMISSIONS);

      render(<AdminSidebar />);

      expect(screen.queryByText("sidebar.featureFlags")).not.toBeInTheDocument();
      expect(screen.queryByText("sidebar.auditLogs")).not.toBeInTheDocument();
      expect(screen.queryByText("sidebar.systemHealth")).not.toBeInTheDocument();
    });
  });

  describe("SUPPORT – sees only Users and Audit Logs", () => {
    it("renders Users and Audit Logs", () => {
      mockPermissions(SUPPORT_PERMISSIONS);

      render(<AdminSidebar />);

      expect(screen.getByText("sidebar.users")).toBeInTheDocument();
      expect(screen.getByText("sidebar.auditLogs")).toBeInTheDocument();
    });

    it("does not render Plans, Feature Flags, System Health, or Waitlist", () => {
      mockPermissions(SUPPORT_PERMISSIONS);

      render(<AdminSidebar />);

      expect(screen.queryByText("sidebar.plans")).not.toBeInTheDocument();
      expect(
        screen.queryByText("sidebar.featureFlags"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("sidebar.systemHealth"),
      ).not.toBeInTheDocument();
    });

    it("renders Waitlist (also requires users:read)", () => {
      mockPermissions(SUPPORT_PERMISSIONS);

      render(<AdminSidebar />);

      expect(screen.getByText("sidebar.waitlist")).toBeInTheDocument();
    });
  });

  describe("DEVELOPER/VIEWER – sees only analytics items", () => {
    it("renders no menu items when user only has analytics:read", () => {
      mockPermissions(DEVELOPER_PERMISSIONS);

      render(<AdminSidebar />);

      expect(screen.queryByText("sidebar.users")).not.toBeInTheDocument();
      expect(screen.queryByText("sidebar.plans")).not.toBeInTheDocument();
      expect(
        screen.queryByText("sidebar.featureFlags"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("sidebar.auditLogs")).not.toBeInTheDocument();
      expect(
        screen.queryByText("sidebar.systemHealth"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("sidebar.waitlist")).not.toBeInTheDocument();
    });
  });

  describe("empty permissions", () => {
    it("renders no menu items when user has no permissions", () => {
      mockPermissions([]);

      render(<AdminSidebar />);

      expect(screen.queryByText("sidebar.users")).not.toBeInTheDocument();
      expect(screen.queryByText("sidebar.plans")).not.toBeInTheDocument();
      expect(
        screen.queryByText("sidebar.featureFlags"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("sidebar.auditLogs")).not.toBeInTheDocument();
      expect(
        screen.queryByText("sidebar.systemHealth"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("sidebar.waitlist")).not.toBeInTheDocument();
    });
  });

  describe("permission-based filtering", () => {
    it("shows Feature Flags and System Health only when user has system:read", () => {
      mockPermissions(["system:read"]);

      render(<AdminSidebar />);

      expect(screen.getByText("sidebar.featureFlags")).toBeInTheDocument();
      expect(screen.getByText("sidebar.systemHealth")).toBeInTheDocument();
      expect(screen.queryByText("sidebar.users")).not.toBeInTheDocument();
    });

    it("shows both Users and Waitlist when user has users:read", () => {
      mockPermissions(["users:read"]);

      render(<AdminSidebar />);

      expect(screen.getByText("sidebar.users")).toBeInTheDocument();
      expect(screen.getByText("sidebar.waitlist")).toBeInTheDocument();
    });

    it("shows Plans only when user has billing:read", () => {
      mockPermissions(["billing:read"]);

      render(<AdminSidebar />);

      expect(screen.getByText("sidebar.billing")).toBeInTheDocument();
      expect(screen.queryByText("sidebar.users")).not.toBeInTheDocument();
    });
  });
});
