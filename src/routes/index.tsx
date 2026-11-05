import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home";
import { getHome } from "@/lib/server/store";

export const Route = createFileRoute("/")({
  loader: () => getHome(),
  head: () => ({
    meta: [
      { title: "Glam Nails by Yukti · Press-on nails in Bhusawal" },
      {
        name: "description",
        content:
          "Elegance at your fingertips. Handcrafted press-on nails by Yukti in Bhusawal, with custom designs, bridal nail art and delivery across India.",
      },
    ],
  }),
  component: function Index() {
    const data = Route.useLoaderData();
    return <HomePage data={data} />;
  },
});
