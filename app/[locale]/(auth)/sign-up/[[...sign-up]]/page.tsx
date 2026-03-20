import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignUpClient } from "./sign-up-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.metadata.signUp" });
  return { title: t("title"), description: t("description") };
}

export default function SignUpPage() {
  return <SignUpClient />;
}
