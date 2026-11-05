import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql, type Sql } from "@/lib/db";
import { INDIA_STATES } from "@/lib/india";
import { isValidPin, normalizeMobile, priceQuote, type CouponMath, type ShippingNote } from "@/lib/pricing";
import type {
  Address,
  Appointment,
  Category,
  Coupon,
  CustomRequest,
  Enquiry,
  GalleryImage,
  HomeData,
  OrderAdmin,
  ProductCard,
  ProductDetail,
  PublicOrder,
  PublicQuote,
  QuoteLine,
  Result,
  Service,
  Settings,
  Shell,
  ShopData,
  StudioBoot,
  StudioData,
  Testimonial,
} from "@/lib/types";
import {
  buildAppointmentMessage,
  buildCustomMessage,
  buildOrderMessage,
  whatsappHref,
} from "@/lib/whatsapp";

const COOKIE = "gn_studio";
const PAGE_SIZE = 9;

const DEFAULTS: Record<string, string> = {
  brand_name: "Glam Nails by Yukti",
  announcement: "Handcrafted press-on nails from Bhusawal, delivered across India.",
  show_sample_notice: "true",
  hero_heading: "Elegance at Your Fingertips.",
  hero_text:
    "Handcrafted press-on nails from Bhusawal, shaped for everyday wear, celebrations and bridal days, with delivery across India.",
  hero_image: "/images/hero.jpg",
  about_title: "The artist behind the brand",
  about_body:
    "Yukti is the nail artist behind Glam Nails by Yukti, based in Bhusawal, Maharashtra.\n\nRewrite this in the studio. Qualifications and awards are left blank until you add them.",
  whatsapp_number: "918766067782",
  whatsapp_display: "+91 87660 67782",
  instagram_url: "https://www.instagram.com/glam_nails_by_yukti/",
  instagram_handle: "@glam_nails_by_yukti",
  location: "Bhusawal, Maharashtra, India",
  salon_address: "",
  shipping_mode: "confirm",
  shipping_paise: "0",
  free_shipping_paise: "",
  upi_id: "",
  payment_instructions:
    "Online payment is not collected on this website. Send your order summary on WhatsApp. The order stays unpaid until Yukti confirms it.",
  payment_account: "",
  policy_shipping:
    "This note has not been published yet. Add your delivery wording in Studio before you rely on it.",
  policy_privacy:
    "This note has not been published yet. Add your privacy wording in Studio before you rely on it.",
  policy_terms:
    "This note has not been published yet. Nothing here is a confirmed booking until Yukti says so.",
  policy_returns: "This note has not been published yet. Add your returns wording in Studio.",
  low_stock: "3",
  faqs: "[]",
};

const ORDER_STATUS = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
const PAY_STATUS = ["UNPAID", "PAYMENT_REPORTED", "PAID", "REFUNDED"] as const;

const PRODUCT_SQL = `
  p.id, p.slug, p.name, p.description, p.category_id, p.price_paise, p.compare_paise,
  p.stock, p.featured, p.best_seller, p.published, p.is_sample, p.shapes, p.lengths, p.sizing,
  c.name as category_name, c.slug as category_slug,
  (select i.url from product_images i where i.product_id = p.id order by i.sort_order, i.id limit 1) as image_url,
  (select i.alt from product_images i where i.product_id = p.id order by i.sort_order, i.id limit 1) as image_alt
  from products p
  left join categories c on c.id = p.category_id
`;

type PRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string | null;
  price_paise: number | string;
  compare_paise: number | string | null;
  stock: number | string;
  featured: boolean | string;
  best_seller: boolean | string;
  published: boolean | string;
  is_sample: boolean | string;
  shapes: string;
  lengths: string;
  sizing: string;
  category_name: string | null;
  category_slug: string | null;
  image_url: string | null;
  image_alt: string | null;
};

const buckets = new Map<string, { n: number; reset: number }>();

function fail(error: string): Result<never> {
  return { ok: false, error };
}

function asError(err: unknown) {
  if (err instanceof Error && err.message && !/syntax error|relation |duplicate key|sql/i.test(err.message)) {
    return err.message;
  }
  console.error(err);
  return "Something went wrong. Please try again.";
}

function bit(value: unknown) {
  return value === true || value === "t" || value === "true" || value === 1;
}

function num(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseFaqs(raw: string) {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as { q?: unknown; a?: unknown };
      return typeof row.q === "string" && typeof row.a === "string" && row.q && row.a
        ? [{ q: row.q, a: row.a }]
        : [];
    });
  } catch {
    return [];
  }
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "design";
}

function card(row: PRow): ProductCard {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    pricePaise: num(row.price_paise),
    comparePaise: row.compare_paise == null ? null : num(row.compare_paise),
    stock: num(row.stock),
    featured: bit(row.featured),
    bestSeller: bit(row.best_seller),
    published: bit(row.published),
    isSample: bit(row.is_sample),
    categoryId: row.category_id,
    categoryName: row.category_name ?? "",
    categorySlug: row.category_slug ?? "",
    imageUrl: row.image_url ?? "",
    imageAlt: row.image_alt || row.name,
  };
}

function detail(row: PRow, images: { url: string; alt: string }[]): ProductDetail {
  return {
    ...card(row),
    description: row.description,
    shapes: splitCsv(row.shapes),
    lengths: splitCsv(row.lengths),
    sizing: splitCsv(row.sizing),
    images: images.length ? images : row.image_url ? [{ url: row.image_url, alt: row.image_alt || row.name }] : [],
  };
}

async function readMap(sql: Sql) {
  const rows = await sql<{ key: string; value: string }>`select key, value from settings`;
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

function toSettings(map: Record<string, string>): Settings {
  const free = map.free_shipping_paise?.trim();
  const shell: Shell = {
    brandName: map.brand_name || DEFAULTS.brand_name,
    announcement: map.announcement || "",
    showSampleNotice: map.show_sample_notice !== "false",
    whatsappNumber: map.whatsapp_number || DEFAULTS.whatsapp_number,
    whatsappDisplay: map.whatsapp_display || DEFAULTS.whatsapp_display,
    instagramUrl: map.instagram_url || DEFAULTS.instagram_url,
    instagramHandle: map.instagram_handle || DEFAULTS.instagram_handle,
    location: map.location || DEFAULTS.location,
    salonAddress: map.salon_address || "",
    generalWhatsappUrl: whatsappHref(
      map.whatsapp_number || DEFAULTS.whatsapp_number,
      "Hello Glam Nails by Yukti! I would like to ask about your nails.",
    ),
  };
  return {
    ...shell,
    heroHeading: map.hero_heading || DEFAULTS.hero_heading,
    heroText: map.hero_text || DEFAULTS.hero_text,
    heroImage: map.hero_image || DEFAULTS.hero_image,
    aboutTitle: map.about_title || DEFAULTS.about_title,
    aboutBody: map.about_body || DEFAULTS.about_body,
    shippingMode: map.shipping_mode === "flat" ? "flat" : "confirm",
    shippingPaise: Math.max(0, num(map.shipping_paise)),
    freeShippingPaise: free ? Math.max(0, num(free)) : null,
    upiId: map.upi_id || "",
    paymentInstructions: map.payment_instructions || "",
    paymentAccount: map.payment_account || "",
    policyShipping: map.policy_shipping || "",
    policyPrivacy: map.policy_privacy || "",
    policyTerms: map.policy_terms || "",
    policyReturns: map.policy_returns || "",
    lowStock: Math.max(0, num(map.low_stock || 3)),
    faqs: parseFaqs(map.faqs || "[]"),
  };
}

async function settings(sql: Sql) {
  return toSettings(await readMap(sql));
}

async function sha256(value: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(value).digest("hex");
}

async function hashSecret(value: string) {
  const { randomBytes, scrypt } = await import("node:crypto");
  const salt = randomBytes(16).toString("hex");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(value, salt, 32, (err, key) => (err ? reject(err) : resolve(key as Buffer)));
  });
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

async function verifySecret(value: string, stored: string) {
  const { scrypt, timingSafeEqual } = await import("node:crypto");
  const [algo, salt, hex] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hex) return false;
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(value, salt, 32, (err, key) => (err ? reject(err) : resolve(key as Buffer)));
  });
  const a = Buffer.from(hex, "hex");
  if (a.length !== derived.length) return false;
  return timingSafeEqual(a, derived);
}

async function newId() {
  const { randomBytes } = await import("node:crypto");
  return randomBytes(16).toString("hex");
}

function recoveryCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function clientKey(prefix: string) {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const ip = (getRequest().headers.get("x-forwarded-for") ?? "local").split(",")[0]?.trim() || "local";
    return `${prefix}:${ip}`;
  } catch {
    return `${prefix}:local`;
  }
}

function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const row = buckets.get(key);
  if (!row || row.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return;
  }
  row.n += 1;
  if (row.n > max) throw new Error("Please wait a moment and try again.");
}

async function setStudioCookie(token: string) {
  const { setCookie, getRequest } = await import("@tanstack/react-start/server");
  const secure = new URL(getRequest().url).protocol === "https:";
  setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

async function studioOpen(sql: Sql) {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(COOKIE);
  if (!token) return false;
  const hash = await sha256(token);
  const rows = await sql<{ ok: number }>`
    select 1 as ok from studio_sessions where token_hash = ${hash} and expires_at > now()
  `;
  return rows.length > 0;
}

async function requireStudio(sql: Sql) {
  if (!(await studioOpen(sql))) throw new Error("Sign in to the studio.");
}

function cleanImage(url: string) {
  const value = url.trim();
  if (!value) return "";
  if (value.startsWith("/images/") && value.length < 240) return value;
  if (/^https:\/\/[^\s]+$/i.test(value) && value.length < 2000) return value;
  if (/^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(value)) {
    if (value.length > 450000) throw new Error("That image is too large. Use one under about 300 KB, or paste a link.");
    return value;
  }
  throw new Error("Use a photo from this site, an https link, or a small JPG, PNG or WebP.");
}

async function audit(sql: Sql, action: string, detail: string) {
  await sql`insert into audit_log (id, action, detail) values (${await newId()}, ${action}, ${detail.slice(0, 240)})`;
}

function addressLines(address: Address) {
  return [
    [address.house, address.street].filter(Boolean).join(", "),
    [address.city, address.state, address.pin].filter(Boolean).join(", "),
    address.instructions ? `Note: ${address.instructions}` : "",
  ];
}

function parseAddress(raw: string): Address {
  try {
    const value = JSON.parse(raw) as Address;
    return {
      house: value.house || "",
      street: value.street || "",
      city: value.city || "",
      state: value.state || "",
      pin: value.pin || "",
      instructions: value.instructions || "",
    };
  } catch {
    return { house: "", street: "", city: "", state: "", pin: "", instructions: "" };
  }
}

async function loadOrder(sql: Sql, token: string): Promise<PublicOrder | null> {
  const rows = await sql<{
    number: string;
    status: string;
    payment_status: string;
    customer_name: string;
    mobile: string;
    email: string;
    address_json: string;
    notes: string;
    subtotal_paise: number;
    discount_paise: number;
    shipping_paise: number;
    shipping_note: string;
    total_paise: number;
    id: string;
    created_at: string;
  }>`
    select id, number, status, payment_status, customer_name, mobile, email, address_json, notes,
      subtotal_paise, discount_paise, shipping_paise, shipping_note, total_paise, created_at::text as created_at
    from orders where access_token = ${token}
  `;
  const order = rows[0];
  if (!order) return null;
  const items = await sql<{
    product_id: string | null;
    name: string;
    unit_paise: number;
    qty: number;
    shape: string;
    length: string;
    sizing: string;
    image_url: string;
  }>`
    select product_id, name, unit_paise, qty, shape, length, sizing, image_url
    from order_items where order_id = ${order.id}
  `;
  const current = await settings(sql);
  const note = (["flat", "free", "confirm"].includes(order.shipping_note)
    ? order.shipping_note
    : "confirm") as ShippingNote;
  const address = parseAddress(order.address_json);
  const lines: QuoteLine[] = items.map((item) => ({
    productId: item.product_id ?? "",
    name: item.name,
    slug: "",
    imageUrl: item.image_url,
    unitPaise: num(item.unit_paise),
    qty: num(item.qty),
    shape: item.shape,
    length: item.length,
    sizing: item.sizing,
    linePaise: num(item.unit_paise) * num(item.qty),
  }));
  const summary = buildOrderMessage({
    orderNumber: order.number,
    customerName: order.customer_name,
    lines,
    subtotalPaise: num(order.subtotal_paise),
    discountPaise: num(order.discount_paise),
    shippingPaise: num(order.shipping_paise),
    shippingNote: note,
    totalPaise: num(order.total_paise),
    addressLines: addressLines(address),
  });
  return {
    number: order.number,
    status: order.status,
    paymentStatus: order.payment_status,
    customerName: order.customer_name,
    mobile: order.mobile,
    email: order.email,
    address,
    notes: order.notes,
    subtotalPaise: num(order.subtotal_paise),
    discountPaise: num(order.discount_paise),
    shippingPaise: num(order.shipping_paise),
    shippingNote: note,
    totalPaise: num(order.total_paise),
    items: lines,
    summary,
    whatsappUrl: whatsappHref(current.whatsappNumber, summary),
    paymentInstructions: current.paymentInstructions,
    upiId: current.upiId,
    createdAt: order.created_at,
  };
}

async function categories(sql: Sql, visibleOnly: boolean) {
  const rows = visibleOnly
    ? await sql<CategoryRow>`select id, name, slug, description, image_url, sort_order, visible from categories where visible = true order by sort_order, name`
    : await sql<CategoryRow>`select id, name, slug, description, image_url, sort_order, visible from categories order by sort_order, name`;
  return rows.map(mapCategory);
}

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
  visible: boolean | string;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    sortOrder: num(row.sort_order),
    visible: bit(row.visible),
  };
}

async function gallery(sql: Sql, visibleOnly: boolean) {
  const rows = visibleOnly
    ? await sql<GalleryRow>`select id, category, url, alt, caption, sort_order, visible from gallery_images where visible = true order by sort_order, id`
    : await sql<GalleryRow>`select id, category, url, alt, caption, sort_order, visible from gallery_images order by sort_order, id`;
  return rows.map(mapGallery);
}

type GalleryRow = {
  id: string;
  category: string;
  url: string;
  alt: string;
  caption: string;
  sort_order: number;
  visible: boolean | string;
};

function mapGallery(row: GalleryRow): GalleryImage {
  return {
    id: row.id,
    category: row.category,
    url: row.url,
    alt: row.alt,
    caption: row.caption,
    sortOrder: num(row.sort_order),
    visible: bit(row.visible),
  };
}

async function services(sql: Sql, visibleOnly: boolean) {
  const rows = visibleOnly
    ? await sql<ServiceRow>`select id, name, description, image_url, starting_paise, duration_minutes, sort_order, visible from services where visible = true order by sort_order, name`
    : await sql<ServiceRow>`select id, name, description, image_url, starting_paise, duration_minutes, sort_order, visible from services order by sort_order, name`;
  return rows.map(mapService);
}

type ServiceRow = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  starting_paise: number | null;
  duration_minutes: number | null;
  sort_order: number;
  visible: boolean | string;
};

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    startingPaise: row.starting_paise == null ? null : num(row.starting_paise),
    durationMinutes: row.duration_minutes == null ? null : num(row.duration_minutes),
    sortOrder: num(row.sort_order),
    visible: bit(row.visible),
  };
}

const quoteInput = z.object({
  coupon: z.string().trim().max(40).default(""),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1).max(80),
        qty: z.number().int().min(1).max(10),
        shape: z.string().trim().min(1).max(40),
        length: z.string().trim().min(1).max(40),
        sizing: z.string().trim().min(1).max(40),
      }),
    )
    .min(1)
    .max(20),
});

