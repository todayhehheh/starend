import BottomNav from "@/components/ui/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen pb-16">
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
