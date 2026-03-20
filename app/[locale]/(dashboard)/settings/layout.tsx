import { SettingsSidebar } from "@/components/settings/settings-sidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 -m-4 md:-m-6">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 min-w-0">
        {children}
      </main>
    </div>
  );
}
