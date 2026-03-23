"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DateRangePreset = "7d" | "30d" | "this_month" | "last_month";

interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

interface DateRangePickerProps {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset, range: DateRange) => void;
  labels: {
    last7: string;
    last30: string;
    thisMonth: string;
    lastMonth: string;
  };
}

function presetToRange(preset: DateRangePreset): DateRange {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (preset) {
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: fmt(from), to: fmt(now) };
    }
    case "30d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: fmt(from), to: fmt(now) };
    }
    case "this_month": {
      const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      return { from, to: fmt(now) };
    }
    case "last_month": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(first), to: fmt(last) };
    }
  }
}

export function DateRangePicker({
  value,
  onChange,
  labels,
}: DateRangePickerProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const preset = v as DateRangePreset;
        onChange(preset, presetToRange(preset));
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7d">{labels.last7}</SelectItem>
        <SelectItem value="30d">{labels.last30}</SelectItem>
        <SelectItem value="this_month">{labels.thisMonth}</SelectItem>
        <SelectItem value="last_month">{labels.lastMonth}</SelectItem>
      </SelectContent>
    </Select>
  );
}

export { presetToRange };
