"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const COOKIE_NAME = "gatectr_utm";
const COOKIE_TTL_DAYS = 30;

interface UTMData {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  ref?: string;
  capturedAt: string;
  landingPage: string;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function UTMCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const source = searchParams.get("utm_source") ?? undefined;
    const medium = searchParams.get("utm_medium") ?? undefined;
    const campaign = searchParams.get("utm_campaign") ?? undefined;
    const content = searchParams.get("utm_content") ?? undefined;
    const ref = searchParams.get("ref") ?? undefined;

    // Only write cookie if there's something to capture
    if (!source && !medium && !campaign && !ref) return;

    const data: UTMData = {
      source,
      medium,
      campaign,
      content,
      ref,
      capturedAt: new Date().toISOString(),
      landingPage: window.location.pathname,
    };

    setCookie(COOKIE_NAME, JSON.stringify(data), COOKIE_TTL_DAYS);
  }, [searchParams]);

  return null;
}
