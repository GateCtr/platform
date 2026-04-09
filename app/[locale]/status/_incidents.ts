// Shared incidents data — used by both status page (preview) and history page (full)
// In production, replace with a DB/API fetch

export const INCIDENTS = [
  {
    id: "inc-003",
    date: new Date("2026-03-20"),
    title: "Elevated API latency",
    status: "resolved" as const,
    time: "14:32",
    description:
      "We identified and resolved elevated latency on the API gateway. All requests are processing normally.",
  },
  {
    id: "inc-002",
    date: new Date("2026-02-14"),
    title: "Job queue processing delay",
    status: "resolved" as const,
    time: "09:15",
    description:
      "A Redis connection issue caused delays in background job processing. The issue was resolved and all queued jobs completed.",
  },
  {
    id: "inc-001",
    date: new Date("2026-01-28"),
    title: "Database connection pool exhaustion",
    status: "resolved" as const,
    time: "22:47",
    description:
      "A spike in traffic exhausted the database connection pool. We scaled up the pool size and the issue was resolved.",
  },
];

export type Incident = (typeof INCIDENTS)[number];
