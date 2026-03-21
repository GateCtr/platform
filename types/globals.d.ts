export {};

export type RoleName =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "DEVELOPER"
  | "VIEWER"
  | "SUPPORT";

export type PermissionName =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "analytics:read"
  | "analytics:export"
  | "billing:read"
  | "billing:write"
  | "system:read"
  | "audit:read";

declare global {
  interface CustomJwtSessionClaims {
    // Legacy shape — kept for backward compat if publicMetadata is ever used directly
    publicMetadata?: {
      onboardingComplete?: boolean;
      role?: RoleName;
      orgName?: string;
      usageType?: string;
    };
    // Shape set via Clerk Dashboard → Sessions → Customize session token:
    // { "metadata": "{{user.public_metadata}}" }
    metadata?: {
      onboardingComplete?: boolean;
      role?: RoleName;
      orgName?: string;
      usageType?: string;
    };
  }
}
