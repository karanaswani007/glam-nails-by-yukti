import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "@/components/commerce";
import { getContent } from "@/lib/server/store";

export const Route = createFileRoute("/checkout")({
  loader: () => getContent(),
  head: () => ({ meta: [{ title: "Checkout · Glam Nails by Yukti" }] }),
  component: function Checkout() {
    return <CheckoutPage settings={Route.useLoaderData()} />;
  },
});
