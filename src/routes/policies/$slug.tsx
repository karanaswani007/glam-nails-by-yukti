import { createFileRoute, notFound } from "@tanstack/react-router";
import { PolicyPage } from "@/components/pages";
import { getContent } from "@/lib/server/store";

const titles = {
  shipping: "Delivery",
  privacy: "Privacy",
  terms: "Terms",
  returns: "Returns",
} as const;

export const Route = createFileRoute("/policies/$slug")({
  loader: async ({ params }) => {
    if (!(params.slug in titles)) throw notFound();
    const settings = await getContent();
    const slug = params.slug as keyof typeof titles;
    const body =
      slug === "shipping"
        ? settings.policyShipping
        : slug === "privacy"
          ? settings.policyPrivacy
          : slug === "terms"
            ? settings.policyTerms
            : settings.policyReturns;
    return { title: titles[slug], body };
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `${loaderData.title} · Glam Nails by Yukti` : "Policy" }] }),
  component: function Policy() {
    const data = Route.useLoaderData();
    return <PolicyPage title={data.title} body={data.body} />;
  },
});
