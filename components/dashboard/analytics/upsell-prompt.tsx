import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface UpsellPromptProps {
  title: string;
  description: string;
  ctaLabel: string;
}

export function UpsellPrompt({
  title,
  description,
  ctaLabel,
}: UpsellPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
      <Lock className="size-6 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Button variant="cta-accent" size="sm" asChild>
        <Link href="/billing">{ctaLabel}</Link>
      </Button>
    </div>
  );
}
