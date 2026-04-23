// Twitter scraper via SocialData.tools API
// Docs: https://socialdata.tools/docs

const API_TOKEN = process.env.SOCIALDATA_API_TOKEN;
const BASE_URL = "https://api.socialdata.tools";

export type Tweet = {
  tweet_id: string;
  author_handle: string;
  author_name: string;
  author_avatar_url: string;
  text: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number | null;
  media_urls: string[];
  tweet_url: string;
  tweet_created_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(item: any): Tweet {
  const id: string = item.id_str ?? item.id ?? "";
  const handle: string = item.user?.screen_name ?? "";
  const name: string = item.user?.name ?? "";
  const avatar: string = item.user?.profile_image_url_https ?? "";
  const text: string = item.full_text ?? item.text ?? "";
  const likes: number = item.favorite_count ?? 0;
  const retweets: number = item.retweet_count ?? 0;
  const replies: number = item.reply_count ?? 0;
  const views: number | null = item.views_count ?? null;

  const rawCreatedAt: string = item.tweet_created_at ?? item.created_at ?? "";
  const createdAt: string = rawCreatedAt
    ? new Date(rawCreatedAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const mediaUrls: string[] = [];
  if (item.entities?.media) {
    for (const m of item.entities.media) {
      if (m.media_url_https) mediaUrls.push(m.media_url_https);
    }
  }
  if (item.extended_entities?.media) {
    for (const m of item.extended_entities.media) {
      if (m.media_url_https && !mediaUrls.includes(m.media_url_https)) {
        mediaUrls.push(m.media_url_https);
      }
    }
  }

  const tweetUrl: string =
    handle && id
      ? `https://twitter.com/${handle}/status/${id}`
      : "";

  return {
    tweet_id: id,
    author_handle: handle,
    author_name: name,
    author_avatar_url: avatar,
    text,
    likes,
    retweets,
    replies,
    views,
    media_urls: mediaUrls,
    tweet_url: tweetUrl,
    tweet_created_at: createdAt,
  };
}

export async function runTwitterScraper(query: string): Promise<Tweet[]> {
  const params = new URLSearchParams({
    query,
    type: "Latest",
  });

  const res = await fetch(`${BASE_URL}/twitter/search?${params}`, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(
      `SocialData API error: ${res.status} ${await res.text()}`
    );
  }

  const data = await res.json();
  // Response shape: { tweets: [...] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tweets: any[] = data.tweets ?? data.data ?? data ?? [];
  return tweets.map(normalize).filter((t) => t.tweet_id);
}
