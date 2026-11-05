import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";
import { ProductView } from "@/components/product-view";
import { getProduct } from "@/lib/server/store";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const data = await getProduct({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.product.name} · Glam Nails by Yukti` : "Design" },
      {
        name: "description",
        content: loaderData?.product.description.slice(0, 160) ?? "Press-on nails by Glam Nails by Yukti.",
      },
    ],
  }),
  component: function ProductPage() {
    const data = Route.useLoaderData();
    const shell = rootApi.useLoaderData();
    return <ProductView product={data.product} related={data.related} shell={shell} />;
  },
});
