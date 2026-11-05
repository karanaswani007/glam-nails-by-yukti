export type ShopSort = "newest" | "price-asc" | "price-desc" | "popular";

export type ShopSearch = {
  q: string;
  category: string;
  sort: ShopSort;
  page: number;
  min: string;
  max: string;
};

const sorts: ShopSort[] = ["newest", "price-asc", "price-desc", "popular"];

export const blankShopSearch: ShopSearch = {
  q: "",
  category: "",
  sort: "newest",
  page: 1,
  min: "",
  max: "",
};

export function readShopSearch(search: Record<string, unknown>): ShopSearch {
  const sort = search.sort;
  return {
    q: typeof search.q === "string" ? search.q : "",
    category: typeof search.category === "string" ? search.category : "",
    sort: sorts.includes(sort as ShopSort) ? (sort as ShopSort) : "newest",
    page: Math.min(100, Math.max(1, Number(search.page) || 1)),
    min: typeof search.min === "string" ? search.min : "",
    max: typeof search.max === "string" ? search.max : "",
  };
}
