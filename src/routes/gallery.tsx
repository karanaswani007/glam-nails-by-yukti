import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { GalleryPage } from "@/components/pages";
import { getGallery } from "@/lib/server/store";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/gallery")({
  loader: () => getGallery(),
  head: () => ({ meta: [{ title: "Nail art gallery · Glam Nails by Yukti" }] }),
  component: function Gallery() {
    const shell = rootApi.useLoaderData();
    return <GalleryPage images={Route.useLoaderData()} instagramUrl={shell.instagramUrl} />;
  },
});
