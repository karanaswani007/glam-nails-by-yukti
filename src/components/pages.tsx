import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageIntro } from "@/components/chrome";
import { useCart, useCartHydrated } from "@/lib/cart";
import { formatInr } from "@/lib/pricing";
import { blankShopSearch } from "@/lib/shop-search";
import { getProductsByIds, submitAppointment, submitCustom, submitEnquiry } from "@/lib/server/store";
import type { GalleryImage, ProductCard, PublicOrder, Service, Settings } from "@/lib/types";
import { btnPrimary, fieldClass } from "@/lib/ui";
import { useEffect } from "react";

export function AboutPage({ settings }: { settings: Settings }) {
  return (
    <main>
      <PageIntro eyebrow="About" title={settings.aboutTitle} text="Bhusawal, Maharashtra" />
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-5 pb-16 lg:grid-cols-2">
        <img src="/images/salon.jpg" alt="A quiet nail studio with a cream chair and blush walls" className="w-full rounded-3xl object-cover" />
        <div className="whitespace-pre-line text-base text-muted">{settings.aboutBody}</div>
      </div>
    </main>
  );
}

export function ContactPage({ settings }: { settings: Settings }) {
  const send = useServerFn(submitEnquiry);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  return (
    <main>
      <PageIntro
        eyebrow="Contact"
        title="Write to Yukti"
        text={`${settings.location}. WhatsApp ${settings.whatsappDisplay}.`}
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-16 lg:grid-cols-2">
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const result = await send({
              data: {
                name: String(form.get("name") ?? ""),
                mobile: String(form.get("mobile") ?? ""),
                message: String(form.get("message") ?? ""),
              },
            });
            if (!result.ok) {
              setNote(result.error);
              setLink("");
              return;
            }
            setNote("Saved. Send it on WhatsApp when you are ready.");
            setLink(result.data.whatsappUrl);
          }}
        >
          <input name="name" required className={fieldClass} placeholder="Name" aria-label="Name" />
          <input name="mobile" required className={fieldClass} placeholder="Mobile" aria-label="Mobile" />
          <textarea name="message" required className={fieldClass} rows={5} placeholder="Message" aria-label="Message" />
          <button className={btnPrimary} type="submit">Save message</button>
          {note ? <p className="text-sm">{note}</p> : null}
          {link ? (
            <a href={link} target="_blank" rel="noreferrer" className="text-deep">
              Open WhatsApp
            </a>
          ) : null}
        </form>
        <div className="rounded-3xl bg-paper p-6">
          <p className="font-serif text-3xl">{settings.brandName}</p>
          <p className="mt-3 text-muted">{settings.location}</p>
          {settings.salonAddress ? <p className="mt-2 text-muted">{settings.salonAddress}</p> : <p className="mt-2 text-sm text-muted">Street address is shared when you enquire.</p>}
          <a className="mt-4 inline-flex text-deep" href={settings.generalWhatsappUrl}>WhatsApp {settings.whatsappDisplay}</a>
          <a className="mt-2 block text-deep" href={settings.instagramUrl}>{settings.instagramHandle}</a>
        </div>
      </div>
    </main>
  );
}

