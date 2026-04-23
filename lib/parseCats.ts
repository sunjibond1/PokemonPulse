import { CATEGORIES, type Category } from "@/lib/airtable";

export function parseCats(searchParams: URLSearchParams): Category[] {
  const raw = searchParams.get("cats");
  if (!raw) return CATEGORIES.map((c) => c.value);
  return raw.split(",").filter((v): v is Category =>
    CATEGORIES.some((c) => c.value === v)
  );
}
