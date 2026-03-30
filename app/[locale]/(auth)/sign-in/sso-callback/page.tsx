import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SsoCallbackClient } from "@/components/auth/sso-callback-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "auth.metadata.signIn",
  });
  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default function SsoCallbackPage() {
  return (
    <div className="flex min-h-[200px] w-full max-w-md flex-col items-center justify-center">
      <SsoCallbackClient />
    </div>
  );
}
