import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

interface TeamProjectsListProps {
  projects: Project[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TeamProjectsList({ projects }: TeamProjectsListProps) {
  const t = useTranslations("adminTeams.projects");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {projects.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    {t("columns.name")}
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    {t("columns.slug")}
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    {t("columns.status")}
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    {t("columns.created")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{project.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {project.slug}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={project.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {project.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(project.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
