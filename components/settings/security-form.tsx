"use client";

import { useTranslations } from "next-intl";
import { useUser, useSession, useSessionList, useClerk } from "@clerk/nextjs";
import { useState, useEffect, useTransition } from "react";

// Inline type — SessionWithActivitiesResource is not re-exported by @clerk/nextjs
type SessionActivity = {
  id: string;
  browserName?: string;
  browserVersion?: string;
  deviceType?: string;
  ipAddress?: string;
  city?: string;
  country?: string;
  isMobile?: boolean;
};

type SessionWithActivitiesResource = {
  id: string;
  status: string;
  lastActiveAt: Date;
  latestActivity: SessionActivity;
  revoke: () => Promise<SessionWithActivitiesResource>;
};

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Monitor,
  Smartphone,
  Eye,
  EyeOff,
  Check,
  MapPin,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";

// ─── Provider config ──────────────────────────────────────────────────────────

const PROVIDERS = ["google", "github", "gitlab"] as const;
type Provider = (typeof PROVIDERS)[number];

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "google") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    );
  }
  if (provider === "github") {
    return (
      <svg viewBox="0 0 24 24" className="size-4 fill-foreground" aria-hidden>
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.93 2a.43.43 0 01.58 0 .42.42 0 01.12.18l2.44 7.49h8.26l2.44-7.49a.42.42 0 01.12-.18.43.43 0 01.58 0 .42.42 0 01.12.18l2.44 7.51 1.22 3.78a.84.84 0 01-.3.94z"
        fill="#FC6D26"
      />
    </svg>
  );
}

// ─── Device icon ──────────────────────────────────────────────────────────────

function DeviceIcon({ isMobile }: { isMobile?: boolean }) {
  if (isMobile)
    return <Smartphone className="size-4 shrink-0 text-muted-foreground" />;
  return <Monitor className="size-4 shrink-0 text-muted-foreground" />;
}

// ─── Time helper ─────────────────────────────────────────────────────────────

