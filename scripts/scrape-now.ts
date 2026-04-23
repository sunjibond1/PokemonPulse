import "dotenv/config";
import { QUERIES } from "../lib/queries";
import { runTwitterScraper } from "../lib/apify";
import { upsertPosts } from "../lib/airtable";

async function main() {
  console.log(`Starting scrape for ${QUERIES.length} queries...\n`);
  let totalInserted = 0;
  let totalUpdated = 0;

  for (const { category, query } of QUERIES) {
    console.log(`Scraping category: ${category}`);
    try {
      const tweets = await runTwitterScraper(query);
      console.log(`  Got ${tweets.length} tweets`);

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
      console.log(`  Inserted: ${inserted}, Updated: ${updated}\n`);
      totalInserted += inserted;
      totalUpdated += updated;
    } catch (err) {
      console.error(`  Error in ${category}:`, (err as Error).message, "\n");
    }
  }

  console.log(`Done! Total inserted: ${totalInserted}, updated: ${totalUpdated}`);
}

main();
