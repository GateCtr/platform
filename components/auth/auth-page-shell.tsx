"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Card className="w-full max-w-[420px] border-border/80 shadow-lg shadow-black/5">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {title}
        </CardTitle>
        {subtitle ? (
          <CardDescription className="text-base">{subtitle}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6 pt-0">{children}</CardContent>
    </Card>
  );
}