async function buildQuote(
  sql: Sql,
  input: z.infer<typeof quoteInput>,
): Promise<Result<PublicQuote & { coupon: CouponMath | null; couponCode: string | null }>> {
  const ids = [...new Set(input.lines.map((line) => line.productId))];
  const rows = await sql.query<PRow>(
    `select ${PRODUCT_SQL} where p.id = any($1::text[])`,
    [ids],
  );
  const byId = new Map(rows.map((row) => [row.id, row]));
  const lines: QuoteLine[] = [];
  for (const line of input.lines) {
    const product = byId.get(line.productId);
    if (!product || !bit(product.published)) return fail("A design in your bag is no longer available.");
    if (num(product.stock) < line.qty) return fail(`${product.name} does not have enough sets in stock.`);
    const shapes = splitCsv(product.shapes);
    const lengths = splitCsv(product.lengths);
    const sizing = splitCsv(product.sizing);
    if (!shapes.includes(line.shape) || !lengths.includes(line.length) || !sizing.includes(line.sizing)) {
      return fail(`Choose a valid shape, length and sizing for ${product.name}.`);
    }
    const unit = num(product.price_paise);
    lines.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.image_url ?? "",
      unitPaise: unit,
      qty: line.qty,
      shape: line.shape,
      length: line.length,
      sizing: line.sizing,
      linePaise: unit * line.qty,
    });
  }
  const needed = new Map<string, number>();
  for (const line of lines) needed.set(line.productId, (needed.get(line.productId) ?? 0) + line.qty);
  for (const [id, qty] of needed) {
    const product = byId.get(id);
    if (!product || num(product.stock) < qty) return fail(`${product?.name ?? "A design"} does not have enough sets in stock.`);
  }
  const current = await settings(sql);
  let coupon: CouponMath | null = null;
  let couponCode: string | null = null;
  const code = input.coupon.trim().toUpperCase();
  if (code) {
    const found = await sql<{
      type: string;
      amount: number;
      min_subtotal_paise: number;
      expires_on: string | null;
      usage_limit: number | null;
      usage_count: number;
      active: boolean | string;
    }>`
      select type, amount, min_subtotal_paise, expires_on::text as expires_on, usage_limit, usage_count, active
      from coupons where upper(code) = ${code}
    `;
    const row = found[0];
    const today = new Date().toISOString().slice(0, 10);
    if (!row || !bit(row.active)) return fail("That coupon is not active.");
    if (row.expires_on && row.expires_on < today) return fail("That coupon has expired.");
    if (row.usage_limit != null && num(row.usage_count) >= num(row.usage_limit)) {
      return fail("That coupon has reached its limit.");
    }
    if (row.type !== "PERCENT" && row.type !== "FIXED") return fail("That coupon cannot be applied.");
    coupon = {
      type: row.type,
      amount: num(row.amount),
      minSubtotalPaise: num(row.min_subtotal_paise),
    };
    couponCode = code;
  }
  const priced = priceQuote({
    lines,
    coupon,
    shippingMode: current.shippingMode,
    shippingPaise: current.shippingPaise,
    freeShippingPaise: current.freeShippingPaise,
  });
  return {
    ok: true,
    data: { ...priced, lines, couponCode, coupon },
  };
}

export const getShell = createServerFn({ method: "GET" }).handler(async (): Promise<Shell> => {
  const sql = await getSql();
  const current = await settings(sql);
  return {
    brandName: current.brandName,
    announcement: current.announcement,
    showSampleNotice: current.showSampleNotice,
    whatsappNumber: current.whatsappNumber,
    whatsappDisplay: current.whatsappDisplay,
    instagramUrl: current.instagramUrl,
    instagramHandle: current.instagramHandle,
    location: current.location,
    salonAddress: current.salonAddress,
    generalWhatsappUrl: current.generalWhatsappUrl,
  };
});

export const getHome = createServerFn({ method: "GET" }).handler(async (): Promise<HomeData> => {
  const sql = await getSql();
  const current = await settings(sql);
  let products = (
    await sql.query<PRow>(
      `select ${PRODUCT_SQL} where p.published = true and (p.best_seller = true or p.featured = true) order by p.best_seller desc, p.units_sold desc, p.created_at desc limit 8`,
    )
  ).map(card);
  if (!products.length) {
    products = (
      await sql.query<PRow>(`select ${PRODUCT_SQL} where p.published = true order by p.created_at desc limit 8`)
    ).map(card);
  }
  const quotes = await sql<{
    id: string;
    name: string;
    location: string;
    quote: string;
    rating: number | null;
    photo_url: string;
    approved: boolean | string;
    featured: boolean | string;
  }>`
    select id, name, location, quote, rating, photo_url, approved, featured
    from testimonials where approved = true
    order by featured desc, created_at desc limit 6
  `;
  return {
    settings: current,
    categories: await categories(sql, true),
    products,
    services: await services(sql, true),
    gallery: (await gallery(sql, true)).slice(0, 6),
    testimonials: quotes.map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location,
      quote: row.quote,
      rating: row.rating == null ? null : num(row.rating),
      photoUrl: row.photo_url,
      approved: true,
      featured: bit(row.featured),
    })),
  };
});

const shopSchema = z.object({
  q: z.string().max(80).default(""),
  category: z.string().max(80).default(""),
  sort: z.enum(["newest", "price-asc", "price-desc", "popular"]).default("newest"),
  page: z.number().int().min(1).max(100).default(1),
  min: z.string().max(10).default(""),
  max: z.string().max(10).default(""),
});

export const getShop = createServerFn({ method: "GET" })
  .validator((input: unknown) => shopSchema.parse(input))
  .handler(async ({ data }): Promise<ShopData> => {
    const sql = await getSql();
    const where: string[] = ["p.published = true"];
    const params: unknown[] = [];
    if (data.category) {
      params.push(data.category);
      where.push(`c.slug = $${params.length}`);
    }
    if (data.q.trim()) {
      params.push(`%${data.q.trim().replace(/[%_]/g, "")}%`);
      where.push(`(p.name ilike $${params.length} or p.description ilike $${params.length})`);
    }
    const min = data.min.trim() ? Math.round(Number(data.min) * 100) : null;
    const max = data.max.trim() ? Math.round(Number(data.max) * 100) : null;
    if (min != null && Number.isFinite(min)) {
      params.push(min);
      where.push(`p.price_paise >= $${params.length}`);
    }
    if (max != null && Number.isFinite(max)) {
      params.push(max);
      where.push(`p.price_paise <= $${params.length}`);
    }
    const clause = where.join(" and ");
    const sort =
      data.sort === "price-asc"
        ? "p.price_paise asc"
        : data.sort === "price-desc"
          ? "p.price_paise desc"
          : data.sort === "popular"
            ? "p.units_sold desc, p.created_at desc"
            : "p.created_at desc";
    const totalRows = await sql.query<{ n: number }>(
      `select count(*)::int as n ${PRODUCT_SQL.replace(/^[\s\S]*from products p/, "from products p")} and ${clause.replace("p.published = true and ", "")}`.includes("where")
        ? `select count(*)::int as n from products p left join categories c on c.id = p.category_id where ${clause}`
        : `select count(*)::int as n from products p left join categories c on c.id = p.category_id where ${clause}`,
      params,
    );
    const total = num(totalRows[0]?.n);
    const page = data.page;
    const offset = (page - 1) * PAGE_SIZE;
    const items = await sql.query<PRow>(
      `select ${PRODUCT_SQL} where ${clause} order by ${sort} limit ${PAGE_SIZE} offset ${offset}`,
      params,
    );
    return {
      items: items.map(card),
      total,
      page,
      pageSize: PAGE_SIZE,
      categories: await categories(sql, true),
    };
  });

export const getProduct = createServerFn({ method: "GET" })
  .validator((input: { slug?: string }) => ({ slug: String(input?.slug ?? "") }))
  .handler(async ({ data }): Promise<{ product: ProductDetail; related: ProductCard[] } | null> => {
    const sql = await getSql();
    const rows = await sql.query<PRow>(`select ${PRODUCT_SQL} where p.slug = $1 and p.published = true`, [
      data.slug,
    ]);
    const row = rows[0];
    if (!row) return null;
    const images = await sql<{ url: string; alt: string }>`
      select url, alt from product_images where product_id = ${row.id} order by sort_order, id
    `;
    const related = await sql.query<PRow>(
      `select ${PRODUCT_SQL} where p.published = true and p.id <> $1 and ($2::text is null or p.category_id = $2) order by p.best_seller desc, p.created_at desc limit 4`,
      [row.id, row.category_id],
    );
    return { product: detail(row, images), related: related.map(card) };
  });

export const getGallery = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return gallery(sql, true);
});

export const getServices = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return { settings: await settings(sql), services: await services(sql, true) };
});

export const getContent = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return settings(sql);
});

export const getProductsByIds = createServerFn({ method: "POST" })
  .validator((input: { ids?: string[] }) => ({
    ids: Array.isArray(input?.ids) ? input.ids.filter((id) => typeof id === "string").slice(0, 40) : [],
  }))
  .handler(async ({ data }) => {
    if (!data.ids.length) return [] as ProductCard[];
    const sql = await getSql();
    const rows = await sql.query<PRow>(
      `select ${PRODUCT_SQL} where p.published = true and p.id = any($1::text[])`,
      [data.ids],
    );
    return rows.map(card);
  });

export const quoteCart = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<PublicQuote>> => {
    try {
      const parsed = quoteInput.safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check your bag.");
      const sql = await getSql();
      const quote = await buildQuote(sql, parsed.data);
      if (!quote.ok) return quote;
      const { coupon: _coupon, ...publicQuote } = quote.data;
      return { ok: true, data: publicQuote };
    } catch (err) {
      return fail(asError(err));
    }
  });

