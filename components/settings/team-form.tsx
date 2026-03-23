"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  UserPlus,
  Trash2,
  CheckCircle2,
  Crown,
  Shield,
  Eye,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  inviteMember,
  removeMember,
  revokeInvitation,
} from "@/app/[locale]/(dashboard)/settings/team/_actions";

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { name: string | null; email: string };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  invitedBy: { name: string | null; email: string } | null;
}

interface TeamFormProps {
  members: Member[];
  invitations: Invitation[];
  currentUserId: string;
  isPro: boolean;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  OWNER: <Crown className="size-3" />,
  ADMIN: <Shield className="size-3" />,
  MEMBER: <User className="size-3" />,
  VIEWER: <Eye className="size-3" />,
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  MEMBER: "bg-muted text-muted-foreground",
  VIEWER: "bg-muted text-muted-foreground",
};

function Avatar({ name, email }: { name: string | null; email: string }) {
  const label = (name ?? email)[0].toUpperCase();
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold shrink-0 select-none">
      {label}
    </div>
  );
}

export function TeamForm({
  members: initialMembers,
  invitations: initialInvitations,
  currentUserId,
  isPro,
}: TeamFormProps) {
  const t = useTranslations("settingsTeam");
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [role, setRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const emailError = emailTouched && !emailValid;

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviting(true);
    const fd = new FormData();
    fd.set("email", email);
    fd.set("role", role);
    const res = await inviteMember(fd);
    setInviting(false);
    if (res.error) {
      showToast("error", t(`errors.${res.error}` as Parameters<typeof t>[0]));
    } else {
      setEmail("");
      setEmailTouched(false);
      setInvitations((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          email,
          role,
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          invitedBy: null,
        },
      ]);
      showToast("success", t("success.invited"));
    }
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    const res = await removeMember(memberId);
    setRemovingId(null);
    if (res.error) {
      showToast("error", t("errors.internal_error"));
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showToast("success", t("success.removed"));
    }
  }

  async function handleRevoke(invitationId: string) {
    setRevokingId(invitationId);
    const res = await revokeInvitation(invitationId);
    setRevokingId(null);
    if (res.error) {
      showToast("error", t("errors.internal_error"));
    } else {
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      showToast("success", t("success.revoked"));
    }
  }

  if (!isPro) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted mx-auto">
          <UserPlus className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{t("planGate.title")}</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          {t("planGate.description")}
        </p>
        <Button variant="cta-accent" size="sm" className="mt-2">
          {t("planGate.cta")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Members list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("sections.members")}
          </p>
        </div>
        <div className="divide-y divide-border">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={m.user.name} email={m.user.email} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {m.user.name ?? m.user.email}
                    {m.userId === currentUserId && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({t("member.you")})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[m.role] ?? ROLE_COLORS.MEMBER}`}
                >
                  {ROLE_ICONS[m.role]}
                  {t(`roles.${m.role}` as Parameters<typeof t>[0])}
                </span>
                {m.userId !== currentUserId && m.role !== "OWNER" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("member.confirmRemove")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("member.confirmRemoveDescription")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t("member.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemove(m.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {removingId === m.id
                            ? t("member.removing")
                            : t("member.confirmRemoveAction")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("sections.pending")}
            </p>
          </div>
          <div className="divide-y divide-border">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between px-5 py-3.5 gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`roles.${inv.role}` as Parameters<typeof t>[0])}
                    {" · "}
                    {t("invitation.expires", {
                      date: new Date(inv.expiresAt).toLocaleDateString(),
                    })}
                    {inv.invitedBy && (
                      <>
                        {" · "}
                        {t("invitation.invitedBy", {
                          name: inv.invitedBy.name ?? inv.invitedBy.email,
                        })}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {t("sections.pending")}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 text-muted-foreground hover:text-destructive"
                    disabled={revokingId === inv.id}
                    onClick={() => handleRevoke(inv.id)}
                    title={t("invitation.revoke")}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("sections.invite")}
        </p>
        <form onSubmit={handleInvite} className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="invite-email">{t("invite.email")}</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder={t("invite.emailPlaceholder")}
              className={
                emailError
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />
            {emailError && (
              <p className="text-xs text-destructive">
                {t("errors.invalid_email")}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t("invite.role")}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">{t("roles.ADMIN")}</SelectItem>
                <SelectItem value="MEMBER">{t("roles.MEMBER")}</SelectItem>
                <SelectItem value="VIEWER">{t("roles.VIEWER")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={inviting || !emailValid}
            variant="cta-primary"
          >
            {inviting ? t("invite.submitting") : t("invite.submit")}
          </Button>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 shadow-lg text-sm">
          <CheckCircle2
            className={`size-4 shrink-0 ${toast.type === "success" ? "text-emerald-500" : "text-destructive"}`}
          />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
