import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/pages";
import { getContent } from "@/lib/server/store";

export const Route = createFileRoute("/contact")({
  loader: () => getContent(),
  head: () => ({ meta: [{ title: "Contact · Glam Nails by Yukti" }] }),
  component: function Contact() {
    return <ContactPage settings={Route.useLoaderData()} />;
  },
});
