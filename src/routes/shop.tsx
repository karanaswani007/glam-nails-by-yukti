import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/shop-view";
import { readShopSearch } from "@/lib/shop-search";
import { getShop } from "@/lib/server/store";

export const Route = createFileRoute("/shop")({
  validateSearch: (search) => readShopSearch(search as Record<string, unknown>),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getShop({ data: deps }),
  head: () => ({
    meta: [
      { title: "Shop press-on nails · Glam Nails by Yukti" },
      {
        name: "description",
        content: "Shop handmade press-on nails from Glam Nails by Yukti. Bridal, French, floral, minimal and party sets, delivered across India.",
      },
    ],
  }),
  component: function ShopPage() {
    return <ShopView data={Route.useLoaderData()} search={Route.useSearch()} />;
  },
});
