"use client";

import { usePathname } from "next/navigation";

const links = [
  { href: "https://thehotshit.de", label: "Services" },
  { href: "/cron-jobs", label: "Cron Jobs", internal: true },
  { href: "/", label: "Status", internal: true },
  { href: "https://stocks.thehotshit.de", label: "Stocks" },
  { href: "https://invest.thehotshit.de", label: "Invest" },
];

export function Navbar() {
  const pathname = usePathname();

  function isActive(link: (typeof links)[number]) {
    if (!link.internal) return false;
    if (link.href === "/") return pathname === "/";
    return pathname?.startsWith(link.href) ?? false;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5">
        <a
          href="https://thehotshit.de"
          className="text-sm font-bold text-white hover:text-zinc-300 transition-colors"
        >
          thehotshit.de
        </a>
        <div className="flex gap-0.5 rounded-lg bg-zinc-800/50 p-0.5">
          {links.map((link) => {
            const active = isActive(link);
            const Tag = link.internal ? "a" : "a";
            return (
              <a
                key={link.href}
                href={link.internal ? link.href : link.href}
                className={`rounded-md px-3.5 py-1 text-[13px] font-medium transition-all ${
                  active
                    ? "bg-zinc-700/60 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
