import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useCart, useCartHydrated } from "@/lib/cart";
import { INDIA_STATES } from "@/lib/india";
import { deliveryLabel, formatInr } from "@/lib/pricing";
import { blankShopSearch } from "@/lib/shop-search";
import { placeOrder, quoteCart } from "@/lib/server/store";
import type { PublicQuote, Settings } from "@/lib/types";
import { btnGhost, btnPrimary, fieldClass } from "@/lib/ui";

function useIdempotency(signature: string) {
  const [key, setKey] = useState("");
  useEffect(() => {
    const storedSig = sessionStorage.getItem("gn-idem-sig");
    let stored = sessionStorage.getItem("gn-idem");
    if (!stored || storedSig !== signature) {
      stored = crypto.randomUUID();
      sessionStorage.setItem("gn-idem", stored);
      sessionStorage.setItem("gn-idem-sig", signature);
    }
    setKey(stored);
  }, [signature]);
  return key;
}

export function useQuote() {
  const lines = useCart((state) => state.lines);
  const hydrated = useCartHydrated();
  const quoteFn = useServerFn(quoteCart);
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!hydrated || !lines.length) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setPending(true);
    void quoteFn({
      data: {
        coupon,
        lines: lines.map((line) => ({
          productId: line.productId,
          qty: line.qty,
          shape: line.shape,
          length: line.length,
          sizing: line.sizing,
        })),
      },
    }).then((result) => {
      if (cancelled) return;
      setPending(false);
      if (result.ok) {
        setQuote(result.data);
        setError(result.data.couponError ?? "");
      } else {
        setQuote(null);
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, lines, coupon, quoteFn]);
  return { lines, hydrated, coupon, setCoupon, quote, error, pending };
}

export function QuoteTable({ quote }: { quote: PublicQuote }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatInr(quote.subtotalPaise)}</dd></div>
      {quote.discountPaise > 0 ? (
        <div className="flex justify-between"><dt>Discount</dt><dd className="tabular-nums">−{formatInr(quote.discountPaise)}</dd></div>
      ) : null}
      <div className="flex justify-between">
        <dt>Delivery</dt>
        <dd>{deliveryLabel(quote.shippingNote, quote.shippingPaise)}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-2 text-base">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatInr(quote.totalPaise)}</dd>
      </div>
      {quote.shippingNote === "confirm" ? (
        <p className="text-xs text-muted">Delivery is confirmed with Yukti and is not included in this total.</p>
      ) : null}
    </dl>
  );
}

