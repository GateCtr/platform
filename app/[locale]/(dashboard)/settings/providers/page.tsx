import { useTranslations } from "next-intl";

export default function ProvidersSettingsPage() {
  const t = useTranslations("settings.providers");

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>
      {/* TODO: LLMProviderKey list + add form */}
    </div>
  );
}
