export type QueryEntry = {
  category: "pokemon" | "tcg" | "collectibles" | "web3";
  query: string;
};

export const QUERIES: QueryEntry[] = [
  {
    category: "pokemon",
    query:
      '(pokemon OR #pokemon OR "pokemon cards" OR "pokemon tcg" OR #pokemoncards OR #pokemontcg) min_faves:100 -is:reply lang:en',
  },
  {
    category: "tcg",
    query:
      '("trading card game" OR "trading card games" OR TCG OR #TCG OR "magic the gathering" OR #MTG OR yugioh OR #yugioh OR "one piece tcg" OR lorcana OR "disney lorcana") min_faves:75 -is:reply lang:en',
  },
  {
    category: "collectibles",
    query:
      '("digital collectibles" OR "collectibles market" OR #collectibles) min_faves:50 -is:reply lang:en',
  },
  {
    category: "web3",
    query:
      '("NFT pokemon" OR "pokemon NFT" OR "onchain cards" OR "tokenized TCG" OR "onchain TCG" OR "onchain pokemon") min_faves:20 -is:reply lang:en',
  },
];
