"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "홈", emoji: "🏠" },
  { href: "/missions", label: "미션", emoji: "📋" },
  { href: "/feed", label: "피드", emoji: "💬" },
  { href: "/shop", label: "상점", emoji: "🛒" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[var(--color-card)] border-t-2 border-[var(--color-border)] flex z-50">
      {NAV_ITEMS.map(({ href, label, emoji }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-bold transition-colors ${
              isActive
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-muted)]"
            }`}
          >
            <span className="text-xl leading-none">{emoji}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
