"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Random", emoji: "🎲" },
  { href: "/hall-of-fame", label: "Hall of Fame", emoji: "🏆" },
  { href: "/categories", label: "Categories", emoji: "📂" },
  { href: "/submit", label: "Submit", emoji: "📝" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] sm:hidden bg-bg/95 backdrop-blur-[20px] border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] py-2 px-3 transition-colors ${
                isActive ? "text-accent" : "text-text-muted"
              }`}
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="text-[10px] mt-0.5 font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
