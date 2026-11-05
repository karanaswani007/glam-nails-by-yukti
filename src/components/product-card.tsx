import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatInr } from "@/lib/pricing";
import type { ProductCard } from "@/lib/types";

export function discountPercent(price: number, compare: number | null) {
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

export function SampleMark({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="rounded-full bg-blush px-2.5 py-1 text-xs font-medium tracking-wide text-deep uppercase">
      Sample
    </span>
  );
}

export function ProductTile({ product }: { product: ProductCard }) {
  const wished = useCart((state) => state.wishlist.includes(product.id));
  const toggle = useCart((state) => state.toggleWish);
  const add = useCart((state) => state.add);
  const off = discountPercent(product.pricePaise, product.comparePaise);
  const soldOut = product.stock < 1;

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden rounded-3xl bg-blush">
        <Link to="/products/$slug" params={{ slug: product.slug }} className="block">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.imageAlt}
              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="aspect-square w-full bg-blush" />
          )}
        </Link>
        <div className="absolute top-3 left-3 flex gap-2">
          <SampleMark show={product.isSample} />
          {off > 0 ? (
            <span className="rounded-full bg-deep px-2.5 py-1 text-xs text-ivory">Save {off}%</span>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-full bg-ivory/90 text-deep"
          onClick={() => toggle(product.id)}
        >
          <Heart className="size-4" fill={wished ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="flex flex-1 flex-col px-1 pt-4">
        <p className="text-xs tracking-widest text-muted uppercase">{product.categoryName || "Press-on nails"}</p>
        <h3 className="mt-1 font-serif text-2xl text-ink">
          <Link to="/products/$slug" params={{ slug: product.slug }}>
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-ink tabular-nums">
          {formatInr(product.pricePaise)}
          {product.comparePaise && product.comparePaise > product.pricePaise ? (
            <span className="ml-2 text-muted line-through">{formatInr(product.comparePaise)}</span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-muted">{soldOut ? "Sold out" : product.isSample ? "Illustrative price" : "In stock"}</p>
        <div className="mt-4 flex gap-2">
          <Link
            to="/products/$slug"
            params={{ slug: product.slug }}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-line px-3 text-sm text-ink hover:border-deep"
          >
            View details
          </Link>
          <button
            type="button"
            disabled={soldOut}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-deep px-3 text-sm text-ivory disabled:opacity-40"
            onClick={() => {
              add({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                imageUrl: product.imageUrl,
                unitPaise: product.pricePaise,
                shape: "Almond",
                length: "Medium",
                sizing: "Standard set",
                isSample: product.isSample,
              });
              toast.success("Added to your bag");
            }}
          >
            Add to bag
          </button>
        </div>
      </div>
    </article>
  );
}
