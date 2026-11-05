import { createFileRoute, notFound } from "@tanstack/react-router";
import { OrderPage } from "@/components/pages";
import { getOrder } from "@/lib/server/store";

export const Route = createFileRoute("/order/$token")({
  loader: async ({ params }) => {
    const order = await getOrder({ data: { token: params.token } });
    if (!order) throw notFound();
    return order;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `Order ${loaderData.number}` : "Order" }, { name: "robots", content: "noindex" }],
  }),
  component: function Order() {
    return <OrderPage order={Route.useLoaderData()} />;
  },
});
