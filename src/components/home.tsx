import { Link } from "@tanstack/react-router";
import { Flower2, PenLine, Truck, MessageCircle } from "lucide-react";
import { useState } from "react";
import { ProductTile } from "@/components/product-card";
import { blankShopSearch } from "@/lib/shop-search";
import type { HomeData } from "@/lib/types";
import { btnGhost, btnPrimary, fieldClass } from "@/lib/ui";
import { subscribeNews } from "@/lib/server/store";
import { useServerFn } from "@tanstack/react-start";

const highlights = [
  { icon: PenLine, title: "Handcrafted designs", text: "Each set is made by hand, not pulled from a factory wall." },
  { icon: Flower2, title: "Personalized styles", text: "Shape, length and colour can follow the occasion." },
  { icon: MessageCircle, title: "Customer-focused service", text: "Yukti confirms every order with you on WhatsApp." },
  { icon: Truck, title: "India-wide delivery", text: "Press-on sets can be sent across India." },
];

export function HomePage({ data }: { data: HomeData }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: "Glam Nails by Yukti",
    image: data.settings.heroImage,
    telephone: "+918766067782",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bhusawal",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    areaServed: "IN",
    sameAs: [data.settings.instagramUrl],
  };

  return (
    <main>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <section className="mx-auto grid max-w-6xl items-stretch gap-6 px-5 py-8 lg:grid-cols-12 lg:py-12">
        <div className="order-2 flex flex-col justify-end lg:order-1 lg:col-span-5 lg:py-8">
          <p className="text-xs tracking-widest text-rose uppercase">Bhusawal · Press-on nails</p>
          <h1 className="mt-4 font-serif text-5xl leading-none text-ink md:text-7xl">{data.settings.heroHeading}</h1>
          <p className="mt-5 max-w-md text-base text-muted">{data.settings.heroText}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" search={blankShopSearch} className={btnPrimary}>
              Shop collection
            </Link>
            <Link to="/custom" className={btnGhost}>
              Explore custom nails
            </Link>
          </div>
        </div>
        <div className="order-1 overflow-hidden rounded-3xl lg:order-2 lg:col-span-7">
          <img
            src={data.settings.heroImage}
            alt="Blush almond nails with a pearl and gold detail, resting on ivory silk"
            className="h-[7vw] max-h-[300px] w-full object-cover lg:h-full lg:min-h-[500px]"
          />
        </div>
      </section>

      <section className="border-y border-line">
        <div className="mx-auto grid max-w-6xl md:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.title} className="border-line px-5 py-8 md:border-l md:first:border-l-0">
              <item.icon className="size-5 text-champagne" aria-hidden="true" />
              <h2 className="mt-4 font-serif text-2xl">{item.title}</h2>
              <p className="mt-2 text-sm text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-widest text-rose uppercase">Collections</p>
            <h2 className="mt-2 font-serif text-4xl md:text-5xl">Find a mood</h2>
          </div>
          <Link to="/shop" search={blankShopSearch} className="hidden text-sm text-deep md:inline">
            View the shop
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {data.categories.map((category) => (
            <Link
              key={category.id}
              to={category.slug === "custom" ? "/custom" : "/shop"}
              search={category.slug === "custom" ? undefined : { ...blankShopSearch, category: category.slug }}
              className="group relative block overflow-hidden rounded-3xl"
            >
              <img src={category.imageUrl} alt="" className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 bg-deep/80 px-4 py-4 font-serif text-2xl text-ivory">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <p className="text-xs tracking-widest text-rose uppercase">The edit</p>
        <h2 className="mt-2 font-serif text-4xl md:text-5xl">Best sellers</h2>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Prices and photos refresh from the studio. Sample designs stay labelled until you replace them.
        </p>
        {data.products.length ? (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {data.products.map((product) => (
              <ProductTile key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-3xl border border-line bg-paper px-6 py-10 text-muted">
            No designs are published yet. Add them in the studio, or enquire on WhatsApp.
          </p>
        )}
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-2">
        <img src="/images/process.jpg" alt="Hands painting a small gold detail onto a blush nail" className="h-full max-h-[520px] w-full rounded-3xl object-cover" />
        <div>
          <p className="text-xs tracking-widest text-rose uppercase">The studio</p>
          <h2 className="mt-2 font-serif text-4xl md:text-5xl">{data.settings.aboutTitle}</h2>
          <p className="mt-4 whitespace-pre-line text-muted">{data.settings.aboutBody.split("\n\n")[0]}</p>
          <Link to="/about" className={`${btnGhost} mt-6`}>
            Discover our story
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <p className="text-xs tracking-widest text-rose uppercase">Custom nails</p>
          <h2 className="mt-2 font-serif text-4xl md:text-5xl">A set that starts with your reference</h2>
          <p className="mt-4 text-muted">
            Share a shape, a colour story and a photo. Yukti replies with what is possible and the price. Nothing is charged on this page.
          </p>
          <Link to="/custom" className={`${btnPrimary} mt-6`}>
            Create your own design
          </Link>
        </div>
        <img src="/images/packaging.jpg" alt="An open blush box of press-on nails" className="order-1 h-full max-h-[480px] w-full rounded-3xl object-cover lg:order-2" />
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-widest text-rose uppercase">Salon</p>
              <h2 className="mt-2 font-serif text-4xl">Services in Bhusawal</h2>
            </div>
            <Link to="/salon" className="text-sm text-deep">
              Enquire
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {data.services.map((service) => (
              <article key={service.id} className="overflow-hidden rounded-3xl border border-line">
                {service.imageUrl ? <img src={service.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" /> : null}
                <div className="p-5">
                  <h3 className="font-serif text-3xl">{service.name}</h3>
                  <p className="mt-2 text-sm text-muted">{service.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-xs tracking-widest text-rose uppercase">Words from clients</p>
        <h2 className="mt-2 font-serif text-4xl">Testimonials</h2>
        {data.testimonials.length ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {data.testimonials.map((item) => (
              <figure key={item.id} className="rounded-3xl border border-line bg-paper p-6">
                <blockquote className="font-serif text-2xl leading-snug">“{item.quote}”</blockquote>
                <figcaption className="mt-4 text-sm text-muted">
                  {item.name}
                  {item.location ? ` · ${item.location}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-6 max-w-xl text-muted">
            Client words appear here only after Yukti approves them in the studio. No reviews are invented.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-widest text-rose uppercase">{data.settings.instagramHandle}</p>
            <h2 className="mt-2 font-serif text-4xl">From the studio gallery</h2>
          </div>
          <a href={data.settings.instagramUrl} className="text-sm text-deep">
            Follow on Instagram
          </a>
        </div>
        <p className="mt-3 max-w-xl text-sm text-muted">
          These are gallery photos managed in the studio. The live Instagram feed is not scraped, and it appears here only when you choose the pictures.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {data.gallery.map((image) => (
            <a key={image.id} href={data.settings.instagramUrl} className="block overflow-hidden rounded-3xl">
              <img src={image.url} alt={image.alt} className="aspect-square w-full object-cover" />
            </a>
          ))}
        </div>
      </section>

      <Newsletter />

      {data.settings.faqs.length ? (
        <section className="mx-auto max-w-3xl px-5 py-8">
          <h2 className="font-serif text-4xl">Questions</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {data.settings.faqs.map((faq) => (
              <details key={faq.q} className="py-4">
                <summary className="cursor-pointer font-medium">{faq.q}</summary>
                <p className="mt-2 text-sm text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Newsletter() {
  const send = useServerFn(subscribeNews);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="rounded-3xl bg-blush px-6 py-10 md:px-10">
        <h2 className="font-serif text-4xl">Notes from the studio</h2>
        <p className="mt-2 max-w-lg text-sm text-ink">
          Occasional updates about new sets. No spam, and you can ask to be removed on WhatsApp.
        </p>
        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setPending(true);
            const result = await send({
              data: { email: String(form.get("email") ?? ""), consent: form.get("consent") === "on" },
            });
            setPending(false);
            setMessage(result.ok ? "You are on the list." : result.error);
            if (result.ok) event.currentTarget.reset();
          }}
        >
          <input name="email" type="email" required className={fieldClass} placeholder="Email address" aria-label="Email address" />
          <button className={btnPrimary} disabled={pending} type="submit">
            {pending ? "Saving…" : "Join"}
          </button>
          <label className="flex items-center gap-2 text-sm text-ink sm:basis-full">
            <input name="consent" type="checkbox" required className="size-4" />
            I agree to receive occasional emails.
          </label>
        </form>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
      </div>
    </section>
  );
}
