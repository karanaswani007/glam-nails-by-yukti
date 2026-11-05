import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ProductTile } from "@/components/product-card";
import { useCart } from "@/lib/cart";
import { formatInr } from "@/lib/pricing";
import { blankShopSearch } from "@/lib/shop-search";
import type { ProductDetail, ProductCard as Card, Shell } from "@/lib/types";
import { btnGhost, btnPrimary, fieldClass } from "@/lib/ui";
import { buildProductEnquiry, whatsappHref } from "@/lib/whatsapp";

export function ProductView({
  product,
  related,
  shell,
}: {
  product: ProductDetail;
  related: Card[];
  shell: Shell;
}) {
  const add = useCart((state) => state.add);
  const navigate = useNavigate();
  const [shape, setShape] = useState(product.shapes[0] ?? "Almond");
  const [length, setLength] = useState(product.lengths[0] ?? "Medium");
  const [sizing, setSizing] = useState(product.sizing[0] ?? "Standard set");
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const image = product.images[active] ?? product.images[0];
  const soldOut = product.stock < 1;

  function line() {
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: image?.url ?? product.imageUrl,
      unitPaise: product.pricePaise,
      qty,
      shape,
      length,
      sizing,
      isSample: product.isSample,
    };
  }

  const enquiry = whatsappHref(
    shell.whatsappNumber,
    buildProductEnquiry({
      name: product.name,
      productId: product.id,
      shape,
      length,
      sizing,
      pricePaise: product.pricePaise,
      path: `/products/${product.slug}`,
    }),
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <p className="text-sm text-muted">
        <Link to="/shop" search={blankShopSearch}>Shop</Link>
        {product.categoryName ? ` / ${product.categoryName}` : ""} / {product.name}
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <button type="button" className="block w-full overflow-hidden rounded-3xl bg-blush" onClick={() => setZoom(true)} aria-label="Enlarge photo">
            {image ? <img src={image.url} alt={image.alt} className="aspect-square w-full object-cover" /> : null}
          </button>
          {product.images.length > 1 ? (
            <div className="mt-3 flex gap-2">
              {product.images.map((item, index) => (
                <button key={item.url} type="button" className={`overflow-hidden rounded-2xl border ${index === active ? "border-deep" : "border-line"}`} onClick={() => setActive(index)}>
                  <img src={item.url} alt="" className="size-16 object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          {product.isSample ? <p className="text-xs tracking-widest text-rose uppercase">Studio sample · illustrative price</p> : null}
          <h1 className="mt-2 font-serif text-5xl">{product.name}</h1>
          <p className="mt-4 text-lg tabular-nums">
            {formatInr(product.pricePaise)}
            {product.comparePaise && product.comparePaise > product.pricePaise ? (
              <span className="ml-2 text-base text-muted line-through">{formatInr(product.comparePaise)}</span>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-muted">{soldOut ? "Sold out" : `${product.stock} sets available`}</p>
          <p className="mt-5 whitespace-pre-line text-muted">{product.description}</p>
          <div className="mt-6 grid gap-4">
            <Select label="Shape" value={shape} options={product.shapes} onChange={setShape} />
            <Select label="Length" value={length} options={product.lengths} onChange={setLength} />
            <Select label="Sizing" value={sizing} options={product.sizing} onChange={setSizing} />
            <label className="block">
              <span className="mb-2 block text-xs tracking-widest text-muted uppercase">Quantity</span>
              <input
                className={fieldClass}
                type="number"
                min={1}
                max={Math.min(10, product.stock || 1)}
                value={qty}
                onChange={(event) => setQty(Math.max(1, Number(event.target.value) || 1))}
              />
            </label>
          </div>
          <details className="mt-4 text-sm text-muted">
            <summary className="cursor-pointer text-ink">Size guide</summary>
            <p className="mt-2">
              A standard set usually covers sizes 0 to 9. For custom sizing, measure the width of each nail and mention it on WhatsApp, or choose “Ask the artist”.
            </p>
          </details>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className={btnPrimary}
              disabled={soldOut}
              onClick={() => {
                add(line());
                toast.success("Added to your bag");
              }}
            >
              Add to bag
            </button>
            <button
              type="button"
              className={btnGhost}
              disabled={soldOut}
              onClick={() => {
                add(line());
                void navigate({ to: "/checkout" });
              }}
            >
              Buy now
            </button>
          </div>
          <a href={enquiry} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm text-deep">
            Enquire on WhatsApp
          </a>
          <p className="mt-4 text-xs text-muted">
            You send the WhatsApp message yourself. Placing an order does not take payment.
          </p>
        </div>
      </div>
      {related.length ? (
        <section className="mt-16">
          <h2 className="font-serif text-4xl">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductTile key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
      {zoom && image ? (
        <button type="button" className="fixed inset-0 z-50 bg-ink/80 p-4" onClick={() => setZoom(false)} aria-label="Close photo">
          <img src={image.url} alt={image.alt} className="mx-auto max-h-full max-w-full object-contain" />
        </button>
      ) : null}
    </main>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs tracking-widest text-muted uppercase">{label}</span>
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
