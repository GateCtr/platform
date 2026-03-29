import { Header } from "@/components/shared/header";

export default function DemoGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header variant="marketing" />
      {children}
    </div>
  );
}
