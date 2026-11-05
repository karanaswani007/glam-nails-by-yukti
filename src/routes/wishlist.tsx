import { createFileRoute } from "@tanstack/react-router";
import { WishlistPage } from "@/components/pages";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist · Glam Nails by Yukti" }] }),
  component: WishlistPage,
});
