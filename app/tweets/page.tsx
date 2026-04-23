import { listTopPosts, type AirtablePost, CATEGORIES } from "@/lib/airtable";
import { parseCats } from "@/lib/parseCats";
import CategoryFilter from "@/app/components/CategoryFilter";
import Image from "next/image";
import { Suspense } from "react";

export const revalidate = 300;

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const CATEGORY_LABELS: Record<string, string> = {
  pokemon: "Pokémon",
  tcg: "TCG",
  collectibles: "Collectibles",
  web3: "Web3 & NFT",
};

function PostCard({ post }: { post: AirtablePost }) {
  const f = post.fields;
  const mediaUrls: string[] = (() => {
    try {
      return JSON.parse(f.media_urls || "[]");
    } catch {
      return [];
    }
  })();

  return (
    <article className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {f.author_avatar_url ? (
          <Image
            src={f.author_avatar_url}
            alt={f.author_name}
            width={40}
            height={40}
            className="rounded-full flex-shrink-0"
            unoptimized
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-neutral-700 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight">{f.author_name}</p>
          <p className="text-neutral-400 text-xs">@{f.author_handle}</p>
        </div>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 flex-shrink-0">
          {CATEGORY_LABELS[f.category] ?? f.category}
        </span>
      </div>

      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {f.text}
      </p>

      {mediaUrls.length > 0 && (
        <div className="rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrls[0]}
            alt="Post media"
            className="w-full object-cover max-h-72"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 pt-1">
        <span>♥ {(f.likes ?? 0).toLocaleString()}</span>
        <span>↩ {(f.retweets ?? 0).toLocaleString()}</span>
        <span>💬 {(f.replies ?? 0).toLocaleString()}</span>
        <span className="ml-auto">{f.scraped_at ? timeAgo(f.scraped_at) : ""}</span>
        <a
          href={f.tweet_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          View →
        </a>
      </div>
    </article>
  );
}

export default async function TweetsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const urlParams = new URLSearchParams(
    Object.entries(sp)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => [k, v as string])
  );
  const activeCats = parseCats(urlParams);

  let posts: AirtablePost[] = [];
  let error: string | null = null;

  const missingEnv =
    !process.env.AIRTABLE_API_TOKEN || !process.env.AIRTABLE_BASE_ID;

  if (missingEnv) {
    error =
      "Airtable credentials not configured. Add AIRTABLE_API_TOKEN and AIRTABLE_BASE_ID to your .env file, then restart the server.";
  } else {
    try {
      const cats =
        activeCats.length === CATEGORIES.length ? undefined : activeCats;
      posts = await listTopPosts(24, 20, cats);
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load posts.";
      console.error(err);
    }
  }

  const lastUpdated =
    posts.length > 0
      ? posts.reduce((latest, p) => {
          const ts = p.fields.scraped_at ?? "";
          return ts > latest ? ts : latest;
        }, "")
      : null;

  return (
    <main className="py-8">
      <div className="flex items-center justify-between mb-2">
        <Suspense>
          <CategoryFilter activeCats={activeCats} />
        </Suspense>
        {!error && posts.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white flex-shrink-0 ml-2 mb-6">
            total {posts.length}
          </span>
        )}
      </div>

      {error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : posts.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          No posts found for the last 24 hours. Check back after the next daily
          refresh.
        </p>
      ) : (
        <ol className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ol>
      )}

      <footer className="mt-12 text-xs text-neutral-600 flex flex-col gap-1">
        {lastUpdated && (
          <p>Last updated: {new Date(lastUpdated).toLocaleString()}</p>
        )}
      </footer>
    </main>
  );
}