export function CartPage() {
  const { lines, hydrated, coupon, setCoupon, quote, error, pending } = useQuote();
  const setQty = useCart((state) => state.setQty);
  const remove = useCart((state) => state.remove);
  if (!hydrated) return <main className="px-5 py-16 text-muted">Opening your bag…</main>;
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-serif text-5xl">Your bag</h1>
      {!lines.length ? (
        <p className="mt-6 text-muted">
          Your bag is empty. <Link to="/shop" search={blankShopSearch} className="text-deep">Continue shopping</Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
          <ul className="space-y-4">
            {lines.map((line) => (
              <li key={line.key} className="flex gap-4 rounded-3xl border border-line bg-paper p-3">
                {line.imageUrl ? <img src={line.imageUrl} alt="" className="size-24 rounded-2xl object-cover" /> : null}
                <div className="min-w-0 flex-1">
                  <Link to="/products/$slug" params={{ slug: line.slug }} className="font-serif text-2xl">{line.name}</Link>
                  <p className="text-sm text-muted">{line.shape} · {line.length} · {line.sizing}</p>
                  {line.isSample ? <p className="text-xs text-rose">Sample · illustrative price</p> : null}
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-sm">
                      Qty
                      <input
                        className="ml-2 w-16 rounded-xl border border-line px-2 py-2"
                        type="number"
                        min={1}
                        max={10}
                        value={line.qty}
                        onChange={(event) => setQty(line.key, Number(event.target.value))}
                      />
                    </label>
                    <button type="button" className="text-sm text-deep" onClick={() => remove(line.key)}>Remove</button>
                  </div>
                </div>
                <p className="text-sm tabular-nums">{formatInr(line.unitPaise * line.qty)}</p>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-3xl border border-line bg-paper p-5">
            <label className="block text-sm">
              Coupon
              <input className={`${fieldClass} mt-2`} value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Code" />
            </label>
            {error ? <p className="mt-3 text-sm text-deep">{error}</p> : null}
            {pending ? <p className="mt-4 text-sm text-muted">Updating prices…</p> : null}
            {quote ? <div className="mt-4"><QuoteTable quote={quote} /></div> : null}
            <Link to="/checkout" className={`${btnPrimary} mt-6 w-full`}>Proceed to checkout</Link>
            <Link to="/shop" search={blankShopSearch} className={`${btnGhost} mt-3 w-full`}>Continue shopping</Link>
          </aside>
        </div>
      )}
    </main>
  );
}

export function CheckoutPage({ settings }: { settings: Settings }) {
  const { lines, hydrated, coupon, setCoupon, quote, error, pending } = useQuote();
  const clear = useCart((state) => state.clear);
  const navigate = useNavigate();
  const send = useServerFn(placeOrder);
  const signature = lines.map((line) => `${line.key}:${line.qty}`).join("|");
  const idempotencyKey = useIdempotency(signature);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!hydrated) return <main className="px-5 py-16 text-muted">Preparing checkout…</main>;
  if (!lines.length) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-serif text-5xl">Checkout</h1>
        <p className="mt-4 text-muted">Your bag is empty.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!idempotencyKey || !quote || quote.couponError) return;
          const form = new FormData(event.currentTarget);
          setSubmitting(true);
          setFormError("");
          const result = await send({
            data: {
              idempotencyKey,
              coupon,
              name: String(form.get("name") ?? ""),
              mobile: String(form.get("mobile") ?? ""),
              email: String(form.get("email") ?? ""),
              notes: String(form.get("notes") ?? ""),
              address: {
                house: String(form.get("house") ?? ""),
                street: String(form.get("street") ?? ""),
                city: String(form.get("city") ?? ""),
                state: String(form.get("state") ?? ""),
                pin: String(form.get("pin") ?? ""),
                instructions: String(form.get("instructions") ?? ""),
              },
              lines: lines.map((line) => ({
                productId: line.productId,
                qty: line.qty,
                shape: line.shape,
                length: line.length,
                sizing: line.sizing,
              })),
            },
          });
          setSubmitting(false);
          if (!result.ok) {
            setFormError(result.error);
            return;
          }
          clear();
          sessionStorage.removeItem("gn-idem");
          void navigate({ to: "/order/$token", params: { token: result.data.token } });
        }}
      >
        <h1 className="font-serif text-5xl">Checkout</h1>
        <p className="text-sm text-muted">
          This saves your order as unpaid. You then send the summary on WhatsApp yourself. Payment is not taken here.
        </p>
        <Field name="name" label="Full name" required />
        <Field name="mobile" label="Mobile number" required placeholder="10-digit Indian mobile" />
        <Field name="email" label="Email (optional)" type="email" />
        <Field name="house" label="House / flat" required />
        <Field name="street" label="Street / area" required />
        <Field name="city" label="City" required />
        <label className="block text-sm">
          State
          <select name="state" required className={`${fieldClass} mt-2`} defaultValue="Maharashtra">
            {INDIA_STATES.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
        </label>
        <Field name="pin" label="PIN code" required inputMode="numeric" />
        <label className="block text-sm">
          Delivery instructions (optional)
          <textarea name="instructions" className={`${fieldClass} mt-2`} rows={3} />
        </label>
        <label className="block text-sm">
          Note for Yukti (optional)
          <textarea name="notes" className={`${fieldClass} mt-2`} rows={3} />
        </label>
        <div className="rounded-3xl bg-blush p-4 text-sm">
          <p className="font-medium">Payment</p>
          <p className="mt-2 whitespace-pre-line text-ink">{settings.paymentInstructions}</p>
          {settings.upiId ? <p className="mt-2">UPI: {settings.upiId}</p> : <p className="mt-2 text-muted">UPI ID has not been added yet.</p>}
          {settings.paymentAccount ? <p className="mt-2 whitespace-pre-line">{settings.paymentAccount}</p> : null}
        </div>
        {formError ? <p className="text-sm text-deep">{formError}</p> : null}
        <button className={btnPrimary} disabled={submitting || pending || !quote || Boolean(quote?.couponError)} type="submit">
          {submitting ? "Saving order…" : "Place order and continue on WhatsApp"}
        </button>
      </form>
      <aside className="h-fit rounded-3xl border border-line bg-paper p-5">
        <h2 className="font-serif text-3xl">Order</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((line) => (
            <li key={line.key}>
              <span className="font-medium">{line.name}</span>
              <span className="block text-muted">{line.qty} · {line.shape}, {line.length}, {line.sizing}</span>
            </li>
          ))}
        </ul>
        <label className="mt-4 block text-sm">
          Coupon
          <input className={`${fieldClass} mt-2`} value={coupon} onChange={(event) => setCoupon(event.target.value)} />
        </label>
        {error ? <p className="mt-3 text-sm text-deep">{error}</p> : null}
        {quote ? <div className="mt-4"><QuoteTable quote={quote} /></div> : null}
      </aside>
    </main>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  inputMode,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="block text-sm">
      {label}
      <input name={name} type={type} required={required} placeholder={placeholder} inputMode={inputMode} className={`${fieldClass} mt-2`} />
    </label>
  );
}
