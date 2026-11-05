import { createFileRoute } from "@tanstack/react-router";
import { CartPage } from "@/components/commerce";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your bag · Glam Nails by Yukti" }] }),
  component: CartPage,
});
