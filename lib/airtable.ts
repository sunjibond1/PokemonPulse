const BASE_URL = "https://api.airtable.com/v0";

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE = process.env.AIRTABLE_TABLE_NAME ?? "Posts";
const TOKEN = process.env.AIRTABLE_API_TOKEN!;

const headers = () => ({
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
});

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
    category: "pokemon" | "tcg" | "collectibles" | "web3";
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

export async function listTopPosts(
  hours = 24,
  limit = 20
): Promise<AirtablePost[]> {
  // scraped_at is a Created time field (full datetime) — reliable for 24h window
  const formula = `IS_AFTER({scraped_at}, DATEADD(NOW(), -${hours}, 'hours'))`;
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
