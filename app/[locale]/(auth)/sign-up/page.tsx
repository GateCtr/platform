import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignUpForm } from "@/components/auth/sign-up-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "auth.metadata.signUp",
  });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; ref?: string }>;
}) {
  const sp = await searchParams;
  const waitlistEnabled = process.env.ENABLE_WAITLIST === "true";

  return (
    <SignUpForm
      initialInviteCode={sp.invite ?? ""}
      waitlistEnabled={waitlistEnabled}
      initialRef={sp.ref ?? ""}
    />
  );
}
