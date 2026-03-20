"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useTranslations("settingsProfile.fields.theme");

  // resolvedTheme is undefined on SSR — use it to gate rendering
  if (!resolvedTheme) {
    return (
      <div className="h-9 w-48 rounded-md bg-muted animate-pulse" />
    );
  }

  return (
    <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted w-fit">
      {(
        [
          { value: "light", icon: Sun },
          { value: "system", icon: Monitor },
          { value: "dark", icon: Moon },
        ] as const
      ).map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
            theme === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="size-3.5" />
          {t(value)}
        </button>
      ))}
    </div>
  );
}
