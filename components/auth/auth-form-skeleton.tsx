import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("auth-skeleton-bar", className)} aria-hidden />;
}

function OAuthRow() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <Bar className="h-10 w-full" />
      <Bar className="h-10 w-full" />
      <Bar className="h-10 w-full" />
    </div>
  );
}

function DividerRow() {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <Bar className="h-px flex-1 rounded-none opacity-45" />
      <Bar className="h-2.5 w-9 shrink-0 rounded-sm opacity-35" />
      <Bar className="h-px flex-1 rounded-none opacity-45" />
    </div>
  );
}

function FieldSkeleton({ narrowLabel }: { narrowLabel?: boolean }) {
  return (
    <div className="space-y-2">
      <Bar className={cn("h-4", narrowLabel ? "w-24" : "w-32")} />
      <Bar className="h-10 w-full" />
    </div>
  );
}

function CaptchaSlot() {
  return (
    <div className="flex min-h-[52px] items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2">
      <Bar className="h-8 w-full max-w-[280px] opacity-70" />
    </div>
  );
}

function PrimaryCtaSkeleton() {
  return <Bar className="h-11 w-full rounded-sm" />;
}

function FooterLinkSkeleton() {
  return (
    <div className="flex justify-center gap-1.5 pt-1">
      <Bar className="h-4 w-36 opacity-80" />
      <Bar className="h-4 w-20" />
    </div>
  );
}

/** Squelette du corps du formulaire (dans `AuthPageShell`), style apps pro. */
export function AuthFormSkeleton({
  variant,
}: {
  variant: "sign-in" | "sign-up" | "forgot-password";
}) {
  if (variant === "forgot-password") {
    return (
      <div className="space-y-4">
        <FieldSkeleton />
        <PrimaryCtaSkeleton />
        <Bar className="mx-auto h-9 w-40 rounded-md opacity-80" />
      </div>
    );
  }

  if (variant === "sign-up") {
    return (
      <div className="space-y-4">
        <OAuthRow />
        <DividerRow />
        <div className="space-y-4">
          <FieldSkeleton />
          <div className="grid grid-cols-2 gap-3">
            <FieldSkeleton narrowLabel />
            <FieldSkeleton narrowLabel />
          </div>
          <FieldSkeleton />
          <FieldSkeleton />
          <div className="flex gap-3 rounded-lg border border-border/50 bg-muted/15 p-3">
            <Bar className="mt-0.5 size-4 shrink-0 rounded-sm" />
            <div className="flex flex-1 flex-col gap-2">
              <Bar className="h-3.5 w-full" />
              <Bar className="h-3.5 w-[82%]" />
            </div>
          </div>
          <CaptchaSlot />
          <PrimaryCtaSkeleton />
        </div>
        <FooterLinkSkeleton />
      </div>
    );
  }

  /* sign-in */
  return (
    <div className="space-y-4">
      <OAuthRow />
      <DividerRow />
      <div className="space-y-4">
        <FieldSkeleton />
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Bar className="h-4 w-20" />
            <Bar className="h-3 w-28" />
          </div>
          <Bar className="h-10 w-full" />
        </div>
        <CaptchaSlot />
        <PrimaryCtaSkeleton />
      </div>
      <FooterLinkSkeleton />
    </div>
  );
}
