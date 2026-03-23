"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface ProjectFilterProps {
  value: string;
  onChange: (projectId: string) => void;
  allLabel: string;
}

export function ProjectFilter({
  value,
  onChange,
  allLabel,
}: ProjectFilterProps) {
  const { data } = useQuery<{ projects: Project[] }>({
    queryKey: ["projects-list"],
    queryFn: () => fetch("/api/v1/projects").then((r) => r.json()),
    staleTime: 60_000,
  });

  const projects = data?.projects ?? [];
  if (projects.length === 0) return null;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-[160px] text-xs">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