export function CustomPage() {
  const send = useServerFn(submitCustom);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [number, setNumber] = useState("");
  return (
    <main>
      <PageIntro
        eyebrow="Custom nails"
        title="Tell Yukti what you want made"
        text="This request is saved for the studio. It is not an order and it is not paid."
      />
      <form
        className="mx-auto grid max-w-3xl gap-4 px-5 pb-16"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const file = form.get("reference");
          let imageUrl = "";
          if (file instanceof File && file.size) {
            if (file.size > 280000) {
              setNote("Use a reference image under 280 KB.");
              return;
            }
            imageUrl = await readFile(file);
          }
          const result = await send({
            data: {
              name: String(form.get("name") ?? ""),
              mobile: String(form.get("mobile") ?? ""),
              email: String(form.get("email") ?? ""),
              shape: String(form.get("shape") ?? ""),
              length: String(form.get("length") ?? ""),
              colors: String(form.get("colors") ?? ""),
              designCategory: String(form.get("designCategory") ?? ""),
              occasion: String(form.get("occasion") ?? ""),
              budget: String(form.get("budget") ?? ""),
              notes: String(form.get("notes") ?? ""),
              imageUrl,
            },
          });
          if (!result.ok) {
            setNote(result.error);
            return;
          }
          setNumber(result.data.number);
          setLink(result.data.whatsappUrl);
          setNote("Request saved.");
        }}
      >
        <input name="name" required className={fieldClass} placeholder="Name" aria-label="Name" />
        <input name="mobile" required className={fieldClass} placeholder="Mobile" aria-label="Mobile" />
        <input name="email" className={fieldClass} placeholder="Email, optional" aria-label="Email" />
        <input name="shape" required className={fieldClass} placeholder="Preferred shape" aria-label="Shape" />
        <input name="length" required className={fieldClass} placeholder="Preferred length" aria-label="Length" />
        <input name="colors" required className={fieldClass} placeholder="Colour preference" aria-label="Colours" />
        <input name="designCategory" required className={fieldClass} placeholder="Design category" aria-label="Design category" />
        <input name="occasion" required className={fieldClass} placeholder="Occasion" aria-label="Occasion" />
        <input name="budget" className={fieldClass} placeholder="Budget, optional" aria-label="Budget" />
        <textarea name="notes" className={fieldClass} rows={4} placeholder="Anything else" aria-label="Notes" />
        <label className="text-sm">
          Reference image, optional
          <input name="reference" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm" />
        </label>
        <button className={btnPrimary} type="submit">Submit request</button>
        {note ? <p className="text-sm">{note}</p> : null}
        {number ? <p className="text-sm">Request {number}</p> : null}
        {link ? <a className="text-deep" href={link} target="_blank" rel="noreferrer">Continue on WhatsApp</a> : null}
      </form>
    </main>
  );
}

export function SalonPage({ settings, services }: { settings: Settings; services: Service[] }) {
  const send = useServerFn(submitAppointment);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  return (
    <main>
      <PageIntro
        eyebrow="Salon"
        title="Appointment enquiries"
        text={settings.salonAddress || `${settings.location}. A time is not held until Yukti confirms it.`}
      />
      <div className="mx-auto grid max-w-6xl gap-4 px-5 md:grid-cols-3">
        {services.map((service) => (
          <article key={service.id} className="overflow-hidden rounded-3xl border border-line bg-paper">
            {service.imageUrl ? <img src={service.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" /> : null}
            <div className="p-5">
              <h2 className="font-serif text-3xl">{service.name}</h2>
              <p className="mt-2 text-sm text-muted">{service.description}</p>
              {service.startingPaise != null ? <p className="mt-2 text-sm">From {formatInr(service.startingPaise)}</p> : null}
              {service.durationMinutes ? <p className="text-sm text-muted">{service.durationMinutes} minutes, if confirmed</p> : null}
            </div>
          </article>
        ))}
      </div>
      <form
        className="mx-auto mt-10 grid max-w-3xl gap-4 px-5 pb-16"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const result = await send({
            data: {
              name: String(form.get("name") ?? ""),
              mobile: String(form.get("mobile") ?? ""),
              serviceName: String(form.get("serviceName") ?? ""),
              preferredDate: String(form.get("preferredDate") ?? ""),
              preferredTime: String(form.get("preferredTime") ?? ""),
              notes: String(form.get("notes") ?? ""),
            },
          });
          if (!result.ok) {
            setNote(result.error);
            setLink("");
            return;
          }
          setNote(`Enquiry ${result.data.number} saved as pending. This is not a booking.`);
          setLink(result.data.whatsappUrl);
        }}
      >
        <h2 className="font-serif text-4xl">Send an enquiry</h2>
        <input name="name" required className={fieldClass} placeholder="Name" aria-label="Name" />
        <input name="mobile" required className={fieldClass} placeholder="Mobile" aria-label="Mobile" />
        <select name="serviceName" required className={fieldClass} aria-label="Service" defaultValue={services[0]?.name}>
          {services.map((service) => (
            <option key={service.id}>{service.name}</option>
          ))}
        </select>
        <input name="preferredDate" required type="date" className={fieldClass} aria-label="Preferred date" />
        <input name="preferredTime" required className={fieldClass} placeholder="Preferred time" aria-label="Preferred time" />
        <textarea name="notes" className={fieldClass} rows={3} placeholder="Notes" aria-label="Notes" />
        <button className={btnPrimary} type="submit">Send enquiry</button>
        {note ? <p className="text-sm">{note}</p> : null}
        {link ? <a className="text-deep" href={link} target="_blank" rel="noreferrer">Continue on WhatsApp</a> : null}
      </form>
    </main>
  );
}

