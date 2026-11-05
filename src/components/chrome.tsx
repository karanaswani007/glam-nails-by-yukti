import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useCart, useCartHydrated } from "@/lib/cart";
import { blankShopSearch } from "@/lib/shop-search";
import type { Shell } from "@/lib/types";
import { btnGhost, fieldClass } from "@/lib/ui";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/custom", label: "Custom Nails" },
  { to: "/salon", label: "Salon" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader({ shell }: { shell: Shell }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const hydrated = useCartHydrated();
  const count = useCart((state) => state.lines.reduce((sum, line) => sum + line.qty, 0));
  const path = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ivory/95 backdrop-blur-md">
      <div className="bg-deep px-4 py-2 text-center text-xs tracking-widest text-ivory uppercase">
        {shell.announcement || "Handcrafted press-on nails, delivered across India."}
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full text-ink md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <Link to="/" className="min-w-0 flex-1 md:flex-none" onClick={() => setOpen(false)}>
          <span className="block font-serif text-2xl leading-none text-ink">Glam Nails</span>
          <span className="mt-1 block text-xs tracking-widest text-muted uppercase">by Yukti</span>
        </Link>
        <nav className="mx-auto hidden items-center gap-5 lg:flex" aria-label="Primary">
          {links.slice(1).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              search={link.to === "/shop" ? blankShopSearch : undefined}
              className={`text-sm ${path === link.to ? "text-deep" : "text-ink"} hover:text-deep`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink"
            aria-label="Search designs"
            onClick={() => setSearchOpen((value) => !value)}
          >
            <Search className="size-5" />
          </button>
          <Link
            to="/wishlist"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink"
            aria-label="Wishlist"
          >
            <Heart className="size-5" />
          </Link>
          <Link
            to="/cart"
            className="relative inline-flex size-11 items-center justify-center rounded-full text-ink"
            aria-label="Shopping bag"
          >
            <ShoppingBag className="size-5" />
            {hydrated && count > 0 ? (
              <span className="absolute top-1 right-1 inline-flex min-w-5 justify-center rounded-full bg-deep px-1 text-xs text-ivory tabular-nums">
                {count}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
      {searchOpen ? (
        <form
          className="mx-auto flex max-w-6xl gap-2 px-4 pb-4 md:px-5"
          onSubmit={(event) => {
            event.preventDefault();
            const q = String(new FormData(event.currentTarget).get("q") ?? "");
            setSearchOpen(false);
            setOpen(false);
            void navigate({ to: "/shop", search: { ...blankShopSearch, q } });
          }}
        >
          <input name="q" className={fieldClass} placeholder="Search press-on nails" aria-label="Search" />
          <button className={btnGhost} type="submit">
            Search
          </button>
        </form>
      ) : null}
      {open ? (
        <nav className="border-t border-line px-4 py-4 md:hidden" aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              search={link.to === "/shop" ? blankShopSearch : undefined}
              className="block py-3 text-lg text-ink"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/studio" className="block py-3 text-sm tracking-widest text-muted uppercase" onClick={() => setOpen(false)}>
            Studio
          </Link>
        </nav>
      ) : null}
    </header>
  );
}

export function SiteFooter({ shell }: { shell: Shell }) {
  return (
    <footer className="mt-20 bg-deep text-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-serif text-4xl">Glam Nails</p>
          <p className="mt-2 text-sm tracking-widest text-blush uppercase">by Yukti</p>
          <p className="mt-4 max-w-sm text-sm text-blush">
            Press-on nails and nail art from {shell.location}. Delivery across India. Orders are confirmed on WhatsApp.
          </p>
        </div>
        <div>
          <p className="text-xs tracking-widest text-blush uppercase">Visit</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link to="/shop" search={blankShopSearch} className="hover:text-blush">Shop</Link>
            <Link to="/custom" className="hover:text-blush">Custom nails</Link>
            <Link to="/salon" className="hover:text-blush">Salon services</Link>
            <Link to="/gallery" className="hover:text-blush">Gallery</Link>
            <Link to="/about" className="hover:text-blush">About</Link>
          </div>
        </div>
        <div>
          <p className="text-xs tracking-widest text-blush uppercase">Support</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <a href={shell.generalWhatsappUrl} className="hover:text-blush">WhatsApp {shell.whatsappDisplay}</a>
            <a href={shell.instagramUrl} className="hover:text-blush">{shell.instagramHandle}</a>
            <Link to="/contact" className="hover:text-blush">Contact</Link>
            <Link to="/policies/$slug" params={{ slug: "shipping" }} className="hover:text-blush">Delivery</Link>
            <Link to="/policies/$slug" params={{ slug: "privacy" }} className="hover:text-blush">Privacy</Link>
            <Link to="/policies/$slug" params={{ slug: "terms" }} className="hover:text-blush">Terms</Link>
            <Link to="/studio" className="hover:text-blush">Studio</Link>
          </div>
        </div>
      </div>
      <p className="border-t border-rose/40 px-5 py-4 text-center text-xs text-blush">
        © {new Date().getFullYear()} Glam Nails by Yukti. Payment is never marked paid automatically.
      </p>
    </footer>
  );
}

export function WhatsAppButton({ shell }: { shell: Shell }) {
  return (
    <a
      href={shell.generalWhatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Glam Nails by Yukti on WhatsApp"
      className="fixed right-4 bottom-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-deep px-4 py-3 text-ivory shadow-md"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-current">
        <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 13.85c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.12.1-1.81-.11-.41-.13-.95-.31-1.64-.61-2.88-1.25-4.76-4.15-4.9-4.34-.14-.2-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.24-.26.64-.38 1.02-.38.12 0 .23 0 .33.01.3.01.45.03.65.5.24.58.82 2 .89 2.15.07.14.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.56.16.26.7 1.16 1.5 1.88 1.03.92 1.9 1.2 2.17 1.34.26.14.42.12.57-.07.16-.2.66-.77.84-1.03.17-.26.35-.22.58-.13.24.09 1.5.71 1.76.84.26.13.43.19.49.3.07.1.07.62-.17 1.3z" />
      </svg>
      <span className="text-sm">WhatsApp</span>
    </a>
  );
}

export function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-12 pb-8">
      <p className="text-xs tracking-widest text-rose uppercase">{eyebrow}</p>
      <h1 className="mt-3 max-w-3xl font-serif text-5xl text-ink md:text-6xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base text-muted">{text}</p>
    </div>
  );
}
