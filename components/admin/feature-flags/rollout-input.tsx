"use client";

import * as React from "react";
import { validateRolloutPct } from "@/lib/admin/utils";
import { cn } from "@/lib/utils";

interface RolloutInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  errorLabel?: string; // i18n error string
}

export function RolloutInput({
  value,
  onChange,
  disabled,
  errorLabel,
}: RolloutInputProps) {
  const [raw, setRaw] = React.useState(String(value));
  const [error, setError] = React.useState<string | null>(null);

  // Sync external value changes (e.g. optimistic revert)
  React.useEffect(() => {
    setRaw(String(value));
    setError(null);
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const str = e.target.value;
    setRaw(str);
    const num = Number(str);
    const result = validateRolloutPct(num);
    if (!result.valid) {
      setError(errorLabel ?? result.error);
    } else {
      setError(null);
      onChange(num);
    }
  }

  function handleBlur() {
    const num = Number(raw);
    const result = validateRolloutPct(num);
    if (!result.valid) {
      // Revert to last valid value
      setRaw(String(value));
      setError(null);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={raw}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          aria-invalid={!!error}
          className={cn(
            "h-7 w-16 rounded-md border bg-background px-2 text-sm tabular-nums",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:ring-destructive",
          )}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
