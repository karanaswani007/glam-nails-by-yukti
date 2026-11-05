import { createFileRoute } from "@tanstack/react-router";
import { CustomPage } from "@/components/pages";

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Custom press-on nails · Glam Nails by Yukti" },
      { name: "description", content: "Request a custom press-on set from Glam Nails by Yukti. Share shape, colour and a reference image." },
    ],
  }),
  component: CustomPage,
});
