"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SecretRevealProps {
  secret: string;
  warningLabel: string;
  copyLabel: string;
  copiedLabel: string;
  doneLabel: string;
  onDone: () => void;
}

export function SecretReveal({
  secret,
  warningLabel,
  copyLabel,
  copiedLabel,
  doneLabel,
  onDone,
}: SecretRevealProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3">
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
          {warningLabel}
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all select-all">
            {secret}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="size-3.5 text-green-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span className="ml-1.5">{copied ? copiedLabel : copyLabel}</span>
          </Button>
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="cta-primary" size="sm" onClick={onDone}>
          {doneLabel}
        </Button>
      </div>
    </div>
  );
}
