import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { SiteFooter, SiteHeader, WhatsAppButton } from "@/components/chrome";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AuthProvider } from "@/lib/auth/provider";
import { getShell } from "@/lib/server/store";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  loader: () => getShell(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Glam Nails by Yukti" },
      {
        name: "description",
        content:
          "Handcrafted press-on nails and nail art by Yukti in Bhusawal. Shop sets, request a custom design, or enquire about a salon appointment. Delivery across India.",
      },
      { name: "theme-color", content: "#6D424B" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap",
      },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => (
    <main className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="font-serif text-5xl">That page is not in the collection</h1>
      <a href="/" className="mt-6 inline-flex text-deep">
        Back home
      </a>
    </main>
  ),
});

function RootComponent() {
  const shell = Route.useLoaderData();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const studio = path.startsWith("/studio");
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="overflow-x-hidden bg-ivory text-ink">
        <PreviewHostBridge />
        <AuthProvider>
          <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-paper focus:px-3 focus:py-2">
            Skip to content
          </a>
          {studio ? null : <SiteHeader shell={shell} />}
          <div id="content">
            <Outlet />
          </div>
          {studio ? null : <SiteFooter shell={shell} />}
          {studio ? null : <WhatsAppButton shell={shell} />}
          <Toaster position="top-center" />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
