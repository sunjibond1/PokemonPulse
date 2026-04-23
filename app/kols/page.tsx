import { listPostsForKOLs, aggregateKOLs, CATEGORIES, type KOL } from "@/lib/airtable";
import { parseCats } from "@/lib/parseCats";
import CategoryFilter from "@/app/components/CategoryFilter";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

export const revalidate = 300;

const WINDOWS = [
  { value: "24", label: "24h" },
  { value: "168", label: "7d" },
  { value: "720", label: "30d" },
];

const SORTS = [
  { value: "engagement", label: "By engagement" },
  { value: "posts", label: "By posts" },
];

const CATEGORY_LABELS: Record<string, string> = {
  pokemon: "Pokémon",
  tcg: "TCG",
  collectibles: "Collectibles",
  web3: "Web3 & NFT",
};

function KOLCard({ kol, rank }: { kol: KOL; rank: number }) {
  return (
    <article className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex gap-4 items-start">
      <span className="text-neutral-600 text-sm font-mono w-6 flex-shrink-0 pt-0.5">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          {kol.author_avatar_url ? (
            <Image
              src={kol.author_avatar_url}
              alt={kol.author_name}
              width={40}
              height={40}
              className="rounded-full flex-shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neutral-700 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">
              {kol.author_name}
            </p>
            <p className="text-neutral-400 text-xs">@{kol.author_handle}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {kol.categories.map((cat) => (
            <span
              key={cat}
              className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400"
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-sm font-semibold">{kol.post_count}</p>
            <p className="text-xs text-neutral-500">Posts</p>
          </div>
          <div>
            <p className="text-sm font-semibold">
              {kol.avg_engagement.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">Avg eng.</p>
          </div>
          <div>
            <p className="text-sm font-semibold">
              {kol.total_likes.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">Likes</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function FilterBar({
  window: win,
  sort,
  searchParams,
}: {
  window: string;
  sort: string;
  searchParams: Record<string, string>;
}) {
  function buildHref(overrides: Record<string, string>) {
    const p = new URLSearchParams({ ...searchParams, ...overrides });
    return `/kols?${p.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex gap-1">
        {WINDOWS.map((w) => (
          <Link
            key={w.value}
            href={buildHref({ window: w.value })}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              win === w.value
                ? "bg-neutral-100 text-neutral-950 border-neutral-100"
                : "bg-transparent text-neutral-500 border-neutral-700 hover:border-neutral-500"
            }`}
          >
            {w.label}
          </Link>
        ))}
      </div>
      <div className="flex gap-1 ml-auto">
        {SORTS.map((s) => (
          <Link
            key={s.value}
            href={buildHref({ sort: s.value })}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              sort === s.value
                ? "bg-neutral-100 text-neutral-950 border-neutral-100"
                : "bg-transparent text-neutral-500 border-neutral-700 hover:border-neutral-500"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function KOLsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const flatSp: Record<string, string> = Object.fromEntries(
    Object.entries(sp)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => [k, v as string])
  );
  const urlParams = new URLSearchParams(flatSp);

  const activeCats = parseCats(urlParams);
  const win = flatSp.window && WINDOWS.some((w) => w.value === flatSp.window)
    ? flatSp.window
    : "168";
  const sort = flatSp.sort === "posts" ? "posts" : "engagement";

  let kols: KOL[] = [];
  let error: string | null = null;

  const missingEnv =
    !process.env.AIRTABLE_API_TOKEN || !process.env.AIRTABLE_BASE_ID;

  if (missingEnv) {
    error =
      "Airtable credentials not configured. Add AIRTABLE_API_TOKEN and AIRTABLE_BASE_ID to your .env file.";
  } else {
    try {
      const cats =
        activeCats.length === CATEGORIES.length ? undefined : activeCats;
      const posts = await listPostsForKOLs(Number(win), cats);
      kols = aggregateKOLs(posts, sort).slice(0, 30);
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load KOLs.";
      console.error(err);
    }
  }

  return (
    <main className="py-8">
      <Suspense>
        <CategoryFilter activeCats={activeCats} />
      </Suspense>

      <FilterBar window={win} sort={sort} searchParams={flatSp} />

      {error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : kols.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          No influencers found for this time window. Try a wider range.
        </p>
      ) : (
        <ol className="flex flex-col gap-4">
          {kols.map((kol, i) => (
            <li key={kol.author_handle}>
              <KOLCard kol={kol} rank={i + 1} />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