function formatLastActive(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString();
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SecurityFormProps {
  email: string;
  hasPassword: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SecurityForm({ email, hasPassword }: SecurityFormProps) {
  const t = useTranslations("settingsSecurity");
  const { user, isLoaded } = useUser();
  const { session: currentSession } = useSession();
  const { sessions: liveSessionList, isLoaded: sessionsLoaded } =
    useSessionList();
  const clerk = useClerk();

  // Activity metadata from getSessions() — only for display (latestActivity)
  const [activityMap, setActivityMap] = useState<
    Record<string, SessionActivity>
  >({});

  // Connected accounts
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Password
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);
  const [isPwPending, startPwTransition] = useTransition();

  // Sessions
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    if (!user) return;
    user.getSessions().then((s) => {
      const map: Record<string, SessionActivity> = {};
      for (const session of s as SessionWithActivitiesResource[]) {
        map[session.id] = session.latestActivity;
      }
      setActivityMap(map);
    });
  }, [user]);

  if (!isLoaded || !user) return null;
  const loadedUser = user;

  // ── Connected accounts ──────────────────────────────────────────────────────

  const connectedProviders = new Set(
    loadedUser.externalAccounts.map((a) => a.provider as Provider),
  );
  const hasMultipleMethods =
    loadedUser.externalAccounts.length > 1 ||
    (loadedUser.externalAccounts.length >= 1 &&
      loadedUser.hasVerifiedEmailAddress);

  async function handleDisconnect(provider: Provider) {
    const account = loadedUser.externalAccounts.find(
      (a) => a.provider === provider,
    );
    if (!account) return;
    setDisconnecting(provider);
    setDisconnectError(null);
    try {
      await account.destroy();
      await loadedUser.reload();
    } catch {
      setDisconnectError(t("errors.disconnectFailed"));
    } finally {
      setDisconnecting(null);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleConnect(_provider: Provider) {
    setConnectError(null);
    // Clerk requires re-verification to add an OAuth account to an existing user.
    // The only supported path is through the Clerk-hosted user profile modal.
    clerk.openUserProfile();
  }

  // ── Password ────────────────────────────────────────────────────────────────

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSaved(false);
    if (newPw.length < 8) {
      setPwError(t("password.errorTooShort"));
      return;
    }
    startPwTransition(async () => {
      try {
        await loadedUser.updatePassword({
          currentPassword: hasPassword ? currentPw : undefined,
          newPassword: newPw,
        });
        setPwSaved(true);
        setCurrentPw("");
        setNewPw("");
        setTimeout(() => setPwSaved(false), 3000);
      } catch {
        setPwError(t("password.errorFailed"));
      }
    });
  }

  // ── Sessions ────────────────────────────────────────────────────────────────

  const otherSessions = (liveSessionList ?? []).filter(
    (s) => s.id !== currentSession?.id,
  );
  const currentLiveSession = (liveSessionList ?? []).find(
    (s) => s.id === currentSession?.id,
  );

  async function handleRevoke(sessionId: string) {
    const target = (liveSessionList ?? []).find((s) => s.id === sessionId);
    if (!target) return;
    setRevokingId(sessionId);
    setRevokeError(null);
    try {
      await target.end();
    } catch {
      setRevokeError(t("errors.revokeFailed"));
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAll() {
    setRevokingAll(true);
    setRevokeError(null);
    try {
      await Promise.all(otherSessions.map((s) => s.end()));
    } catch {
      setRevokeError(t("errors.revokeFailed"));
    } finally {
      setRevokingAll(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* ── Connected accounts ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">
            {t("sections.connectedAccounts")}
          </h2>
          <Separator className="mt-2" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("connectedAccounts.description")}
        </p>

        <div className="space-y-2">
          {PROVIDERS.map((provider) => {
            const isConnected = connectedProviders.has(provider);
            const canDisconnect = isConnected && hasMultipleMethods;
            const isLoading = disconnecting === provider;

            return (
              <div
                key={provider}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <ProviderIcon provider={provider} />
                  <span className="text-sm font-medium">
                    {t(`connectedAccounts.providers.${provider}`)}
                  </span>
                  {isConnected && (
                    <Badge variant="secondary" className="text-xs">
                      {t("connectedAccounts.connected")}
                    </Badge>
                  )}
                </div>
                {isConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canDisconnect || isLoading}
                    onClick={() => handleDisconnect(provider)}
                    title={
                      !canDisconnect
                        ? t("connectedAccounts.cannotDisconnect")
                        : undefined
                    }
                  >
                    {isLoading
                      ? t("sessions.revoking")
                      : t("connectedAccounts.disconnect")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(provider)}
                  >
                    {t("connectedAccounts.connect")}
                  </Button>
                )}{" "}
              </div>
            );
          })}
        </div>

        {disconnectError && (
          <p className="text-sm text-destructive">{disconnectError}</p>
        )}
        {connectError && (
          <p className="text-sm text-destructive">{connectError}</p>
        )}
      </section>

      {/* ── Password ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">{t("sections.password")}</h2>
          <Separator className="mt-2" />
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {hasPassword && (
            <div className="space-y-1.5">
              <Label htmlFor="current-password">
                {t("password.currentLabel")}
              </Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showCurrentPw ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="new-password">
              {hasPassword ? t("password.newLabel") : t("password.setLabel")}
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPw ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNewPw ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("password.hint")}
            </p>
          </div>

          {pwError && <p className="text-sm text-destructive">{pwError}</p>}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="cta-primary"
              size="sm"
              disabled={
                isPwPending || newPw.length < 8 || (hasPassword && !currentPw)
              }
            >
              {isPwPending
                ? t("password.saving")
                : hasPassword
                  ? t("password.update")
                  : t("password.set")}
            </Button>
            {pwSaved && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Check className="size-3.5 text-green-500" />
                {t("password.saved")}
              </span>
            )}
          </div>
        </form>
      </section>

      {/* ── Two-factor authentication ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">{t("sections.twoFactor")}</h2>
          <Separator className="mt-2" />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 opacity-60">
          <div className="flex items-center gap-3">
            <Shield className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t("twoFactor.disabled")}</p>
              <p className="text-xs text-muted-foreground">
                {t("twoFactor.comingSoon")}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {t("twoFactor.comingSoonBadge")}
          </Badge>
        </div>
      </section>

      {/* ── Active sessions ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">
            {t("sections.activeSessions")}
          </h2>
          <Separator className="mt-2" />
        </div>

        {!sessionsLoaded ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg border border-border bg-card animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {currentLiveSession && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <DeviceIcon
                    isMobile={activityMap[currentLiveSession.id]?.isMobile}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {activityMap[currentLiveSession.id]?.browserName ??
                        t("sessions.unknown")}
                      {activityMap[currentLiveSession.id]?.city && (
                        <> · {activityMap[currentLiveSession.id]?.city}</>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("sessions.lastActive")}{" "}
                      {formatLastActive(
                        new Date(currentLiveSession.lastActiveAt),
                      )}
                      {activityMap[currentLiveSession.id]?.ipAddress && (
                        <> · {activityMap[currentLiveSession.id]?.ipAddress}</>
                      )}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {t("sessions.current")}
                </Badge>
              </div>
            )}

            {otherSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1">
                {t("sessions.noOtherSessions")}
              </p>
            ) : (
              <>
                {otherSessions.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-opacity",
                      revokingId === s.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <DeviceIcon isMobile={activityMap[s.id]?.isMobile} />
                      <div>
                        <p className="text-sm font-medium">
                          {activityMap[s.id]?.browserName ??
                            t("sessions.unknown")}
                          {activityMap[s.id]?.city && (
                            <> · {activityMap[s.id]?.city}</>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("sessions.lastActive")}{" "}
                          {formatLastActive(new Date(s.lastActiveAt))}
                          {activityMap[s.id]?.ipAddress && (
                            <> · {activityMap[s.id]?.ipAddress}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={revokingId === s.id}
                      onClick={() => handleRevoke(s.id)}
                    >
                      {revokingId === s.id
                        ? t("sessions.revoking")
                        : t("sessions.revoke")}
                    </Button>
                  </div>
                ))}

                <Button
                  variant="cta-danger"
                  size="sm"
                  disabled={revokingAll}
                  onClick={handleRevokeAll}
                  className="mt-2"
                >
                  {revokingAll
                    ? t("sessions.revoking")
                    : t("sessions.revokeAll")}
                </Button>
              </>
            )}
          </div>
        )}

        {revokeError && (
          <p className="text-sm text-destructive">{revokeError}</p>
        )}
      </section>

      {/* ── Activity log ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">{t("sections.activityLog")}</h2>
          <Separator className="mt-2" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("activityLog.description")}
        </p>

        {!sessionsLoaded ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg border border-border bg-card animate-pulse"
              />
            ))}
          </div>
        ) : (liveSessionList ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">
            {t("activityLog.empty")}
          </p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            {(liveSessionList ?? []).map((s, i) => {
              const activity = activityMap[s.id];
              const isCurrent = s.id === currentSession?.id;
              return (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 text-sm",
                    i !== 0 && "border-t border-border",
                  )}
                >
                  <DeviceIcon isMobile={activity?.isMobile} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {activity?.browserName ?? t("sessions.unknown")}
                      {isCurrent && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          ({t("sessions.current")})
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {activity?.ipAddress && (
                        <span className="flex items-center gap-1">
                          <Globe className="size-3" />
                          {activity.ipAddress}
                        </span>
                      )}
                      {(activity?.city || activity?.country) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {[activity.city, activity.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatLastActive(new Date(s.lastActiveAt))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Danger zone ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-destructive">
            {t("sections.dangerZone")}
          </h2>
          <Separator className="mt-2" />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div>
            <p className="text-sm font-medium">{t("dangerZone.deleteTitle")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("dangerZone.deleteDescription")}
            </p>
          </div>
          <DeleteAccountDialog email={email} />
        </div>
      </section>
    </div>
  );
}
