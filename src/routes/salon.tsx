import { createFileRoute } from "@tanstack/react-router";
import { SalonPage } from "@/components/pages";
import { getServices } from "@/lib/server/store";

export const Route = createFileRoute("/salon")({
  loader: () => getServices(),
  head: () => ({
    meta: [
      { title: "Nail artist in Bhusawal · Glam Nails by Yukti" },
      { name: "description", content: "Salon nail art and bridal nails in Bhusawal. Send an appointment enquiry. Times are not held until confirmed." },
    ],
  }),
  component: function Salon() {
    const data = Route.useLoaderData();
    return <SalonPage settings={data.settings} services={data.services} />;
  },
});
