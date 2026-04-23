import type { Config } from "@netlify/functions";
import { runTwitterScraper } from "../../lib/apify";
import { upsertPosts } from "../../lib/airtable";
import { QUERIES } from "../../lib/queries";

export default async (req: Request): Promise<Response> => {
  const start = Date.now();

  // Validate manual HTTP triggers with Authorization header.
  // Netlify's own scheduled invocations don't send this header.
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== null) {
    const expected = `Bearer ${process.env.CRON_SECRET}`;
    if (authHeader !== expected) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let queriesRun = 0;
  let postsInserted = 0;
  let postsUpdated = 0;
  const postsSkipped = 0;

  for (const { category, query } of QUERIES) {
    try {
      const tweets = await runTwitterScraper(query);
      const rows = tweets.map((t) => ({
        tweet_id: t.tweet_id,
        author_handle: t.author_handle,
        author_name: t.author_name,
        author_avatar_url: t.author_avatar_url,
        text: t.text,
        likes: t.likes,
        retweets: t.retweets,
        replies: t.replies,
        views: t.views,
        media_urls: JSON.stringify(t.media_urls),
        tweet_url: t.tweet_url,
        tweet_created_at: t.tweet_created_at,
        category,
      }));

      const { inserted, updated } = await upsertPosts(rows);
      postsInserted += inserted;
      postsUpdated += updated;
      queriesRun++;
    } catch (err) {
      console.error(`Error processing category "${category}":`, err);
    }
  }

  const durationMs = Date.now() - start;
  return Response.json({
    queriesRun,
    postsInserted,
    postsUpdated,
    postsSkipped,
    durationMs,
  });
};

export const config: Config = {
  schedule: "0 8 * * *",
};