const orderSchema = quoteInput.extend({
  idempotencyKey: z.string().uuid(),
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  mobile: z.string().trim().min(8, "Enter a valid Indian mobile number.").max(20),
  email: z.string().trim().max(120).default(""),
  notes: z.string().trim().max(400).default(""),
  address: z.object({
    house: z.string().trim().min(1, "Enter a house or flat number.").max(80),
    street: z.string().trim().min(3, "Enter the street or area.").max(160),
    city: z.string().trim().min(2, "Enter the city.").max(80),
    state: z.string().trim().min(2).max(80),
    pin: z.string().trim(),
    instructions: z.string().trim().max(300).default(""),
  }),
});

export const placeOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ token: string; number: string; reused: boolean }>> => {
    try {
      const parsed = orderSchema.safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the checkout form.");
      const input = parsed.data;
      rateLimit(await clientKey("order"), 8, 15 * 60 * 1000);
      const mobile = normalizeMobile(input.mobile);
      if (!mobile) return fail("Enter a valid 10-digit Indian mobile number.");
      if (!isValidPin(input.address.pin)) return fail("Enter a valid 6-digit PIN code.");
      if (!INDIA_STATES.includes(input.address.state as (typeof INDIA_STATES)[number])) {
        return fail("Choose a state or union territory.");
      }
      if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
        return fail("Enter a valid email or leave it blank.");
      }
      const sql = await getSql();
      const existing = await sql<{ access_token: string; number: string }>`
        select access_token, number from orders where idempotency_key = ${input.idempotencyKey}
      `;
      if (existing[0]) {
        return { ok: true, data: { token: existing[0].access_token, number: existing[0].number, reused: true } };
      }
      const quote = await buildQuote(sql, input);
      if (!quote.ok) return quote;
      if (quote.data.couponError) return fail(quote.data.couponError);
      const code = quote.data.couponCode;
      if (code) {
        const used = await sql<{ code: string }>`
          update coupons set usage_count = usage_count + 1
          where upper(code) = ${code} and active = true
            and (usage_limit is null or usage_count < usage_limit)
          returning code
        `;
        if (!used.length) return fail("That coupon is no longer available.");
      }
      const needed = new Map<string, number>();
      for (const line of quote.data.lines) needed.set(line.productId, (needed.get(line.productId) ?? 0) + line.qty);
      const taken: { id: string; qty: number }[] = [];
      for (const [id, qty] of [...needed.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const updated = await sql<{ id: string }>`
          update products set stock = stock - ${qty}, units_sold = units_sold + ${qty}, updated_at = now()
          where id = ${id} and stock >= ${qty} and published = true
          returning id
        `;
        if (!updated.length) {
          for (const prev of taken) {
            await sql`update products set stock = stock + ${prev.qty}, units_sold = greatest(0, units_sold - ${prev.qty}) where id = ${prev.id}`;
          }
          if (code) await sql`update coupons set usage_count = greatest(0, usage_count - 1) where upper(code) = ${code}`;
          return fail("A design just sold out. Refresh your bag and try again.");
        }
        taken.push({ id, qty });
      }
      const id = await newId();
      const token = await newId();
      const number = `GN-${(await newId()).slice(0, 6).toUpperCase()}`;
      const address = { ...input.address, pin: input.address.pin.trim() };
      try {
        await sql`
          insert into orders (
            id, number, access_token, idempotency_key, status, payment_status, customer_name, mobile, email,
            address_json, notes, subtotal_paise, discount_paise, shipping_paise, shipping_note, total_paise, coupon_code
          ) values (
            ${id}, ${number}, ${token}, ${input.idempotencyKey}, 'PENDING_CONFIRMATION', 'UNPAID',
            ${input.name}, ${mobile}, ${input.email}, ${JSON.stringify(address)}, ${input.notes},
            ${quote.data.subtotalPaise}, ${quote.data.discountPaise}, ${quote.data.shippingPaise},
            ${quote.data.shippingNote}, ${quote.data.totalPaise}, ${code}
          )
        `;
        for (const line of quote.data.lines) {
          await sql`
            insert into order_items (id, order_id, product_id, name, unit_paise, qty, shape, length, sizing, image_url)
            values (${await newId()}, ${id}, ${line.productId}, ${line.name}, ${line.unitPaise}, ${line.qty}, ${line.shape}, ${line.length}, ${line.sizing}, ${line.imageUrl})
          `;
        }
        for (const item of taken) {
          await sql`
            insert into inventory_log (id, product_id, delta, note)
            values (${await newId()}, ${item.id}, ${-item.qty}, ${`Order ${number}`})
          `;
        }
      } catch (err) {
        await sql`delete from orders where id = ${id}`;
        for (const prev of taken) {
          await sql`update products set stock = stock + ${prev.qty}, units_sold = greatest(0, units_sold - ${prev.qty}) where id = ${prev.id}`;
        }
        if (code) await sql`update coupons set usage_count = greatest(0, usage_count - 1) where upper(code) = ${code}`;
        const again = await sql<{ access_token: string; number: string }>`
          select access_token, number from orders where idempotency_key = ${input.idempotencyKey}
        `;
        if (again[0]) return { ok: true, data: { token: again[0].access_token, number: again[0].number, reused: true } };
        throw err;
      }
      return { ok: true, data: { token, number, reused: false } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const getOrder = createServerFn({ method: "GET" })
  .validator((input: { token?: string }) => ({ token: String(input?.token ?? "") }))
  .handler(async ({ data }) => {
    if (data.token.length < 16) return null;
    const sql = await getSql();
    return loadOrder(sql, data.token);
  });

const customSchema = z.object({
  name: z.string().trim().min(2).max(80),
  mobile: z.string().trim().min(8).max(20),
  email: z.string().trim().max(120).default(""),
  shape: z.string().trim().min(2).max(40),
  length: z.string().trim().min(2).max(40),
  colors: z.string().trim().min(2).max(120),
  designCategory: z.string().trim().min(2).max(60),
  occasion: z.string().trim().min(2).max(80),
  budget: z.string().trim().max(80).default(""),
  notes: z.string().trim().max(800).default(""),
  imageUrl: z.string().max(500000).default(""),
});

export const submitCustom = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ number: string; whatsappUrl: string }>> => {
    try {
      const parsed = customSchema.safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the custom request.");
      rateLimit(await clientKey("custom"), 6, 15 * 60 * 1000);
      const mobile = normalizeMobile(parsed.data.mobile);
      if (!mobile) return fail("Enter a valid 10-digit Indian mobile number.");
      if (parsed.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.data.email)) {
        return fail("Enter a valid email or leave it blank.");
      }
      const image = cleanImage(parsed.data.imageUrl);
      const sql = await getSql();
      const current = await settings(sql);
      const number = `CR-${(await newId()).slice(0, 6).toUpperCase()}`;
      await sql`
        insert into custom_requests (
          id, number, access_token, name, mobile, email, shape, length, colors, design_category, occasion, budget, notes, image_url
        ) values (
          ${await newId()}, ${number}, ${await newId()}, ${parsed.data.name}, ${mobile}, ${parsed.data.email},
          ${parsed.data.shape}, ${parsed.data.length}, ${parsed.data.colors}, ${parsed.data.designCategory},
          ${parsed.data.occasion}, ${parsed.data.budget}, ${parsed.data.notes}, ${image}
        )
      `;
      const message = buildCustomMessage({
        number,
        name: parsed.data.name,
        shape: parsed.data.shape,
        length: parsed.data.length,
        colors: parsed.data.colors,
        category: parsed.data.designCategory,
        occasion: parsed.data.occasion,
        budget: parsed.data.budget,
      });
      return { ok: true, data: { number, whatsappUrl: whatsappHref(current.whatsappNumber, message) } };
    } catch (err) {
      return fail(asError(err));
    }
  });

const appointmentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  mobile: z.string().trim().min(8).max(20),
  serviceName: z.string().trim().min(2).max(80),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  preferredTime: z.string().trim().min(2).max(40),
  notes: z.string().trim().max(500).default(""),
});

