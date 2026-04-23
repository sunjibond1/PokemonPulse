import "dotenv/config";
import { upsertPosts } from "../lib/airtable";

const now = new Date();
// Airtable date field is date-only (YYYY-MM-DD)
const h = (hoursAgo: number) =>
  new Date(now.getTime() - hoursAgo * 3600_000)
    .toISOString()
    .slice(0, 10);

const SEED_POSTS = [
  {
    tweet_id: "seed_001",
    author_handle: "PokemonTCG",
    author_name: "Pokémon TCG",
    author_avatar_url: "https://pbs.twimg.com/profile_images/1281407861891739648/kCsHWUUm_400x400.jpg",
    text: "The Pokémon TCG: Scarlet & Violet—Prismatic Evolutions expansion is here! ✨ These cards are absolutely stunning. Which pull are you most excited about? #PokemonTCG #PrismaticEvolutions",
    likes: 18420, retweets: 3210, replies: 892, views: 420000,
    media_urls: "[]",
    tweet_url: "https://twitter.com/PokemonTCG/status/1",
    tweet_created_at: h(2),
    category: "pokemon",
  },
  {
    tweet_id: "seed_002",
    author_handle: "charizard_vault",
    author_name: "Charizard Vault",
    author_avatar_url: "",
    text: "PSA 10 Base Set Charizard just sold for $420,000 🤯 The Pokemon card market is absolutely insane right now. Never been a better time to check your collection. #PokemonCards #Grading",
    likes: 31200, retweets: 6700, replies: 2100, views: 890000,
    media_urls: "[]",
    tweet_url: "https://twitter.com/charizard_vault/status/4",
    tweet_created_at: h(3),
    category: "pokemon",
  },
  {
    tweet_id: "seed_003",
    author_handle: "MTGArena",
    author_name: "MTG Arena",
    author_avatar_url: "https://pbs.twimg.com/profile_images/1481713921992241160/3ygBJ_Nq_400x400.jpg",
    text: "Draft season is BACK 🔥 The new set is dropping insane value cards. Grabbed a foil Mythic on my first pack! Trading card games have never been more exciting. #MTG #TCG #MagicTheGathering",
    likes: 12800, retweets: 2100, replies: 654, views: 310000,
    media_urls: "[]",
    tweet_url: "https://twitter.com/MTGArena/status/2",
    tweet_created_at: h(4),
    category: "tcg",
  },
  {
    tweet_id: "seed_004",
    author_handle: "yugioh_official",
    author_name: "Yu-Gi-Oh! TCG",
    author_avatar_url: "",
    text: "IT IS TIME TO DUEL! 🃏⚡ The new master set is dropping next week and the chase cards are looking INCREDIBLE. Who's pulling for the Secret Rare? #YuGiOh #TCG #CardGame",
    likes: 22400, retweets: 4100, replies: 1380, views: 550000,
    media_urls: "[]",
    tweet_url: "https://twitter.com/yugioh_official/status/6",
    tweet_created_at: h(5),
    category: "tcg",
  },
  {
    tweet_id: "seed_005",
    author_handle: "lorcana_news",
    author_name: "Lorcana News",
    author_avatar_url: "",
    text: "Disney Lorcana Chapter 7 spoilers are WILD 🏰✨ The Elsa foil alt-art might be the most beautiful TCG card ever printed. Pre-orders already sold out on most sites. #Lorcana #DisneyLorcana #TCG",
    likes: 14700, retweets: 2900, replies: 876, views: 340000,
    media_urls: "[]",
    tweet_url: "https://twitter.com/lorcana_news/status/7",
    tweet_created_at: h(6),
    category: "tcg",
  },
  {
    tweet_id: "seed_006",
    author_handle: "collectibles_alpha",
    author_name: "Collectibles Alpha",
    author_avatar_url: "",
    text: "The digital collectibles market just hit a new milestone 📈 $2.4B in trading volume this quarter alone. Physical + digital hybrid cards are changing everything. #Collectibles #DigitalCollectibles",
    likes: 9340, retweets: 1820, replies: 430, views: 210000,
    media_urls: "[]",
    tweet_url: "https://twitter.com/collectibles_alpha/status/3",
    tweet_created_at: h(7),
    category: "collectibles",
  },
  {
    tweet_id: "seed_007",
    author_handle: "onchain_cards",
    author_name: "OnChain Cards",
    author_avatar_url: "",
    text: "Tokenized TCG assets are the future 🔗 Imagine owning a digital Charizard that's also verifiable on-chain. True ownership, tradeable anywhere. Onchain pokemon is just getting started. #OnchainCards #TokenizedTCG",
    likes: 5600, retweets: 980, replies: 310, views: 95000,
    media_urls: "[]",
    tweet_url: "https://twitter.com/onchain_cards/status/5",
    tweet_created_at: h(8),
    category: "web3",
  },
  {
    tweet_id: "seed_008",
    author_handle: "pokenft_labs",
    author_name: "PokeNFT Labs",
    author_avatar_url: "",
    text: "Pokemon NFT ecosystem is growing 🌱 New onchain mechanics letting you battle with your digital cards. This is the intersection of TCG + Web3 we've been waiting for. #NFTPokemon #PokemonNFT",
    likes: 4200, retweets: 820, replies: 245, views: 78000,
    media_urls: "[]",
    tweet_url: "https://twitter.com/pokenft_labs/status/8",
    tweet_created_at: h(10),
    category: "web3",
  },
];

async function main() {
  console.log("Seeding Airtable with", SEED_POSTS.length, "test posts...");
  const { inserted, updated } = await upsertPosts(SEED_POSTS);
  console.log(`Done! Inserted: ${inserted}, Updated: ${updated}`);
}

main();
