import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/settings/profile-form";

export async function generateMetadata() {
  const t = await getTranslations("settingsProfile.page");
  return { title: t("title") };
}

export default async function ProfileSettingsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const [user, locale] = await Promise.all([
    prisma.user.findUnique({ where: { clerkId } }),
    getLocale(),
  ]);

  if (!user) redirect("/sign-in");

  return (
    <ProfileForm
      name={user.name ?? ""}
      email={user.email}
      avatarUrl={user.avatarUrl}
      authProvider={user.authProvider}
      locale={locale}
    />
  );
}
