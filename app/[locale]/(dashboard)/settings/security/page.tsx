import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { SecurityForm } from "@/components/settings/security-form";

export async function generateMetadata() {
  const t = await getTranslations("settingsSecurity.page");
  return { title: t("title") };
}

export default async function SecuritySettingsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const [t, dbUser, clerk] = await Promise.all([
    getTranslations("settingsSecurity"),
    prisma.user.findUnique({ where: { clerkId } }),
    clerkClient(),
  ]);

  if (!dbUser) redirect("/sign-in");

  const clerkUser = await clerk.users.getUser(clerkId);
  const hasPassword = clerkUser.passwordEnabled;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t("page.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("page.description")}
        </p>
      </div>
      <SecurityForm email={dbUser.email} hasPassword={hasPassword} />
    </div>
  );
}
