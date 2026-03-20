"use client";

import { useQuery } from "@tanstack/react-query";

interface UsageSummary {
  plan: string;
  tokensUsed: number;
  tokensLimit: number | null;
}

async function fetchUsageSummary(): Promise<UsageSummary> {
  const res = await fetch("/api/v1/usage/summary");
  if (!res.ok) throw new Error("Failed to fetch usage");
  return res.json() as Promise<UsageSummary>;
}

export function useUsageSummary() {
  return useQuery({
    queryKey: ["usage-summary"],
    queryFn: fetchUsageSummary,
    staleTime: 60_000, // 1 min
    refetchOnWindowFocus: false,
  });
}