export const submitAppointment = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ number: string; whatsappUrl: string }>> => {
    try {
      const parsed = appointmentSchema.safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the enquiry.");
      rateLimit(await clientKey("appt"), 6, 15 * 60 * 1000);
      const mobile = normalizeMobile(parsed.data.mobile);
      if (!mobile) return fail("Enter a valid 10-digit Indian mobile number.");
      const today = new Date().toISOString().slice(0, 10);
      if (parsed.data.preferredDate < today) return fail("Choose today or a future date.");
      const sql = await getSql();
      const list = await services(sql, true);
      if (!list.some((service) => service.name === parsed.data.serviceName)) {
        return fail("Choose a service from the list.");
      }
      const current = await settings(sql);
      const number = `AP-${(await newId()).slice(0, 6).toUpperCase()}`;
      await sql`
        insert into appointments (
          id, number, access_token, name, mobile, service_name, preferred_date, preferred_time, notes, status
        ) values (
          ${await newId()}, ${number}, ${await newId()}, ${parsed.data.name}, ${mobile}, ${parsed.data.serviceName},
          ${parsed.data.preferredDate}, ${parsed.data.preferredTime}, ${parsed.data.notes}, 'PENDING'
        )
      `;
      const message = buildAppointmentMessage({
        number,
        name: parsed.data.name,
        service: parsed.data.serviceName,
        date: parsed.data.preferredDate,
        time: parsed.data.preferredTime,
      });
      return { ok: true, data: { number, whatsappUrl: whatsappHref(current.whatsappNumber, message) } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ whatsappUrl: string }>> => {
    try {
      const parsed = z
        .object({
          name: z.string().trim().min(2).max(80),
          mobile: z.string().trim().min(8).max(20),
          message: z.string().trim().min(5).max(800),
        })
        .safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the message.");
      rateLimit(await clientKey("enquiry"), 6, 15 * 60 * 1000);
      const mobile = normalizeMobile(parsed.data.mobile);
      if (!mobile) return fail("Enter a valid 10-digit Indian mobile number.");
      const sql = await getSql();
      const current = await settings(sql);
      await sql`
        insert into enquiries (id, name, mobile, message)
        values (${await newId()}, ${parsed.data.name}, ${mobile}, ${parsed.data.message})
      `;
      const message = `Hello Glam Nails by Yukti!\n${parsed.data.name} sent a note from the website.\n\n${parsed.data.message}`;
      return { ok: true, data: { whatsappUrl: whatsappHref(current.whatsappNumber, message) } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const subscribeNews = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ subscribed: true }>> => {
    try {
      const parsed = z
        .object({
          email: z.string().trim().email("Enter a valid email.").max(160),
          consent: z.literal(true, { error: "Please confirm you want occasional updates." }),
        })
        .safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the email.");
      const sql = await getSql();
      await sql`
        insert into newsletter_subscribers (email) values (${parsed.data.email.toLowerCase()})
        on conflict (email) do nothing
      `;
      return { ok: true, data: { subscribed: true } };
    } catch (err) {
      return fail(asError(err));
    }
  });

async function studioData(sql: Sql): Promise<StudioData> {
  const current = await settings(sql);
  const productRows = await sql.query<PRow>(`select ${PRODUCT_SQL} order by p.created_at desc`);
  const products: ProductDetail[] = [];
  for (const row of productRows) {
    const images = await sql<{ url: string; alt: string }>`
      select url, alt from product_images where product_id = ${row.id} order by sort_order, id
    `;
    products.push(detail(row, images));
  }
  const orderRows = await sql<{
    id: string;
    number: string;
    status: string;
    payment_status: string;
    customer_name: string;
    mobile: string;
    email: string;
    address_json: string;
    notes: string;
    internal_notes: string;
    subtotal_paise: number;
    discount_paise: number;
    shipping_paise: number;
    shipping_note: string;
    total_paise: number;
    coupon_code: string | null;
    created_at: string;
  }>`
    select id, number, status, payment_status, customer_name, mobile, email, address_json, notes, internal_notes,
      subtotal_paise, discount_paise, shipping_paise, shipping_note, total_paise, coupon_code, created_at::text as created_at
    from orders order by created_at desc limit 100
  `;
  const orders: OrderAdmin[] = [];
  for (const order of orderRows) {
    const items = await sql<{
      name: string;
      qty: number;
      unit_paise: number;
      shape: string;
      length: string;
      sizing: string;
    }>`
      select name, qty, unit_paise, shape, length, sizing from order_items where order_id = ${order.id}
    `;
    const note = (["flat", "free", "confirm"].includes(order.shipping_note)
      ? order.shipping_note
      : "confirm") as ShippingNote;
    orders.push({
      id: order.id,
      number: order.number,
      status: order.status,
      paymentStatus: order.payment_status,
      customerName: order.customer_name,
      mobile: order.mobile,
      email: order.email,
      address: parseAddress(order.address_json),
      notes: order.notes,
      internalNotes: order.internal_notes,
      subtotalPaise: num(order.subtotal_paise),
      discountPaise: num(order.discount_paise),
      shippingPaise: num(order.shipping_paise),
      shippingNote: note,
      totalPaise: num(order.total_paise),
      couponCode: order.coupon_code,
      createdAt: order.created_at,
      items: items.map((item) => ({
        name: item.name,
        qty: num(item.qty),
        unitPaise: num(item.unit_paise),
        shape: item.shape,
        length: item.length,
        sizing: item.sizing,
      })),
    });
  }
  const customRows = await sql<{
    id: string;
    number: string;
    name: string;
    mobile: string;
    email: string;
    shape: string;
    length: string;
    colors: string;
    design_category: string;
    occasion: string;
    budget: string;
    notes: string;
    image_url: string;
    status: string;
    internal_notes: string;
    created_at: string;
  }>`
    select id, number, name, mobile, email, shape, length, colors, design_category, occasion, budget, notes,
      image_url, status, internal_notes, created_at::text as created_at
    from custom_requests order by created_at desc limit 100
  `;
  const customRequests: CustomRequest[] = customRows.map((row) => ({
    id: row.id,
    number: row.number,
    name: row.name,
    mobile: row.mobile,
    email: row.email,
    shape: row.shape,
    length: row.length,
    colors: row.colors,
    designCategory: row.design_category,
    occasion: row.occasion,
    budget: row.budget,
    notes: row.notes,
    imageUrl: row.image_url,
    status: row.status,
    internalNotes: row.internal_notes,
    createdAt: row.created_at,
  }));
  const appointmentRows = await sql<{
    id: string;
    number: string;
    name: string;
    mobile: string;
    service_name: string;
    preferred_date: string;
    preferred_time: string;
    notes: string;
    status: string;
    internal_notes: string;
    created_at: string;
  }>`
    select id, number, name, mobile, service_name, preferred_date, preferred_time, notes, status, internal_notes,
      created_at::text as created_at
    from appointments order by created_at desc limit 100
  `;
  const appointments: Appointment[] = appointmentRows.map((row) => ({
    id: row.id,
    number: row.number,
    name: row.name,
    mobile: row.mobile,
    serviceName: row.service_name,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    notes: row.notes,
    status: row.status,
    internalNotes: row.internal_notes,
    createdAt: row.created_at,
  }));
  const enquiryRows = await sql<Enquiry & { created_at: string }>`
    select id, name, mobile, message, created_at::text as created_at from enquiries order by created_at desc limit 50
  `;
  const couponRows = await sql<{
    id: string;
    code: string;
    type: string;
    amount: number;
    min_subtotal_paise: number;
    expires_on: string | null;
    usage_limit: number | null;
    usage_count: number;
    active: boolean | string;
  }>`
    select id, code, type, amount, min_subtotal_paise, expires_on::text as expires_on, usage_limit, usage_count, active
    from coupons order by code
  `;
  const coupons: Coupon[] = couponRows.map((row) => ({
    id: row.id,
    code: row.code,
    type: row.type === "FIXED" ? "FIXED" : "PERCENT",
    amount: num(row.amount),
    minSubtotalPaise: num(row.min_subtotal_paise),
    expiresOn: row.expires_on,
    usageLimit: row.usage_limit == null ? null : num(row.usage_limit),
    usageCount: num(row.usage_count),
    active: bit(row.active),
  }));
  const quoteRows = await sql<{
    id: string;
    name: string;
    location: string;
    quote: string;
    rating: number | null;
    photo_url: string;
    approved: boolean | string;
    featured: boolean | string;
  }>`
    select id, name, location, quote, rating, photo_url, approved, featured
    from testimonials order by created_at desc
  `;
  const testimonials: Testimonial[] = quoteRows.map((row) => ({
    id: row.id,
    name: row.name,
    location: row.location,
    quote: row.quote,
    rating: row.rating == null ? null : num(row.rating),
    photoUrl: row.photo_url,
    approved: bit(row.approved),
    featured: bit(row.featured),
  }));
  const subs = await sql<{ email: string; created_at: string }>`
    select email, created_at::text as created_at from newsletter_subscribers order by created_at desc limit 100
  `;
  const low = await sql<{ id: string; name: string; stock: number }>`
    select id, name, stock from products where published = true and stock <= ${current.lowStock} order by stock asc, name limit 12
  `;
  const statRows = await sql<{
    orders: number;
    pending: number;
    confirmed: number;
    delivered: number;
    paid: number;
    pending_pay: number;
  }>`
    select
      count(*)::int as orders,
      count(*) filter (where status = 'PENDING_CONFIRMATION')::int as pending,
      count(*) filter (where status = 'CONFIRMED')::int as confirmed,
      count(*) filter (where status = 'DELIVERED')::int as delivered,
      coalesce(sum(total_paise) filter (where payment_status = 'PAID' and status <> 'CANCELLED'), 0)::int as paid,
      coalesce(sum(total_paise) filter (where payment_status in ('UNPAID', 'PAYMENT_REPORTED') and status <> 'CANCELLED'), 0)::int as pending_pay
    from orders
  `;
  const top = await sql<{ name: string; qty: number }>`
    select name, coalesce(sum(qty), 0)::int as qty from order_items group by name order by qty desc limit 5
  `;
  const stat = statRows[0];
  return {
    settings: current,
    categories: await categories(sql, false),
    products,
    orders,
    customRequests,
    appointments,
    enquiries: enquiryRows.map((row) => ({
      id: row.id,
      name: row.name,
      mobile: row.mobile,
      message: row.message,
      createdAt: row.created_at,
    })),
    coupons,
    gallery: await gallery(sql, false),
    testimonials,
    services: await services(sql, false),
    subscribers: subs.map((row) => ({ email: row.email, createdAt: row.created_at })),
    lowStock: low.map((row) => ({ id: row.id, name: row.name, stock: num(row.stock) })),
    stats: {
      orders: num(stat?.orders),
      pending: num(stat?.pending),
      confirmed: num(stat?.confirmed),
      delivered: num(stat?.delivered),
      paidRevenuePaise: num(stat?.paid),
      pendingPaymentPaise: num(stat?.pending_pay),
      topProducts: top.map((row) => ({ name: row.name, qty: num(row.qty) })),
    },
  };
}

export const studioBootstrap = createServerFn({ method: "GET" }).handler(async (): Promise<StudioBoot> => {
  const sql = await getSql();
  const auth = await sql<{ id: number }>`select id from studio_auth where id = 1`;
  const configured = auth.length > 0;
  const signedIn = configured && (await studioOpen(sql));
  return { configured, signedIn, data: signedIn ? await studioData(sql) : null };
});

const passwordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters.").max(72),
});

export const studioSetup = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ recoveryCode: string }>> => {
    try {
      const parsed = passwordSchema.safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Choose a password.");
      const sql = await getSql();
      const existing = await sql`select id from studio_auth where id = 1`;
      if (existing.length) return fail("The studio already has a password. Sign in instead.");
      const code = recoveryCode();
      await sql`
        insert into studio_auth (id, password_hash, recovery_hash)
        values (1, ${await hashSecret(parsed.data.password)}, ${await hashSecret(code)})
      `;
      const token = await newId();
      await sql`
        insert into studio_sessions (token_hash, expires_at)
        values (${await sha256(token)}, ${new Date(Date.now() + 14 * 86400000).toISOString()})
      `;
      await setStudioCookie(token);
      await audit(sql, "studio.setup", "Studio password created");
      return { ok: true, data: { recoveryCode: code } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioLogin = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ signedIn: true }>> => {
    try {
      rateLimit(await clientKey("login"), 8, 10 * 60 * 1000);
      const parsed = passwordSchema.safeParse(data);
      if (!parsed.success) return fail("Enter your studio password.");
      const sql = await getSql();
      const rows = await sql<{ password_hash: string }>`select password_hash from studio_auth where id = 1`;
      const row = rows[0];
      if (!row || !(await verifySecret(parsed.data.password, row.password_hash))) {
        return fail("That password is not right.");
      }
      const token = await newId();
      await sql`
        insert into studio_sessions (token_hash, expires_at)
        values (${await sha256(token)}, ${new Date(Date.now() + 14 * 86400000).toISOString()})
      `;
      await setStudioCookie(token);
      await audit(sql, "studio.login", "Studio sign-in");
      return { ok: true, data: { signedIn: true } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioRecover = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ recoveryCode: string }>> => {
    try {
      rateLimit(await clientKey("recover"), 5, 15 * 60 * 1000);
      const parsed = z
        .object({
          recoveryCode: z.string().trim().min(8).max(20),
          password: z.string().min(8).max(72),
        })
        .safeParse(data);
      if (!parsed.success) return fail("Enter the recovery code and a new password.");
      const sql = await getSql();
      const rows = await sql<{ recovery_hash: string }>`select recovery_hash from studio_auth where id = 1`;
      if (!rows[0] || !(await verifySecret(parsed.data.recoveryCode.toUpperCase(), rows[0].recovery_hash))) {
        return fail("That recovery code is not right.");
      }
      const code = recoveryCode();
      await sql`
        update studio_auth set password_hash = ${await hashSecret(parsed.data.password)}, recovery_hash = ${await hashSecret(code)}
        where id = 1
      `;
      await sql`delete from studio_sessions`;
      const token = await newId();
      await sql`
        insert into studio_sessions (token_hash, expires_at)
        values (${await sha256(token)}, ${new Date(Date.now() + 14 * 86400000).toISOString()})
      `;
      await setStudioCookie(token);
      await audit(sql, "studio.recover", "Password reset with recovery code");
      return { ok: true, data: { recoveryCode: code } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioLogout = createServerFn({ method: "POST" }).handler(async () => {
  const sql = await getSql();
  const { deleteCookie, getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(COOKIE);
  if (token) await sql`delete from studio_sessions where token_hash = ${await sha256(token)}`;
  deleteCookie(COOKIE, { path: "/" });
  return { ok: true as const };
});

const productSchema = z.object({
  id: z.string().max(80).nullable().default(null),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(2000),
  categoryId: z.string().max(80).nullable().default(null),
  priceRupees: z.number().min(0).max(500000),
  compareRupees: z.number().min(0).max(500000).nullable().default(null),
  stock: z.number().int().min(0).max(10000),
  featured: z.boolean(),
  bestSeller: z.boolean(),
  published: z.boolean(),
  isSample: z.boolean(),
  shapes: z.string().trim().min(2).max(200),
  lengths: z.string().trim().min(2).max(200),
  sizing: z.string().trim().min(2).max(200),
  images: z.array(z.object({ url: z.string().max(500000), alt: z.string().max(160) })).max(6),
});

export const studioSaveProduct = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ id: string }>> => {
    try {
      const parsed = productSchema.safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the product.");
      const sql = await getSql();
      await requireStudio(sql);
      const input = parsed.data;
      const images = input.images.map((image) => ({ url: cleanImage(image.url), alt: image.alt.trim() || input.name }));
      if (!images.some((image) => image.url)) return fail("Add a photo.");
      const price = Math.round(input.priceRupees * 100);
      const compare =
        input.compareRupees && Math.round(input.compareRupees * 100) > price
          ? Math.round(input.compareRupees * 100)
          : null;
      let id = input.id;
      if (id) {
        const found = await sql<{ stock: number }>`select stock from products where id = ${id}`;
        if (!found[0]) return fail("That design was not found.");
        const slug = await uniqueSlug(sql, slugify(input.name), id);
        await sql`
          update products set slug = ${slug}, name = ${input.name}, description = ${input.description},
            category_id = ${input.categoryId || null}, price_paise = ${price}, compare_paise = ${compare},
            stock = ${input.stock}, featured = ${input.featured}, best_seller = ${input.bestSeller},
            published = ${input.published}, is_sample = ${input.isSample}, shapes = ${input.shapes},
            lengths = ${input.lengths}, sizing = ${input.sizing}, updated_at = now()
          where id = ${id}
        `;
        const delta = input.stock - num(found[0].stock);
        if (delta !== 0) {
          await sql`insert into inventory_log (id, product_id, delta, note) values (${await newId()}, ${id}, ${delta}, 'Studio edit')`;
        }
      } else {
        id = await newId();
        const slug = await uniqueSlug(sql, slugify(input.name));
        await sql`
          insert into products (
            id, slug, name, description, category_id, price_paise, compare_paise, stock, featured, best_seller,
            published, is_sample, shapes, lengths, sizing
          ) values (
            ${id}, ${slug}, ${input.name}, ${input.description}, ${input.categoryId || null}, ${price}, ${compare},
            ${input.stock}, ${input.featured}, ${input.bestSeller}, ${input.published}, ${input.isSample},
            ${input.shapes}, ${input.lengths}, ${input.sizing}
          )
        `;
        await sql`insert into inventory_log (id, product_id, delta, note) values (${await newId()}, ${id}, ${input.stock}, 'Created')`;
      }
      await sql`delete from product_images where product_id = ${id}`;
      let sort = 0;
      for (const image of images.filter((item) => item.url)) {
        await sql`
          insert into product_images (id, product_id, url, alt, sort_order)
          values (${await newId()}, ${id}, ${image.url}, ${image.alt}, ${sort})
        `;
        sort += 1;
      }
      await audit(sql, "product.save", input.name);
      return { ok: true, data: { id } };
    } catch (err) {
      return fail(asError(err));
    }
  });

async function uniqueSlug(sql: Sql, base: string, ignoreId?: string) {
  let slug = base;
  for (let n = 2; n < 40; n += 1) {
    const rows = await sql<{ id: string }>`select id from products where slug = ${slug}`;
    if (!rows.length || rows[0]?.id === ignoreId) return slug;
    slug = `${base}-${n}`;
  }
  return `${base}-${await newId()}`.slice(0, 80);
}

export const studioDeleteProduct = createServerFn({ method: "POST" })
  .validator((input: { id?: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data }): Promise<Result<{ deleted: true }>> => {
    try {
      const sql = await getSql();
      await requireStudio(sql);
      await sql`delete from products where id = ${data.id}`;
      await audit(sql, "product.delete", data.id);
      return { ok: true, data: { deleted: true } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioSaveCategory = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ id: string }>> => {
    try {
      const parsed = z
        .object({
          id: z.string().max(80).nullable().default(null),
          name: z.string().trim().min(2).max(60),
          description: z.string().trim().max(240).default(""),
          imageUrl: z.string().max(500000).default(""),
          sortOrder: z.number().int().min(0).max(999).default(0),
          visible: z.boolean(),
        })
        .safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the category.");
      const sql = await getSql();
      await requireStudio(sql);
      const image = cleanImage(parsed.data.imageUrl);
      const slug = slugify(parsed.data.name);
      if (parsed.data.id) {
        await sql`
          update categories set name = ${parsed.data.name}, slug = ${slug}, description = ${parsed.data.description},
            image_url = ${image}, sort_order = ${parsed.data.sortOrder}, visible = ${parsed.data.visible}
          where id = ${parsed.data.id}
        `;
        return { ok: true, data: { id: parsed.data.id } };
      }
      const id = await newId();
      await sql`
        insert into categories (id, name, slug, description, image_url, sort_order, visible)
        values (${id}, ${parsed.data.name}, ${slug}, ${parsed.data.description}, ${image}, ${parsed.data.sortOrder}, ${parsed.data.visible})
      `;
      return { ok: true, data: { id } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioDeleteCategory = createServerFn({ method: "POST" })
  .validator((input: { id?: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data }): Promise<Result<{ deleted: true }>> => {
    try {
      const sql = await getSql();
      await requireStudio(sql);
      const used = await sql<{ n: number }>`select count(*)::int as n from products where category_id = ${data.id}`;
      if (num(used[0]?.n) > 0) return fail("Move designs out of this category before deleting it.");
      await sql`delete from categories where id = ${data.id}`;
      return { ok: true, data: { deleted: true } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioUpdateOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ saved: true }>> => {
    try {
      const parsed = z
        .object({
          id: z.string().min(4),
          status: z.enum(ORDER_STATUS),
          paymentStatus: z.enum(PAY_STATUS),
          internalNotes: z.string().max(800).default(""),
        })
        .safeParse(data);
      if (!parsed.success) return fail("Choose a valid status.");
      const sql = await getSql();
      await requireStudio(sql);
      const rows = await sql<{ status: string; stock_restored: boolean | string; number: string }>`
        select status, stock_restored, number from orders where id = ${parsed.data.id}
      `;
      const order = rows[0];
      if (!order) return fail("Order not found.");
      let restored = bit(order.stock_restored);
      if (parsed.data.status === "CANCELLED" && !restored) {
        const items = await sql<{ product_id: string | null; qty: number }>`
          select product_id, qty from order_items where order_id = ${parsed.data.id}
        `;
        for (const item of items) {
          if (!item.product_id) continue;
          await sql`update products set stock = stock + ${num(item.qty)} where id = ${item.product_id}`;
          await sql`
            insert into inventory_log (id, product_id, delta, note)
            values (${await newId()}, ${item.product_id}, ${num(item.qty)}, ${`Cancelled ${order.number}`})
          `;
        }
        restored = true;
      }
      await sql`
        update orders set status = ${parsed.data.status}, payment_status = ${parsed.data.paymentStatus},
          internal_notes = ${parsed.data.internalNotes}, stock_restored = ${restored}, updated_at = now()
        where id = ${parsed.data.id}
      `;
      await audit(sql, "order.update", `${order.number} ${parsed.data.status} ${parsed.data.paymentStatus}`);
      return { ok: true, data: { saved: true } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioSaveCoupon = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ id: string }>> => {
    try {
      const parsed = z
        .object({
          id: z.string().max(80).nullable().default(null),
          code: z.string().trim().min(3).max(24),
          type: z.enum(["PERCENT", "FIXED"]),
          amount: z.number().min(1),
          minRupees: z.number().min(0).default(0),
          expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
          usageLimit: z.number().int().min(1).nullable().default(null),
          active: z.boolean(),
        })
        .safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the coupon.");
      if (parsed.data.type === "PERCENT" && parsed.data.amount > 100) return fail("Percent discount cannot exceed 100.");
      const sql = await getSql();
      await requireStudio(sql);
      const code = parsed.data.code.toUpperCase();
      const amount = parsed.data.type === "PERCENT" ? Math.round(parsed.data.amount) : Math.round(parsed.data.amount * 100);
      const min = Math.round(parsed.data.minRupees * 100);
      if (parsed.data.id) {
        await sql`
          update coupons set code = ${code}, type = ${parsed.data.type}, amount = ${amount},
            min_subtotal_paise = ${min}, expires_on = ${parsed.data.expiresOn}, usage_limit = ${parsed.data.usageLimit},
            active = ${parsed.data.active}
          where id = ${parsed.data.id}
        `;
        return { ok: true, data: { id: parsed.data.id } };
      }
      const id = await newId();
      await sql`
        insert into coupons (id, code, type, amount, min_subtotal_paise, expires_on, usage_limit, active)
        values (${id}, ${code}, ${parsed.data.type}, ${amount}, ${min}, ${parsed.data.expiresOn}, ${parsed.data.usageLimit}, ${parsed.data.active})
      `;
      return { ok: true, data: { id } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioDeleteCoupon = createServerFn({ method: "POST" })
  .validator((input: { id?: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data }): Promise<Result<{ deleted: true }>> => {
    try {
      const sql = await getSql();
      await requireStudio(sql);
      await sql`delete from coupons where id = ${data.id}`;
      return { ok: true, data: { deleted: true } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioSaveGallery = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ id: string }>> => {
    try {
      const parsed = z
        .object({
          id: z.string().max(80).nullable().default(null),
          category: z.string().trim().min(2).max(40),
          url: z.string().min(4).max(500000),
          alt: z.string().trim().min(2).max(160),
          caption: z.string().trim().max(160).default(""),
          sortOrder: z.number().int().min(0).max(999).default(0),
          visible: z.boolean(),
        })
        .safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the image.");
      const sql = await getSql();
      await requireStudio(sql);
      const url = cleanImage(parsed.data.url);
      if (!url) return fail("Add a photo.");
      if (parsed.data.id) {
        await sql`
          update gallery_images set category = ${parsed.data.category}, url = ${url}, alt = ${parsed.data.alt},
            caption = ${parsed.data.caption}, sort_order = ${parsed.data.sortOrder}, visible = ${parsed.data.visible}
          where id = ${parsed.data.id}
        `;
        return { ok: true, data: { id: parsed.data.id } };
      }
      const id = await newId();
      await sql`
        insert into gallery_images (id, category, url, alt, caption, sort_order, visible)
        values (${id}, ${parsed.data.category}, ${url}, ${parsed.data.alt}, ${parsed.data.caption}, ${parsed.data.sortOrder}, ${parsed.data.visible})
      `;
      return { ok: true, data: { id } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioDeleteGallery = createServerFn({ method: "POST" })
  .validator((input: { id?: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data }): Promise<Result<{ deleted: true }>> => {
    try {
      const sql = await getSql();
      await requireStudio(sql);
      await sql`delete from gallery_images where id = ${data.id}`;
      return { ok: true, data: { deleted: true } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioSaveTestimonial = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ id: string }>> => {
    try {
      const parsed = z
        .object({
          id: z.string().max(80).nullable().default(null),
          name: z.string().trim().min(2).max(80),
          location: z.string().trim().max(80).default(""),
          quote: z.string().trim().min(8).max(600),
          rating: z.number().int().min(1).max(5).nullable().default(null),
          photoUrl: z.string().max(500000).default(""),
          approved: z.boolean(),
          featured: z.boolean(),
        })
        .safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the review.");
      const sql = await getSql();
      await requireStudio(sql);
      const photo = cleanImage(parsed.data.photoUrl);
      if (parsed.data.id) {
        await sql`
          update testimonials set name = ${parsed.data.name}, location = ${parsed.data.location}, quote = ${parsed.data.quote},
            rating = ${parsed.data.rating}, photo_url = ${photo}, approved = ${parsed.data.approved}, featured = ${parsed.data.featured}
          where id = ${parsed.data.id}
        `;
        return { ok: true, data: { id: parsed.data.id } };
      }
      const id = await newId();
      await sql`
        insert into testimonials (id, name, location, quote, rating, photo_url, approved, featured)
        values (${id}, ${parsed.data.name}, ${parsed.data.location}, ${parsed.data.quote}, ${parsed.data.rating}, ${photo}, ${parsed.data.approved}, ${parsed.data.featured})
      `;
      return { ok: true, data: { id } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioDeleteTestimonial = createServerFn({ method: "POST" })
  .validator((input: { id?: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data }): Promise<Result<{ deleted: true }>> => {
    try {
      const sql = await getSql();
      await requireStudio(sql);
      await sql`delete from testimonials where id = ${data.id}`;
      return { ok: true, data: { deleted: true } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioSaveService = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ id: string }>> => {
    try {
      const parsed = z
        .object({
          id: z.string().max(80).nullable().default(null),
          name: z.string().trim().min(2).max(80),
          description: z.string().trim().min(8).max(800),
          imageUrl: z.string().max(500000).default(""),
          startingRupees: z.number().min(0).nullable().default(null),
          durationMinutes: z.number().int().min(0).nullable().default(null),
          sortOrder: z.number().int().min(0).max(999).default(0),
          visible: z.boolean(),
        })
        .safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the service.");
      const sql = await getSql();
      await requireStudio(sql);
      const image = cleanImage(parsed.data.imageUrl);
      const starting = parsed.data.startingRupees == null ? null : Math.round(parsed.data.startingRupees * 100);
      if (parsed.data.id) {
        await sql`
          update services set name = ${parsed.data.name}, description = ${parsed.data.description}, image_url = ${image},
            starting_paise = ${starting}, duration_minutes = ${parsed.data.durationMinutes},
            sort_order = ${parsed.data.sortOrder}, visible = ${parsed.data.visible}
          where id = ${parsed.data.id}
        `;
        return { ok: true, data: { id: parsed.data.id } };
      }
      const id = await newId();
      await sql`
        insert into services (id, name, description, image_url, starting_paise, duration_minutes, sort_order, visible)
        values (${id}, ${parsed.data.name}, ${parsed.data.description}, ${image}, ${starting}, ${parsed.data.durationMinutes}, ${parsed.data.sortOrder}, ${parsed.data.visible})
      `;
      return { ok: true, data: { id } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioDeleteService = createServerFn({ method: "POST" })
  .validator((input: { id?: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data }): Promise<Result<{ deleted: true }>> => {
    try {
      const sql = await getSql();
      await requireStudio(sql);
      await sql`delete from services where id = ${data.id}`;
      return { ok: true, data: { deleted: true } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioUpdateCustom = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ saved: true }>> => {
    try {
      const parsed = z
        .object({
          id: z.string().min(4),
          status: z.enum(["NEW", "IN_REVIEW", "QUOTED", "ACCEPTED", "CLOSED"]),
          internalNotes: z.string().max(800).default(""),
        })
        .safeParse(data);
      if (!parsed.success) return fail("Check the request.");
      const sql = await getSql();
      await requireStudio(sql);
      await sql`
        update custom_requests set status = ${parsed.data.status}, internal_notes = ${parsed.data.internalNotes}
        where id = ${parsed.data.id}
      `;
      return { ok: true, data: { saved: true } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioUpdateAppointment = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ saved: true }>> => {
    try {
      const parsed = z
        .object({
          id: z.string().min(4),
          status: z.enum(["PENDING", "APPROVED", "DECLINED", "COMPLETED"]),
          internalNotes: z.string().max(800).default(""),
        })
        .safeParse(data);
      if (!parsed.success) return fail("Check the enquiry.");
      const sql = await getSql();
      await requireStudio(sql);
      await sql`
        update appointments set status = ${parsed.data.status}, internal_notes = ${parsed.data.internalNotes}
        where id = ${parsed.data.id}
      `;
      return { ok: true, data: { saved: true } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const studioSaveSettings = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<Result<{ saved: true }>> => {
    try {
      const sql = await getSql();
      await requireStudio(sql);
      const parsed = z
        .object({
          brandName: z.string().trim().min(2).max(80),
          announcement: z.string().trim().max(180),
          showSampleNotice: z.boolean(),
          heroHeading: z.string().trim().min(2).max(120),
          heroText: z.string().trim().max(400),
          heroImage: z.string().max(500000),
          aboutTitle: z.string().trim().max(120),
          aboutBody: z.string().trim().max(4000),
          whatsappNumber: z.string().trim().min(10).max(16),
          whatsappDisplay: z.string().trim().max(24),
          instagramUrl: z.string().trim().url().max(200),
          instagramHandle: z.string().trim().max(40),
          location: z.string().trim().max(120),
          salonAddress: z.string().trim().max(200),
          shippingMode: z.enum(["flat", "confirm"]),
          shippingRupees: z.number().min(0).max(10000),
          freeShippingRupees: z.number().min(0).nullable(),
          upiId: z.string().trim().max(80),
          paymentInstructions: z.string().trim().max(800),
          paymentAccount: z.string().trim().max(240),
          policyShipping: z.string().trim().max(2000),
          policyPrivacy: z.string().trim().max(2000),
          policyTerms: z.string().trim().max(2000),
          policyReturns: z.string().trim().max(2000),
          lowStock: z.number().int().min(0).max(100),
          faqs: z.array(z.object({ q: z.string().trim().min(2).max(160), a: z.string().trim().min(2).max(600) })).max(12),
        })
        .safeParse(data);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the settings.");
      const input = parsed.data;
      const hero = cleanImage(input.heroImage);
      const pairs: [string, string][] = [
        ["brand_name", input.brandName],
        ["announcement", input.announcement],
        ["show_sample_notice", input.showSampleNotice ? "true" : "false"],
        ["hero_heading", input.heroHeading],
        ["hero_text", input.heroText],
        ["hero_image", hero || DEFAULTS.hero_image],
        ["about_title", input.aboutTitle],
        ["about_body", input.aboutBody],
        ["whatsapp_number", input.whatsappNumber.replace(/\D/g, "")],
        ["whatsapp_display", input.whatsappDisplay],
        ["instagram_url", input.instagramUrl],
        ["instagram_handle", input.instagramHandle],
        ["location", input.location],
        ["salon_address", input.salonAddress],
        ["shipping_mode", input.shippingMode],
        ["shipping_paise", String(Math.round(input.shippingRupees * 100))],
        ["free_shipping_paise", input.freeShippingRupees ? String(Math.round(input.freeShippingRupees * 100)) : ""],
        ["upi_id", input.upiId],
        ["payment_instructions", input.paymentInstructions],
        ["payment_account", input.paymentAccount],
        ["policy_shipping", input.policyShipping],
        ["policy_privacy", input.policyPrivacy],
        ["policy_terms", input.policyTerms],
        ["policy_returns", input.policyReturns],
        ["low_stock", String(input.lowStock)],
        ["faqs", JSON.stringify(input.faqs)],
      ];
      for (const [key, value] of pairs) {
        await sql`
          insert into settings (key, value) values (${key}, ${value})
          on conflict (key) do update set value = excluded.value
        `;
      }
      await audit(sql, "settings.save", "Website settings updated");
      return { ok: true, data: { saved: true } };
    } catch (err) {
      return fail(asError(err));
    }
  });

export const publishedSlugs = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<{ slug: string }>`select slug from products where published = true order by slug`;
});
