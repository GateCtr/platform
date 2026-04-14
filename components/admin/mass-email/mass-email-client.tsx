"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Send,
  Search,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  MassEmailRecipient,
  SendResult,
} from "@/app/[locale]/(admin)/admin/mass-email/_actions";
import { sendLaunchEmailBatch } from "@/app/[locale]/(admin)/admin/mass-email/_actions";

const PLAN_COLORS: Record<string, string> = {
  FREE: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  PRO: "bg-primary/10 text-primary",
  TEAM: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  ENTERPRISE:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

interface Props {
  recipients: MassEmailRecipient[];
}

export function MassEmailClient({ recipients }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.name ?? "").toLowerCase().includes(q) ||
        r.plan.toLowerCase().includes(q),
    );
  }, [recipients, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.add(r.id));
        return next;
      });
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSend() {
    setConfirmOpen(false);
    setResult(null);
    startTransition(async () => {
      const ids = Array.from(selected);
      const res = await sendLaunchEmailBatch(ids);
      setResult(res);
      if (res.sent > 0) setSelected(new Set());
    });
  }

  const selectedCount = selected.size;

  return (
    <div className="space-y-6">
      {/* ── Template preview card ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <CardTitle className="text-base">Email template</CardTitle>
          </div>
          <CardDescription>
            Launch announcement — Product Hunt exclusive offer (code{" "}
            <code className="font-mono font-bold text-primary">
              PRODUCTHUNT26
            </code>
            ). Sent in the recipient&apos;s locale (EN/FR).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-semibold text-foreground">Subject:</span> 🚀
              GateCtr is live on Product Hunt — exclusive offer inside
            </p>
            <p>
              <span className="font-semibold text-foreground">From:</span>{" "}
              {process.env.NEXT_PUBLIC_EMAIL_FROM ??
                "GateCtr <noreply@gatectr.io>"}
            </p>
            <p>
              <span className="font-semibold text-foreground">Includes:</span>{" "}
              PH upvote CTA · 3 months Pro promo code · feature list · maker
              note
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Result banner ─────────────────────────────────────────────── */}
      {result && (
        <Alert
          variant={result.failed > 0 ? "destructive" : "default"}
          className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
        >
          {result.failed === 0 ? (
            <CheckCircle2 className="size-4 text-green-600" />
          ) : (
            <AlertTriangle className="size-4" />
          )}
          <AlertTitle>
            {result.sent} sent · {result.failed} failed · {result.skipped}{" "}
            skipped
          </AlertTitle>
          {result.errors.length > 0 && (
            <AlertDescription className="mt-2 space-y-1">
              {result.errors.slice(0, 5).map((e) => (
                <p key={e.email} className="font-mono text-xs">
                  {e.email} — {e.reason}
                </p>
              ))}
              {result.errors.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{result.errors.length - 5} more errors
                </p>
              )}
            </AlertDescription>
          )}
        </Alert>
      )}

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name or plan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <span className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{selectedCount}</span>{" "}
              selected
            </span>
          )}
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={selectedCount === 0 || isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="size-4" />
                Send launch email ({selectedCount})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Recipients table ──────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 pl-4">
                  <button
                    onClick={toggleAll}
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      allFilteredSelected ? "Deselect all" : "Select all"
                    }
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="size-4" />
                    ) : (
                      <Square className="size-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Locale</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-10"
                  >
                    No recipients match your search.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => toggle(r.id)}
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={() => toggle(r.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {r.name ?? (
                          <span className="text-muted-foreground italic">
                            No name
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={PLAN_COLORS[r.plan] ?? PLAN_COLORS.FREE}
                    >
                      {r.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground uppercase">
                      {r.locale}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Confirmation dialog ───────────────────────────────────────── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Send launch email to {selectedCount} users?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will send the Product Hunt launch announcement to{" "}
              <span className="font-bold text-foreground">
                {selectedCount} recipients
              </span>
              . Each user will receive it once. This action cannot be undone.
              <br />
              <br />
              Estimated time:{" "}
              <span className="font-semibold">
                ~{Math.ceil(selectedCount * 0.12)} seconds
              </span>{" "}
              (rate-limited at ~8 emails/sec).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} className="gap-2">
              <Send className="size-4" />
              Send {selectedCount} emails
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
