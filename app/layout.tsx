import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Syne, Geist } from "next/font/google";
import { cookies, headers } from "next/headers";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactQueryProvider } from "@/components/query-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ??
      process.env.NEXT_PUBLIC_MARKETING_URL ??
      "https://www.gatectr.com",
  ),
  alternates: {
    canonical:
      process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://www.gatectr.com",
  },
  title: "GateCtr — AI Cost Infrastructure for LLM APIs.",
  description:
    "Up to 40% fewer tokens on your LLM bill. From the first call. One endpoint swap. No code changes.",
  keywords: [
    "LLM cost reduction",
    "AI cost infrastructure",
    "token optimization",
    "LLM budget control",
    "prompt compression",
    "model router",
    "OpenAI cost",
    "Anthropic cost",
    "API gateway",
  ],
  authors: [{ name: "GateCtr" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GateCtr",
  },
  openGraph: {
    title: "GateCtr — AI Cost Infrastructure for LLM APIs.",
    description:
      "Up to 40% fewer tokens. Hard budget caps. Cost-aware routing. One endpoint swap.",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "GateCtr — One gateway. Every LLM.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GateCtr — AI Cost Infrastructure for LLM APIs.",
    description:
      "Up to 40% fewer tokens. Hard budget caps. Cost-aware routing. One endpoint swap.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Derive locale from URL pathname first, fall back to cookie
  const headerStore = await headers();
  const pathname =
    headerStore.get("x-pathname") ?? headerStore.get("x-invoke-path") ?? "";
  const localeFromPath = pathname.startsWith("/fr") ? "fr" : null;
  const cookieStore = await cookies();
  const locale =
    localeFromPath ?? cookieStore.get("NEXT_LOCALE")?.value ?? "en";

  return (
    <html
      lang={locale}
      className={cn(
        inter.variable,
        jetbrainsMono.variable,
        syne.variable,
        "font-sans",
        geist.variable,
      )}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
