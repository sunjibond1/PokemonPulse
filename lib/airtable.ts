const BASE_URL = "https://api.airtable.com/v0";

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE = process.env.AIRTABLE_TABLE_NAME ?? "Posts";
const TOKEN = process.env.AIRTABLE_API_TOKEN!;

const headers = () => ({
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
});

export type Category = "pokemon" | "tcg" | "collectibles" | "web3";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "pokemon", label: "Pokémon" },
  { value: "tcg", label: "TCG" },
  { value: "collectibles", label: "Collectibles" },
  { value: "web3", label: "Web3 & NFT" },
];

export type AirtablePost = {
  id: string;
  fields: {
    tweet_id: string;
    author_handle: string;
    author_name: string;
    author_avatar_url: string;
    text: string;
    likes: number;
    retweets: number;
    replies: number;
    views: number | null;
    engagement_score: number;
    media_urls: string;
    tweet_url: string;
    tweet_created_at: string;
    scraped_at: string;
    category: Category;
  };
};

export type PostInput = {
  tweet_id: string;
  author_handle: string;
  author_name: string;
  author_avatar_url: string;
  text: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number | null;
  media_urls: string;
  tweet_url: string;
  tweet_created_at: string;
  category: string;
};

export type KOL = {
  author_handle: string;
  author_name: string;
  author_avatar_url: string;
  post_count: number;
  total_likes: number;
  total_retweets: number;
  total_replies: number;
  avg_engagement: number;
  relevance_score: number;
  categories: Category[];
};

function buildCatFormula(categories?: string[]): string | null {
  if (!categories || categories.length === 0) return null;
  return `OR(${categories.map((c) => `{category}="${c}"`).join(",")})`;
}

async function fetchAllPages(url: string): Promise<AirtablePost[]> {
  const records: AirtablePost[] = [];
  let offset: string | undefined;

  do {
    const pageUrl = offset ? `${url}&offset=${offset}` : url;
    const res = await fetch(pageUrl, {
      headers: headers(),
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      throw new Error(`Airtable fetch failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    records.push(...(data.records as AirtablePost[]));
    offset = data.offset;
  } while (offset);

  return records;
}

export async function listTopPosts(
  hours = 24,
  limit = 20,
  categories?: string[]
): Promise<AirtablePost[]> {
  const timeFilter = `IS_AFTER({scraped_at}, DATEADD(NOW(), -${hours}, 'hours'))`;
  const catFilter = buildCatFormula(categories);
  const formula = catFilter ? `AND(${timeFilter},${catFilter})` : timeFilter;

  const params = new URLSearchParams({
    filterByFormula: formula,
    "sort[0][field]": "engagement_score",
    "sort[0][direction]": "desc",
    maxRecords: String(limit),
  });

  const res = await fetch(
    `${BASE_URL}/${BASE_ID}/${TABLE}?${params.toString()}`,
    { headers: headers(), next: { revalidate: 300 } }
  );

  if (!res.ok) {
    throw new Error(`Airtable listTopPosts failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.records as AirtablePost[];
}

export async function listPostsForKOLs(
  hours = 168,
  categories?: string[]
): Promise<AirtablePost[]> {
  const timeFilter = `IS_AFTER({scraped_at}, DATEADD(NOW(), -${hours}, 'hours'))`;
  const catFilter = buildCatFormula(categories);
  const formula = catFilter ? `AND(${timeFilter},${catFilter})` : timeFilter;

  const params = new URLSearchParams({
    filterByFormula: formula,
    "fields[]": "author_handle",
  });
  // We need all fields for aggregation
  const url = `${BASE_URL}/${BASE_ID}/${TABLE}?filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=scraped_at&sort[0][direction]=desc`;
  return fetchAllPages(url);
}

export function aggregateKOLs(posts: AirtablePost[], sortBy: "engagement" | "posts" = "engagement"): KOL[] {
  const map = new Map<string, KOL>();

  for (const post of posts) {
    const f = post.fields;
    const handle = f.author_handle;
    if (!handle) continue;

    if (!map.has(handle)) {
      map.set(handle, {
        author_handle: handle,
        author_name: f.author_name ?? handle,
        author_avatar_url: f.author_avatar_url ?? "",
        post_count: 0,
        total_likes: 0,
        total_retweets: 0,
        total_replies: 0,
        avg_engagement: 0,
        relevance_score: 0,
        categories: [],
      });
    }

    const kol = map.get(handle)!;
    kol.post_count++;
    kol.total_likes += f.likes ?? 0;
    kol.total_retweets += f.retweets ?? 0;
    kol.total_replies += f.replies ?? 0;
    if (f.category && !kol.categories.includes(f.category)) {
      kol.categories.push(f.category);
    }
  }

  for (const kol of map.values()) {
    const totalEngagement =
      kol.total_likes + kol.total_retweets * 2 + kol.total_replies;
    kol.avg_engagement = kol.post_count > 0
      ? Math.round(totalEngagement / kol.post_count)
      : 0;
    kol.relevance_score = kol.post_count * kol.avg_engagement;
  }

  const kols = Array.from(map.values());

  if (sortBy === "posts") {
    kols.sort((a, b) => b.post_count - a.post_count || b.relevance_score - a.relevance_score);
  } else {
    kols.sort((a, b) => b.relevance_score - a.relevance_score || b.post_count - a.post_count);
  }

  return kols;
}

export async function upsertPosts(
  rows: PostInput[]
): Promise<{ inserted: number; updated: number }> {
  const BATCH = 10;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const body = {
      records: batch.map((r) => ({ fields: r })),
      performUpsert: { fieldsToMergeOn: ["tweet_id"] },
    };

    const res = await fetch(`${BASE_URL}/${BASE_ID}/${TABLE}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Airtable upsert failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    inserted += data.createdRecords?.length ?? 0;
    updated += data.updatedRecords?.length ?? 0;
  }

  return { inserted, updated };
}
