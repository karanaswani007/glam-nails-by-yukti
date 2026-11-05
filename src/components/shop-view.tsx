import { Link, useNavigate } from "@tanstack/react-router";
import { ProductTile } from "@/components/product-card";
import { blankShopSearch, type ShopSearch } from "@/lib/shop-search";
import type { ShopData } from "@/lib/types";
import { fieldClass } from "@/lib/ui";

export function ShopView({ data, search }: { data: ShopData; search: ShopSearch }) {
  const navigate = useNavigate();
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  function update(next: Partial<ShopSearch>) {
    void navigate({ to: "/shop", search: { ...search, ...next, page: next.page ?? 1 } });
  }
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs tracking-widest text-rose uppercase">The shop</p>
      <h1 className="mt-2 font-serif text-5xl md:text-6xl">Press-on nails</h1>
      <p className="mt-3 max-w-xl text-muted">
        Filter the published collection. Sample designs are labelled, and prices are checked again when you check out.
      </p>
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          className={`shrink-0 rounded-full px-4 py-2 text-sm ${search.category === "" ? "bg-deep text-ivory" : "bg-paper text-ink"}`}
          onClick={() => update({ category: "" })}
        >
          All
        </button>
        {data.categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${search.category === category.slug ? "bg-deep text-ivory" : "bg-paper text-ink"}`}
            onClick={() => update({ category: category.slug })}
          >
            {category.name}
          </button>
        ))}
      </div>
      <form
        className="mt-4 grid gap-3 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          update({
            q: String(form.get("q") ?? ""),
            min: String(form.get("min") ?? ""),
            max: String(form.get("max") ?? ""),
            sort: String(form.get("sort") ?? "newest") as ShopSearch["sort"],
          });
        }}
      >
        <input name="q" defaultValue={search.q} className={fieldClass} placeholder="Search" aria-label="Search designs" />
        <input name="min" defaultValue={search.min} inputMode="numeric" className={fieldClass} placeholder="Min ₹" aria-label="Minimum price in rupees" />
        <input name="max" defaultValue={search.max} inputMode="numeric" className={fieldClass} placeholder="Max ₹" aria-label="Maximum price in rupees" />
        <div className="flex gap-2">
          <select name="sort" defaultValue={search.sort} className={fieldClass} aria-label="Sort">
            <option value="newest">Newest</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
            <option value="popular">Popularity</option>
          </select>
          <button type="submit" className="rounded-full bg-deep px-4 text-sm text-ivory">
            Apply
          </button>
        </div>
      </form>
      {data.items.length ? (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">
          {data.items.map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-12 rounded-3xl border border-line bg-paper px-6 py-12 text-center text-muted">
          Nothing matches that filter.{" "}
          <Link to="/shop" search={blankShopSearch} className="text-deep">
            Clear it
          </Link>
        </p>
      )}
      {pages > 1 ? (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button type="button" className="min-h-11 px-3 text-sm" disabled={search.page <= 1} onClick={() => update({ page: search.page - 1 })}>
            Previous
          </button>
          <span className="text-sm tabular-nums text-muted">
            {search.page} / {pages}
          </span>
          <button type="button" className="min-h-11 px-3 text-sm" disabled={search.page >= pages} onClick={() => update({ page: search.page + 1 })}>
            Next
          </button>
        </div>
      ) : null}
    </main>
  );
}
