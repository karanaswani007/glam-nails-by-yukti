import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages";
import { getContent } from "@/lib/server/store";

export const Route = createFileRoute("/about")({
  loader: () => getContent(),
  head: () => ({
    meta: [
      { title: "About Yukti · Glam Nails by Yukti" },
      { name: "description", content: "Yukti is the nail artist behind Glam Nails by Yukti in Bhusawal, Maharashtra." },
    ],
  }),
  component: function About() {
    return <AboutPage settings={Route.useLoaderData()} />;
  },
});
