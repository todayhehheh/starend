import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "manager") redirect("/");

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-10 bg-[var(--color-card)] pixel-border border-x-0 border-t-0 px-4 py-3 flex items-center gap-4">
        <Link href="/admin" className="text-sm font-extrabold text-[var(--color-primary)]">
          🛠️ 관리자
        </Link>
        <div className="flex gap-3 flex-1">
          <Link href="/admin" className="text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-primary)]">
            참여자
          </Link>
          <Link href="/admin/missions" className="text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-primary)]">
            미션 관리
          </Link>
        </div>
        <Link href="/" className="text-xs text-[var(--color-muted)]">← 홈</Link>
      </nav>
      <div className="p-4">{children}</div>
    </div>
  );
}