const galleryFilters = ["All", "Bridal", "French", "Floral", "Minimal", "Party Wear", "Custom Designs"];

export function GalleryPage({ images, instagramUrl }: { images: GalleryImage[]; instagramUrl: string }) {
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState<GalleryImage | null>(null);
  const shown = filter === "All" ? images : images.filter((image) => image.category === filter);
  return (
    <main>
      <PageIntro eyebrow="Gallery" title="A portfolio, not a feed" text="Photos Yukti chooses to show. Instagram itself stays on Instagram." />
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5">
        {galleryFilters.map((item) => (
          <button key={item} type="button" className={`shrink-0 rounded-full px-4 py-2 text-sm ${filter === item ? "bg-deep text-ivory" : "bg-paper"}`} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-6 max-w-6xl columns-2 gap-4 px-5 pb-8 md:columns-3">
        {shown.map((image) => (
          <button key={image.id} type="button" className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-3xl" onClick={() => setOpen(image)}>
            <img src={image.url} alt={image.alt} className="w-full object-cover" />
          </button>
        ))}
      </div>
      <p className="px-5 pb-16 text-center">
        <a className="text-deep" href={instagramUrl}>Follow on Instagram</a>
      </p>
      {open ? (
        <button type="button" className="fixed inset-0 z-50 bg-ink/80 p-6" onClick={() => setOpen(null)}>
          <img src={open.url} alt={open.alt} className="mx-auto max-h-full max-w-full object-contain" />
          {open.caption ? <span className="mt-3 block text-center text-ivory">{open.caption}</span> : null}
        </button>
      ) : null}
    </main>
  );
}

export function PolicyPage({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-5xl">{title}</h1>
      <p className="mt-6 whitespace-pre-line text-muted">{body}</p>
    </main>
  );
}

export function OrderPage({ order }: { order: PublicOrder }) {
  const [copied, setCopied] = useState(false);
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs tracking-widest text-rose uppercase">Order saved · unpaid</p>
      <h1 className="mt-2 font-serif text-5xl">{order.number}</h1>
      <p className="mt-4 text-muted">
        WhatsApp does not send this by itself. Open the chat and press send. Payment status stays {order.paymentStatus.replaceAll("_", " ").toLowerCase()} until Yukti updates it.
      </p>
      <a href={order.whatsappUrl} target="_blank" rel="noreferrer" className={`${btnPrimary} mt-6`}>
        Open WhatsApp to send this order
      </a>
      <button
        type="button"
        className="mt-4 block text-sm text-deep"
        onClick={async () => {
          await navigator.clipboard.writeText(order.summary);
          setCopied(true);
        }}
      >
        {copied ? "Summary copied" : "Copy order summary"}
      </button>
      <pre className="mt-6 overflow-x-auto rounded-3xl bg-paper p-5 text-sm whitespace-pre-wrap">{order.summary}</pre>
      <div className="mt-6 rounded-3xl bg-blush p-5 text-sm">
        <p className="font-medium">Payment instructions</p>
        <p className="mt-2 whitespace-pre-line">{order.paymentInstructions}</p>
        {order.upiId ? <p className="mt-2">UPI: {order.upiId}</p> : null}
      </div>
    </main>
  );
}

export function WishlistPage() {
  const ids = useCart((state) => state.wishlist);
  const hydrated = useCartHydrated();
  const load = useServerFn(getProductsByIds);
  const [items, setItems] = useState<ProductCard[]>([]);
  useEffect(() => {
    if (!hydrated) return;
    void load({ data: { ids } }).then(setItems);
  }, [hydrated, ids, load]);
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-serif text-5xl">Wishlist</h1>
      {!hydrated ? <p className="mt-4 text-muted">Loading…</p> : null}
      {hydrated && !items.length ? (
        <p className="mt-4 text-muted">
          Nothing saved yet. <Link to="/shop" search={blankShopSearch} className="text-deep">Browse the shop</Link>
        </p>
      ) : (
        <ul className="mt-8 grid gap-4">
          {items.map((item) => (
            <li key={item.id}>
              <Link to="/products/$slug" params={{ slug: item.slug }} className="flex items-center gap-4">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="size-20 rounded-2xl object-cover" /> : null}
                <span>
                  <span className="block font-serif text-2xl">{item.name}</span>
                  <span className="text-sm tabular-nums">{formatInr(item.pricePaise)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}
