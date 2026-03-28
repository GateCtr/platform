import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Owner {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  avatarUrl: string | null;
}

interface TeamMetaCardProps {
  owner: Owner;
  createdAt: string;
  slug: string;
}

const PLAN_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  FREE: "outline",
  PRO: "secondary",
  TEAM: "default",
  ENTERPRISE: "default",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function TeamMetaCard({ owner, createdAt, slug }: TeamMetaCardProps) {
  const t = useTranslations("adminTeams.detail");

  const initials = (owner.name ?? owner.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("metadata")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("slug")}
            </dt>
            <dd className="font-mono text-sm">{slug}</dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("created")}
            </dt>
            <dd className="text-sm">{formatDate(createdAt)}</dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("owner")}
            </dt>
            <dd className="flex items-center gap-2">
              <Avatar className="size-6 rounded-md">
                <AvatarImage src={owner.avatarUrl ?? undefined} alt={owner.name ?? owner.email} />
                <AvatarFallback className="text-[10px] rounded-md">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                {owner.name && (
                  <span className="text-sm font-medium truncate">{owner.name}</span>
                )}
                <span className="text-xs text-muted-foreground truncate">{owner.email}</span>
              </div>
            </dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("plan")}
            </dt>
            <dd>
              <Badge variant={PLAN_VARIANT[owner.plan] ?? "outline"}>
                {owner.plan}
              </Badge>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
