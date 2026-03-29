"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

export interface ModelRow {
  model: string;
  provider: string;
  totalTokens: number;
  totalRequests: number;
  totalCostUsd: number;
  savedTokens: number;
}

interface ModelBreakdownTableProps {
  data: ModelRow[];
  labels: {
    model: string;
    provider: string;
    tokens: string;
    requests: string;
    cost: string;
    saved: string;
  };
}

const col = createColumnHelper<ModelRow>();

export function ModelBreakdownTable({
  data,
  labels,
}: ModelBreakdownTableProps) {
  "use no memo";
  const columns = [
    col.accessor("model", { header: labels.model }),
    col.accessor("provider", { header: labels.provider }),
    col.accessor("totalTokens", {
      header: labels.tokens,
      cell: (i) => i.getValue().toLocaleString(),
    }),
    col.accessor("totalRequests", {
      header: labels.requests,
      cell: (i) => i.getValue().toLocaleString(),
    }),
    col.accessor("totalCostUsd", {
      header: labels.cost,
      cell: (i) => `$${i.getValue().toFixed(4)}`,
    }),
    col.accessor("savedTokens", {
      header: labels.saved,
      cell: (i) => i.getValue().toLocaleString(),
    }),
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-t hover:bg-muted/30 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2 tabular-nums">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
