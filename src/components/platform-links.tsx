const platforms = [
  {
    name: "Vercel",
    url: "https://vercel.com/dashboard",
    description: "Hosting & Deployments",
    category: "Hosting",
  },
  {
    name: "Supabase",
    url: "https://supabase.com/dashboard",
    description: "PostgreSQL & Auth",
    category: "Database",
  },
  {
    name: "GitHub",
    url: "https://github.com/rseckler",
    description: "Repositories",
    category: "DevOps",
  },
  {
    name: "Hostinger VPS",
    url: "https://hpanel.hostinger.com",
    description: "VPS 72.62.148.205",
    category: "Hosting",
  },
  {
    name: "Upstash",
    url: "https://console.upstash.com",
    description: "Redis & Kafka",
    category: "Database",
  },
  {
    name: "Notion",
    url: "https://www.notion.so",
    description: "Docs & Databases",
    category: "Productivity",
  },
  {
    name: "Sanity",
    url: "https://www.sanity.io/manage",
    description: "Headless CMS",
    category: "CMS",
  },
  {
    name: "Stripe",
    url: "https://dashboard.stripe.com",
    description: "Payments",
    category: "Payments",
  },
  {
    name: "Kraken",
    url: "https://www.kraken.com",
    description: "Crypto Exchange",
    category: "Trading",
  },
  {
    name: "Bybit",
    url: "https://www.bybit.com",
    description: "Crypto Futures",
    category: "Trading",
  },
  {
    name: "Alpha Vantage",
    url: "https://www.alphavantage.co",
    description: "Stock Market API",
    category: "APIs",
  },
  {
    name: "OpenAI",
    url: "https://platform.openai.com",
    description: "GPT & TTS APIs",
    category: "APIs",
  },
  {
    name: "Anthropic",
    url: "https://console.anthropic.com",
    description: "Claude API",
    category: "APIs",
  },
  {
    name: "Dropbox",
    url: "https://www.dropbox.com",
    description: "Excel-Sync (Blackfire)",
    category: "Storage",
  },
];

const categoryColors: Record<string, string> = {
  Hosting: "text-blue-400",
  Database: "text-emerald-400",
  DevOps: "text-orange-400",
  Productivity: "text-yellow-400",
  CMS: "text-pink-400",
  Payments: "text-violet-400",
  Trading: "text-amber-400",
  APIs: "text-cyan-400",
  Storage: "text-teal-400",
};

export function PlatformLinks() {
  return (
    <section className="mt-10 border-t border-zinc-800 pt-8">
      <h2 className="mb-4 text-lg font-semibold text-zinc-300">
        Technische Plattformen
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {platforms.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-all hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-200 group-hover:text-white">
                  {p.name}
                </span>
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider ${categoryColors[p.category] ?? "text-zinc-500"}`}
                >
                  {p.category}
                </span>
              </div>
              <p className="text-xs text-zinc-500">{p.description}</p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-zinc-600 group-hover:text-zinc-400"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        ))}
      </div>
    </section>
  );
}
