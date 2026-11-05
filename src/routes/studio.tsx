import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { studioBootstrap } from "@/lib/server/store";
import {
  studioDeleteProduct,
  studioLogin,
  studioLogout,
  studioRecover,
  studioSaveProduct,
  studioSaveSettings,
  studioSetup,
  studioUpdateAppointment,
  studioUpdateCustom,
  studioUpdateOrder,
} from "@/lib/server/store";
import { formatInr } from "@/lib/pricing";
import type { ProductDetail, Result, StudioData } from "@/lib/types";
import { btnGhost, btnPrimary, fieldClass } from "@/lib/ui";

export const Route = createFileRoute("/studio")({
  loader: () => studioBootstrap(),
  head: () => ({ meta: [{ title: "Studio · Glam Nails by Yukti" }] }),
  component: StudioPage,
});

type Panel = "overview" | "orders" | "products" | "requests" | "settings";

const orderStatuses = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
const paymentStatuses = ["UNPAID", "PAYMENT_REPORTED", "PAID", "REFUNDED"] as const;

function StudioPage() {
  const boot = Route.useLoaderData();
  const router = useRouter();
  const setupFn = useServerFn(studioSetup);
  const loginFn = useServerFn(studioLogin);
  const recoverFn = useServerFn(studioRecover);
  const [recoverMode, setRecoverMode] = useState(false);
  const [pending, setPending] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");

  async function runAuth<T>(
    request: () => Promise<Result<T>>,
    successMessage: string,
  ): Promise<T | null> {
    setPending(true);
    try {
      const result = await request();
      if (!result.ok) {
        toast.error(result.error);
        return null;
      }
      toast.success(successMessage);
      await router.invalidate();
      return result.data;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The studio request failed.");
      return null;
    } finally {
      setPending(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!boot.configured) {
      const result = await runAuth(
        () => setupFn({ data: { password: String(form.get("password") ?? "") } }),
        "Studio password created.",
      );
      if (result && "recoveryCode" in result) setRecoveryCode(result.recoveryCode);
      return;
    }
    if (recoverMode) {
      const result = await runAuth(
        () =>
          recoverFn({
            data: {
              recoveryCode: String(form.get("recoveryCode") ?? ""),
              password: String(form.get("password") ?? ""),
            },
          }),
        "Password updated. Store your new recovery code safely.",
      );
      if (result && "recoveryCode" in result) setRecoveryCode(result.recoveryCode);
      return;
    }
    await runAuth(
      () => loginFn({ data: { password: String(form.get("password") ?? "") } }),
      "Welcome back.",
    );
  }

  if (boot.signedIn && boot.data) {
    return (
      <StudioDashboard
        data={boot.data}
        onRefresh={() => router.invalidate()}
        recoveryCode={recoveryCode}
        onDismissRecovery={() => setRecoveryCode("")}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-6xl items-center px-5 py-12">
      <div className="grid w-full overflow-hidden rounded-3xl border border-line bg-paper shadow-sm md:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between bg-deep p-8 text-ivory md:p-12">
          <div className="flex items-center gap-3 text-sm text-blush">
            <Store size={18} aria-hidden="true" />
            <span className="tracking-widest uppercase">Glam Nails by Yukti</span>
          </div>
          <div className="py-12">
            <p className="text-xs tracking-widest text-blush uppercase">Private workspace</p>
            <h1 className="mt-4 max-w-md font-serif text-5xl leading-tight md:text-6xl">
              Your studio, in good hands.
            </h1>
            <p className="mt-5 max-w-md leading-7 text-blush">
              Manage the collection, orders and enquiries from one calm, secure place.
            </p>
          </div>
          <a href="/" className="inline-flex items-center gap-2 text-sm text-blush hover:text-ivory">
            Back to the storefront <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </section>

        <section className="p-6 md:p-12">
          <div className="mx-auto max-w-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blush text-deep">
              <ShieldCheck size={23} aria-hidden="true" />
            </div>
            <h2 className="mt-6 font-serif text-4xl">
              {!boot.configured ? "Set up your studio" : recoverMode ? "Reset your password" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {!boot.configured
                ? "Choose a strong password. A one-time recovery code will be shown after setup."
                : recoverMode
                  ? "Use your recovery code to choose a new password."
                  : "Sign in with your studio password to continue."}
            </p>

            {recoveryCode ? (
              <div className="mt-6 rounded-2xl border border-line bg-ivory p-4" role="status">
                <p className="font-medium">Save this recovery code now</p>
                <p className="mt-2 break-all rounded-xl bg-paper px-3 py-3 font-mono text-lg tracking-widest">
                  {recoveryCode}
                </p>
                <p className="mt-2 text-sm text-muted">
                  It is shown only once. Keep it somewhere private and secure.
                </p>
                <button
                  type="button"
                  className={`${btnGhost} mt-3`}
                  onClick={() => setRecoveryCode("")}
                >
                  I saved it
                </button>
              </div>
            ) : null}

            <form className="mt-7 space-y-4" onSubmit={(event) => void submitPassword(event)}>
              {recoverMode ? (
                <label className="block text-sm font-medium">
                  Recovery code
                  <input
                    className={`${fieldClass} mt-2`}
                    name="recoveryCode"
                    autoComplete="one-time-code"
                    required
                    minLength={8}
                    maxLength={20}
                    disabled={pending}
                  />
                </label>
              ) : null}
              <label className="block text-sm font-medium">
                {recoverMode ? "New password" : "Studio password"}
                <input
                  className={`${fieldClass} mt-2`}
                  name="password"
                  type="password"
                  autoComplete={boot.configured ? (recoverMode ? "new-password" : "current-password") : "new-password"}
                  required
                  minLength={8}
                  maxLength={72}
                  disabled={pending}
                />
              </label>
              <button className={`${btnPrimary} w-full`} type="submit" disabled={pending || Boolean(recoveryCode)}>
                {pending ? "Please wait…" : !boot.configured ? "Create studio password" : recoverMode ? "Reset password" : "Sign in"}
              </button>
            </form>

            {boot.configured ? (
              <button
                type="button"
                className="mt-4 min-h-11 text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink"
                onClick={() => setRecoverMode((value) => !value)}
              >
                {recoverMode ? "Return to sign in" : "Use recovery code"}
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function StudioDashboard({
  data,
  onRefresh,
  recoveryCode,
  onDismissRecovery,
}: {
  data: StudioData;
  onRefresh: () => Promise<void>;
  recoveryCode: string;
  onDismissRecovery: () => void;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("overview");
  const [pending, setPending] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null | undefined>(undefined);
  const saveProductFn = useServerFn(studioSaveProduct);
  const deleteProductFn = useServerFn(studioDeleteProduct);
  const updateOrderFn = useServerFn(studioUpdateOrder);
  const updateCustomFn = useServerFn(studioUpdateCustom);
  const updateAppointmentFn = useServerFn(studioUpdateAppointment);
  const saveSettingsFn = useServerFn(studioSaveSettings);
  const logoutFn = useServerFn(studioLogout);

  async function mutate<T>(
    request: () => Promise<Result<T>>,
    successMessage: string,
  ): Promise<boolean> {
    setPending(true);
    try {
      const result = await request();
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      toast.success(successMessage);
      await onRefresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The change could not be saved.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    setPending(true);
    try {
      await logoutFn();
      await router.invalidate();
      toast.success("You are signed out.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setPending(false);
    }
  }

  const navigation: { id: Panel; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: `Orders${data.stats.pending ? ` · ${data.stats.pending}` : ""}` },
    { id: "products", label: "Products" },
    { id: "requests", label: "Enquiries" },
    { id: "settings", label: "Website settings" },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-8 md:py-12">
      {recoveryCode ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <strong>New recovery code:</strong>{" "}
            <code className="break-all font-mono tracking-widest">{recoveryCode}</code>
            <span className="mt-1 block text-sm text-muted">Save it now; it will not be shown again.</span>
          </p>
          <button type="button" className={btnGhost} onClick={onDismissRecovery}>
            <Check size={16} aria-hidden="true" /> Saved
          </button>
        </div>
      ) : null}

      <header className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-widest text-rose uppercase">Glam Nails by Yukti</p>
          <h1 className="mt-2 font-serif text-5xl">Studio</h1>
          <p className="mt-2 text-sm text-muted">A clear view of your shop, orders and customer requests.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnGhost} onClick={() => void onRefresh()} disabled={pending}>
            <RefreshCw size={16} aria-hidden="true" /> Refresh
          </button>
          <button type="button" className={btnGhost} onClick={() => void logout()} disabled={pending}>
            <LogOut size={16} aria-hidden="true" /> Sign out
          </button>
        </div>
      </header>

      <nav className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Studio sections">
        {navigation.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm transition ${panel === item.id ? "bg-deep text-ivory" : "bg-paper text-ink hover:bg-blush"}`}
            aria-current={panel === item.id ? "page" : undefined}
            onClick={() => setPanel(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className="mt-8">
        {panel === "overview" ? <Overview data={data} onNavigate={setPanel} /> : null}
        {panel === "orders" ? (
          <Orders data={data} pending={pending} onUpdate={(payload) => mutate(
            () => updateOrderFn({ data: payload }),
            "Order updated.",
          )} />
        ) : null}
        {panel === "products" ? (
          <Products
            data={data}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            pending={pending}
            onSave={(payload) => mutate(() => saveProductFn({ data: payload }), "Product saved.")
              .then((saved) => { if (saved) setEditingProduct(undefined); return saved; })}
            onDelete={(id) => mutate(() => deleteProductFn({ data: { id } }), "Product removed.")}
          />
        ) : null}
        {panel === "requests" ? (
          <Requests
            data={data}
            pending={pending}
            onUpdateCustom={(payload) => mutate(() => updateCustomFn({ data: payload }), "Custom request updated.")}
            onUpdateAppointment={(payload) => mutate(() => updateAppointmentFn({ data: payload }), "Appointment updated.")}
          />
        ) : null}
        {panel === "settings" ? (
          <SettingsPanel data={data} pending={pending} onSave={(payload) =>
            mutate(() => saveSettingsFn({ data: payload }), "Website settings saved.")
          } />
        ) : null}
      </section>
    </main>
  );
}

function Overview({ data, onNavigate }: { data: StudioData; onNavigate: (panel: Panel) => void }) {
  const metrics = [
    { label: "All orders", value: data.stats.orders },
    { label: "Need attention", value: data.stats.pending },
    { label: "Paid revenue", value: formatInr(data.stats.paidRevenuePaise) },
    { label: "Low-stock designs", value: data.lowStock.length },
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-3xl border border-line bg-paper p-5">
            <p className="text-sm text-muted">{metric.label}</p>
            <p className="mt-3 font-serif text-4xl tabular-nums">{metric.value}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-paper p-5 md:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs tracking-widest text-rose uppercase">Recent sales</p>
              <h2 className="mt-2 font-serif text-3xl">Orders to follow up</h2>
            </div>
            <button type="button" className="text-sm underline underline-offset-4" onClick={() => onNavigate("orders")}>
              View all
            </button>
          </div>
          <div className="mt-5 divide-y divide-line">
            {data.orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{order.number} · {order.customerName}</p>
                  <p className="mt-1 text-sm text-muted">{order.status.replaceAll("_", " ")}</p>
                </div>
                <p className="font-medium tabular-nums">{formatInr(order.totalPaise)}</p>
              </div>
            ))}
            {!data.orders.length ? <EmptyState text="Your orders will appear here." /> : null}
          </div>
        </section>
        <section className="rounded-3xl border border-line bg-paper p-5 md:p-7">
          <div className="flex items-center gap-3">
            <CircleAlert size={18} className="text-rose" aria-hidden="true" />
            <div>
              <p className="text-xs tracking-widest text-rose uppercase">Inventory</p>
              <h2 className="mt-1 font-serif text-3xl">Running low</h2>
            </div>
          </div>
          <div className="mt-5 divide-y divide-line">
            {data.lowStock.slice(0, 6).map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 py-3">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted"><span className="tabular-nums">{product.stock}</span> left</p>
              </div>
            ))}
            {!data.lowStock.length ? <EmptyState text="All published designs are above your low-stock threshold." /> : null}
          </div>
          <button type="button" className="mt-4 text-sm underline underline-offset-4" onClick={() => onNavigate("products")}>
            Manage products
          </button>
        </section>
      </div>
    </div>
  );
}

function Orders({
  data,
  pending,
  onUpdate,
}: {
  data: StudioData;
  pending: boolean;
  onUpdate: (payload: { id: string; status: (typeof orderStatuses)[number]; paymentStatus: (typeof paymentStatuses)[number]; internalNotes: string }) => Promise<boolean>;
}) {
  return (
    <section>
      <PanelHeading kicker="Customer orders" title="Orders" detail="Review payment separately; the website never marks an order paid automatically." />
      <div className="mt-6 space-y-4">
        {data.orders.map((order) => (
          <form
            key={order.id}
            className="rounded-3xl border border-line bg-paper p-5 md:p-7"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void onUpdate({
                id: order.id,
                status: String(form.get("status")) as (typeof orderStatuses)[number],
                paymentStatus: String(form.get("paymentStatus")) as (typeof paymentStatuses)[number],
                internalNotes: String(form.get("internalNotes") ?? ""),
              });
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-widest text-rose uppercase">{order.number}</p>
                <h2 className="mt-1 font-serif text-3xl">{order.customerName}</h2>
                <p className="mt-1 text-sm text-muted">{order.mobile}{order.email ? ` · ${order.email}` : ""}</p>
              </div>
              <p className="font-serif text-3xl tabular-nums">{formatInr(order.totalPaise)}</p>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
              <div>
                <p className="text-sm font-medium">Items</p>
                <ul className="mt-2 space-y-2 text-sm text-muted">
                  {order.items.map((item, index) => (
                    <li key={`${order.id}-${index}`}>
                      {item.qty} × {item.name} · {item.shape}, {item.length}, {item.sizing}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 whitespace-pre-line text-sm text-muted">
                  {[order.address.house, order.address.street, order.address.city, order.address.state, order.address.pin]
                    .filter(Boolean).join(", ")}
                </p>
                {order.notes ? <p className="mt-2 text-sm text-muted">Customer note: {order.notes}</p> : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Order status
                  <select className={`${fieldClass} mt-2`} name="status" defaultValue={order.status} disabled={pending}>
                    {orderStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Payment
                  <select className={`${fieldClass} mt-2`} name="paymentStatus" defaultValue={order.paymentStatus} disabled={pending}>
                    {paymentStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium sm:col-span-2">
                  Private note
                  <textarea className={`${fieldClass} mt-2`} name="internalNotes" rows={2} defaultValue={order.internalNotes} maxLength={800} disabled={pending} />
                </label>
                <button type="submit" className={`${btnPrimary} sm:col-span-2 sm:justify-self-start`} disabled={pending}>
                  <Save size={16} aria-hidden="true" /> Save order
                </button>
              </div>
            </div>
          </form>
        ))}
        {!data.orders.length ? <EmptyState text="No orders yet." /> : null}
      </div>
    </section>
  );
}

function Products({
  data,
  editingProduct,
  setEditingProduct,
  pending,
  onSave,
  onDelete,
}: {
  data: StudioData;
  editingProduct: ProductDetail | null | undefined;
  setEditingProduct: (product: ProductDetail | null | undefined) => void;
  pending: boolean;
  onSave: (payload: {
    id: string | null;
    name: string;
    description: string;
    categoryId: string | null;
    priceRupees: number;
    compareRupees: number | null;
    stock: number;
    featured: boolean;
    bestSeller: boolean;
    published: boolean;
    isSample: boolean;
    shapes: string;
    lengths: string;
    sizing: string;
    images: { url: string; alt: string }[];
  }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const imageUrls = String(form.get("images") ?? "").split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
    void onSave({
      id: String(form.get("id") ?? "") || null,
      name,
      description: String(form.get("description") ?? ""),
      categoryId: String(form.get("categoryId") ?? "") || null,
      priceRupees: Number(form.get("priceRupees")),
      compareRupees: String(form.get("compareRupees") ?? "") ? Number(form.get("compareRupees")) : null,
      stock: Number(form.get("stock")),
      featured: form.has("featured"),
      bestSeller: form.has("bestSeller"),
      published: form.has("published"),
      isSample: form.has("isSample"),
      shapes: String(form.get("shapes") ?? ""),
      lengths: String(form.get("lengths") ?? ""),
      sizing: String(form.get("sizing") ?? ""),
      images: imageUrls.map((url) => ({ url, alt: name })),
    });
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PanelHeading kicker="The collection" title="Products" detail={`${data.products.length} designs in your catalogue`} />
        {editingProduct === undefined ? (
          <button type="button" className={btnPrimary} onClick={() => setEditingProduct(null)}>
            <Plus size={16} aria-hidden="true" /> Add design
          </button>
        ) : null}
      </div>
      {editingProduct !== undefined ? (
        <form className="mt-6 rounded-3xl border border-line bg-paper p-5 md:p-7" onSubmit={submitProduct}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-3xl">{editingProduct ? "Edit design" : "New design"}</h2>
            <button type="button" className={btnGhost} onClick={() => setEditingProduct(undefined)} aria-label="Close product form">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <input type="hidden" name="id" value={editingProduct?.id ?? ""} />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Design name" name="name" required defaultValue={editingProduct?.name ?? ""} maxLength={80} />
            <Field label="Price (₹)" name="priceRupees" type="number" min="0" step="1" required defaultValue={editingProduct ? editingProduct.pricePaise / 100 : ""} />
            <Field label="Compare-at price (₹)" name="compareRupees" type="number" min="0" step="1" defaultValue={editingProduct?.comparePaise ? editingProduct.comparePaise / 100 : ""} />
            <label className="text-sm font-medium">
              Category
              <select className={`${fieldClass} mt-2`} name="categoryId" defaultValue={editingProduct?.categoryId ?? ""}>
                <option value="">Uncategorised</option>
                {data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Description
              <textarea className={`${fieldClass} mt-2`} name="description" rows={3} required minLength={10} maxLength={2000} defaultValue={editingProduct?.description ?? ""} />
            </label>
            <Field label="Stock" name="stock" type="number" min="0" step="1" required defaultValue={editingProduct?.stock ?? 0} />
            <Field label="Shapes (comma-separated)" name="shapes" required defaultValue={editingProduct?.shapes.join(", ") ?? "Almond, Square"} />
            <Field label="Lengths (comma-separated)" name="lengths" required defaultValue={editingProduct?.lengths.join(", ") ?? "Short, Medium, Long"} />
            <Field label="Sizing options (comma-separated)" name="sizing" required defaultValue={editingProduct?.sizing.join(", ") ?? "Standard, Custom"} />
            <label className="text-sm font-medium md:col-span-2">
              Image URLs (one per line)
              <textarea className={`${fieldClass} mt-2`} name="images" rows={3} maxLength={500000} required defaultValue={editingProduct?.images.map((image) => image.url).join("\n") ?? ""} />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            <CheckField name="published" label="Published" defaultChecked={editingProduct?.published ?? true} />
            <CheckField name="featured" label="Featured" defaultChecked={editingProduct?.featured ?? false} />
            <CheckField name="bestSeller" label="Best seller" defaultChecked={editingProduct?.bestSeller ?? false} />
            <CheckField name="isSample" label="Sample design" defaultChecked={editingProduct?.isSample ?? false} />
          </div>
          <button type="submit" className={`${btnPrimary} mt-6`} disabled={pending}>
            <Save size={16} aria-hidden="true" /> {pending ? "Saving…" : "Save design"}
          </button>
        </form>
      ) : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.products.map((product) => (
          <article key={product.id} className="overflow-hidden rounded-3xl border border-line bg-paper">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.imageAlt || product.name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-ivory text-muted"><Package size={28} aria-hidden="true" /></div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted">{product.categoryName || "Uncategorised"} · {product.stock} in stock</p>
                </div>
                <p className="font-medium tabular-nums">{formatInr(product.pricePaise)}</p>
              </div>
              <p className="mt-2 text-xs text-muted">
                {product.published ? "Published" : "Draft"}{product.isSample ? " · Sample" : ""}
              </p>
              <div className="mt-4 flex gap-2">
                <button type="button" className={`${btnGhost} flex-1`} onClick={() => setEditingProduct(product)}>Edit</button>
                <button
                  type="button"
                  className="min-h-11 rounded-full px-4 text-sm text-muted hover:bg-blush hover:text-ink"
                  onClick={() => {
                    if (window.confirm(`Remove "${product.name}" from the catalogue?`)) void onDelete(product.id);
                  }}
                  disabled={pending}
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
        {!data.products.length ? <EmptyState text="Add your first design to start building the collection." /> : null}
      </div>
    </section>
  );
}

function Requests({
  data,
  pending,
  onUpdateCustom,
  onUpdateAppointment,
}: {
  data: StudioData;
  pending: boolean;
  onUpdateCustom: (payload: { id: string; status: "NEW" | "IN_REVIEW" | "QUOTED" | "ACCEPTED" | "CLOSED"; internalNotes: string }) => Promise<boolean>;
  onUpdateAppointment: (payload: { id: string; status: "PENDING" | "APPROVED" | "DECLINED" | "COMPLETED"; internalNotes: string }) => Promise<boolean>;
}) {
  return (
    <section>
      <PanelHeading kicker="Customer conversations" title="Enquiries" detail="Custom designs and salon requests are enquiries, not confirmed bookings." />
      <div className="mt-6 space-y-8">
        <div>
          <h2 className="font-serif text-3xl">Custom design requests</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {data.customRequests.map((item) => (
              <RequestCard
                key={item.id}
                id={item.id}
                title={`${item.number} · ${item.name}`}
                detail={[item.designCategory, item.occasion, item.budget].filter(Boolean).join(" · ")}
                description={[item.colors, item.shape, item.length, item.notes].filter(Boolean).join(" · ")}
                status={item.status}
                internalNotes={item.internalNotes}
                statuses={["NEW", "IN_REVIEW", "QUOTED", "ACCEPTED", "CLOSED"]}
                pending={pending}
                onSave={(status, internalNotes) => onUpdateCustom({
                  id: item.id,
                  status: status as "NEW" | "IN_REVIEW" | "QUOTED" | "ACCEPTED" | "CLOSED",
                  internalNotes,
                })}
              />
            ))}
            {!data.customRequests.length ? <EmptyState text="No custom design requests." /> : null}
          </div>
        </div>
        <div>
          <h2 className="font-serif text-3xl">Salon appointments</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {data.appointments.map((item) => (
              <RequestCard
                key={item.id}
                id={item.id}
                title={`${item.number} · ${item.name}`}
                detail={`${item.serviceName} · ${item.preferredDate} · ${item.preferredTime}`}
                description={item.notes}
                status={item.status}
                internalNotes={item.internalNotes}
                statuses={["PENDING", "APPROVED", "DECLINED", "COMPLETED"]}
                pending={pending}
                onSave={(status, internalNotes) => onUpdateAppointment({
                  id: item.id,
                  status: status as "PENDING" | "APPROVED" | "DECLINED" | "COMPLETED",
                  internalNotes,
                })}
              />
            ))}
            {!data.appointments.length ? <EmptyState text="No appointment requests." /> : null}
          </div>
        </div>
        <div>
          <h2 className="font-serif text-3xl">General messages</h2>
          <div className="mt-4 divide-y divide-line rounded-3xl border border-line bg-paper px-5">
            {data.enquiries.map((item) => (
              <article key={item.id} className="py-4">
                <p className="font-medium">{item.name} · {item.mobile}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{item.message}</p>
              </article>
            ))}
            {!data.enquiries.length ? <p className="py-5 text-sm text-muted">No general messages.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function RequestCard({
  id,
  title,
  detail,
  description,
  status,
  internalNotes,
  statuses,
  pending,
  onSave,
}: {
  id: string;
  title: string;
  detail: string;
  description: string;
  status: string;
  internalNotes: string;
  statuses: string[];
  pending: boolean;
  onSave: (status: string, internalNotes: string) => Promise<boolean>;
}) {
  return (
    <form
      className="rounded-3xl border border-line bg-paper p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void onSave(String(form.get("status")), String(form.get("internalNotes") ?? ""));
      }}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
      {description ? <p className="mt-3 whitespace-pre-wrap text-sm">{description}</p> : null}
      <input type="hidden" name="id" value={id} />
      <label className="mt-4 block text-sm font-medium">
        Status
        <select name="status" className={`${fieldClass} mt-2`} defaultValue={status} disabled={pending}>
          {statuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
        </select>
      </label>
      <label className="mt-3 block text-sm font-medium">
        Private note
        <textarea name="internalNotes" className={`${fieldClass} mt-2`} rows={2} maxLength={800} defaultValue={internalNotes} disabled={pending} />
      </label>
      <button type="submit" className={`${btnGhost} mt-3`} disabled={pending}>
        <Save size={16} aria-hidden="true" /> Save enquiry
      </button>
    </form>
  );
}

function SettingsPanel({
  data,
  pending,
  onSave,
}: {
  data: StudioData;
  pending: boolean;
  onSave: (payload: {
    brandName: string; announcement: string; heroHeading: string;
    heroText: string; heroImage: string; aboutTitle: string; aboutBody: string;
    whatsappNumber: string; whatsappDisplay: string; instagramUrl: string; instagramHandle: string;
    location: string; salonAddress: string; shippingMode: "flat" | "confirm";
    shippingRupees: number; freeShippingRupees: number | null; upiId: string;
    paymentInstructions: string; paymentAccount: string; policyShipping: string;
    policyPrivacy: string; policyTerms: string; policyReturns: string; lowStock: number;
    faqs: { q: string; a: string }[];
  }) => Promise<boolean>;
}) {
  const settings = data.settings;
  const [faqs, setFaqs] = useState(settings.faqs);

  useEffect(() => {
    setFaqs(settings.faqs);
  }, [settings.faqs]);

  function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const faqEntries = faqs
      .map(({ q, a }) => ({ q: q.trim(), a: a.trim() }))
      .filter(({ q, a }) => q.length > 0 || a.length > 0);
    if (faqEntries.some(({ q, a }) => q.length < 2 || a.length < 2)) {
      toast.error("Add both a question and an answer, or remove the empty FAQ.");
      return;
    }
    const freeShippingValue = String(form.get("freeShippingRupees") ?? "");
    void onSave({
      brandName: String(form.get("brandName") ?? ""),
      announcement: String(form.get("announcement") ?? ""),
      heroHeading: String(form.get("heroHeading") ?? ""),
      heroText: String(form.get("heroText") ?? ""),
      heroImage: String(form.get("heroImage") ?? ""),
      aboutTitle: String(form.get("aboutTitle") ?? ""),
      aboutBody: String(form.get("aboutBody") ?? ""),
      whatsappNumber: String(form.get("whatsappNumber") ?? ""),
      whatsappDisplay: String(form.get("whatsappDisplay") ?? ""),
      instagramUrl: String(form.get("instagramUrl") ?? ""),
      instagramHandle: String(form.get("instagramHandle") ?? ""),
      location: String(form.get("location") ?? ""),
      salonAddress: String(form.get("salonAddress") ?? ""),
      shippingMode: String(form.get("shippingMode")) === "flat" ? "flat" : "confirm",
      shippingRupees: Number(form.get("shippingRupees")),
      freeShippingRupees: freeShippingValue ? Number(freeShippingValue) : null,
      upiId: String(form.get("upiId") ?? ""),
      paymentInstructions: String(form.get("paymentInstructions") ?? ""),
      paymentAccount: String(form.get("paymentAccount") ?? ""),
      policyShipping: String(form.get("policyShipping") ?? ""),
      policyPrivacy: String(form.get("policyPrivacy") ?? ""),
      policyTerms: String(form.get("policyTerms") ?? ""),
      policyReturns: String(form.get("policyReturns") ?? ""),
      lowStock: Number(form.get("lowStock")),
      faqs: faqEntries,
    });
  }
  return (
    <section>
      <PanelHeading kicker="Storefront" title="Website settings" detail="Keep contact, delivery and policy details current before accepting orders." />
      <form className="mt-6 space-y-8 rounded-3xl border border-line bg-paper p-5 md:p-8" onSubmit={submitSettings}>
        <div>
          <h2 className="font-serif text-3xl">Brand and home page</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Brand name" name="brandName" required defaultValue={settings.brandName} />
            <Field label="Announcement bar" name="announcement" defaultValue={settings.announcement} maxLength={180} />
            <Field label="Hero heading" name="heroHeading" required defaultValue={settings.heroHeading} />
            <Field label="Hero image URL" name="heroImage" defaultValue={settings.heroImage} />
            <TextField label="Hero introduction" name="heroText" defaultValue={settings.heroText} rows={3} className="md:col-span-2" />
            <Field label="About heading" name="aboutTitle" defaultValue={settings.aboutTitle} />
            <TextField label="About story" name="aboutBody" defaultValue={settings.aboutBody} rows={4} />
          </div>
        </div>
        <div>
          <h2 className="font-serif text-3xl">Contact and fulfilment</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="WhatsApp number (country code)" name="whatsappNumber" required defaultValue={settings.whatsappNumber} />
            <Field label="WhatsApp display number" name="whatsappDisplay" defaultValue={settings.whatsappDisplay} />
            <Field label="Instagram profile URL" name="instagramUrl" type="url" required defaultValue={settings.instagramUrl} />
            <Field label="Instagram handle" name="instagramHandle" defaultValue={settings.instagramHandle} />
            <Field label="Business location" name="location" defaultValue={settings.location} />
            <Field label="Salon address" name="salonAddress" defaultValue={settings.salonAddress} />
            <label className="text-sm font-medium">
              Delivery pricing
              <select className={`${fieldClass} mt-2`} name="shippingMode" defaultValue={settings.shippingMode}>
                <option value="confirm">Confirm delivery with the customer</option>
                <option value="flat">Flat rate</option>
              </select>
            </label>
            <Field label="Flat delivery rate (₹)" name="shippingRupees" type="number" min="0" step="1" defaultValue={settings.shippingPaise / 100} />
            <Field label="Free delivery from (₹)" name="freeShippingRupees" type="number" min="0" step="1" defaultValue={settings.freeShippingPaise == null ? "" : settings.freeShippingPaise / 100} />
            <Field label="Low-stock warning at" name="lowStock" type="number" min="0" max="100" step="1" defaultValue={settings.lowStock} />
          </div>
        </div>
        <div>
          <h2 className="font-serif text-3xl">Payments and policies</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="UPI ID (optional)" name="upiId" defaultValue={settings.upiId} />
            <Field label="Payment account details (optional)" name="paymentAccount" defaultValue={settings.paymentAccount} />
            <TextField label="Payment instructions" name="paymentInstructions" defaultValue={settings.paymentInstructions} rows={3} className="md:col-span-2" />
            <TextField label="Delivery policy" name="policyShipping" defaultValue={settings.policyShipping} rows={3} />
            <TextField label="Privacy policy" name="policyPrivacy" defaultValue={settings.policyPrivacy} rows={3} />
            <TextField label="Terms" name="policyTerms" defaultValue={settings.policyTerms} rows={3} />
            <TextField label="Returns policy" name="policyReturns" defaultValue={settings.policyReturns} rows={3} />
          </div>
        </div>
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-3xl">Frequently asked questions</h2>
              <p className="mt-1 text-sm text-muted">Add, edit or remove the questions shown on your home page.</p>
            </div>
            <p className="text-sm text-muted">{faqs.length} of 12</p>
          </div>
          <div className="mt-4 space-y-4">
            {faqs.map((faq, index) => (
              <fieldset key={index} className="grid gap-4 rounded-2xl border border-line p-4 md:grid-cols-2 md:p-5">
                <legend className="px-2 text-sm font-medium">FAQ {index + 1}</legend>
                <label className="block text-sm font-medium">
                  Question
                  <input
                    className={`${fieldClass} mt-2`}
                    name={`faq-question-${index}`}
                    value={faq.q}
                    maxLength={160}
                    disabled={pending}
                    onChange={(event) => {
                      const q = event.currentTarget.value;
                      setFaqs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, q } : item));
                    }}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Answer
                  <textarea
                    className={`${fieldClass} mt-2`}
                    name={`faq-answer-${index}`}
                    value={faq.a}
                    rows={3}
                    maxLength={600}
                    disabled={pending}
                    onChange={(event) => {
                      const a = event.currentTarget.value;
                      setFaqs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, a } : item));
                    }}
                  />
                </label>
                <button
                  type="button"
                  className={`${btnGhost} min-h-11 md:col-span-2 md:justify-self-start`}
                  aria-label={`Remove FAQ ${index + 1}`}
                  onClick={() => setFaqs((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  disabled={pending}
                >
                  <X size={16} aria-hidden="true" /> Remove FAQ
                </button>
              </fieldset>
            ))}
            {faqs.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">
                No FAQs yet. Add one to answer common customer questions.
              </p>
            ) : null}
            <button
              type="button"
              className={btnGhost}
              onClick={() => setFaqs((current) => [...current, { q: "", a: "" }])}
              disabled={pending || faqs.length >= 12}
            >
              <Plus size={16} aria-hidden="true" /> Add a question
            </button>
          </div>
        </div>
        <button type="submit" className={btnPrimary} disabled={pending}>
          <Save size={16} aria-hidden="true" /> {pending ? "Saving…" : "Save website settings"}
        </button>
      </form>
    </section>
  );
}

function PanelHeading({ kicker, title, detail }: { kicker: string; title: string; detail: string }) {
  return (
    <div>
      <p className="text-xs tracking-widest text-rose uppercase">{kicker}</p>
      <h2 className="mt-2 font-serif text-4xl">{title}</h2>
      <p className="mt-2 text-sm text-muted">{detail}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-paper p-6 text-sm text-muted">
      <Sparkles size={16} className="mb-2 text-rose" aria-hidden="true" />
      {text}
    </div>
  );
}

function Field({
  label,
  name,
  className = "",
  ...props
}: {
  label: string;
  name: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block text-sm font-medium ${className}`}>
      {label}
      <input className={`${fieldClass} mt-2`} name={name} {...props} />
    </label>
  );
}

function TextField({
  label,
  name,
  className = "",
  ...props
}: {
  label: string;
  name: string;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={`block text-sm font-medium ${className}`}>
      {label}
      <textarea className={`${fieldClass} mt-2`} name={name} {...props} />
    </label>
  );
}

function CheckField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 text-sm">
      <input className="size-4 accent-deep" type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}
