import type { ShippingNote } from "./pricing";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export type Shell = {
  brandName: string;
  announcement: string;
  showSampleNotice: boolean;
  whatsappNumber: string;
  whatsappDisplay: string;
  instagramUrl: string;
  instagramHandle: string;
  location: string;
  salonAddress: string;
  generalWhatsappUrl: string;
};

export type Settings = Shell & {
  heroHeading: string;
  heroText: string;
  heroImage: string;
  aboutTitle: string;
  aboutBody: string;
  shippingMode: "flat" | "confirm";
  shippingPaise: number;
  freeShippingPaise: number | null;
  upiId: string;
  paymentInstructions: string;
  paymentAccount: string;
  policyShipping: string;
  policyPrivacy: string;
  policyTerms: string;
  policyReturns: string;
  lowStock: number;
  faqs: { q: string; a: string }[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  visible: boolean;
};

export type ProductImage = { url: string; alt: string };

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  pricePaise: number;
  comparePaise: number | null;
  stock: number;
  featured: boolean;
  bestSeller: boolean;
  published: boolean;
  isSample: boolean;
  categoryId: string | null;
  categoryName: string;
  categorySlug: string;
  imageUrl: string;
  imageAlt: string;
};

export type ProductDetail = ProductCard & {
  description: string;
  shapes: string[];
  lengths: string[];
  sizing: string[];
  images: ProductImage[];
};

export type Service = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  startingPaise: number | null;
  durationMinutes: number | null;
  sortOrder: number;
  visible: boolean;
};

export type GalleryImage = {
  id: string;
  category: string;
  url: string;
  alt: string;
  caption: string;
  sortOrder: number;
  visible: boolean;
};

export type Testimonial = {
  id: string;
  name: string;
  location: string;
  quote: string;
  rating: number | null;
  photoUrl: string;
  approved: boolean;
  featured: boolean;
};

export type Address = {
  house: string;
  street: string;
  city: string;
  state: string;
  pin: string;
  instructions: string;
};

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  unitPaise: number;
  qty: number;
  shape: string;
  length: string;
  sizing: string;
  isSample: boolean;
};

export type QuoteLine = {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string;
  unitPaise: number;
  qty: number;
  shape: string;
  length: string;
  sizing: string;
  linePaise: number;
};

export type PublicQuote = {
  lines: QuoteLine[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  shippingNote: ShippingNote;
  totalPaise: number;
  couponCode: string | null;
  couponError: string | null;
};

export type PublicOrder = {
  number: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  mobile: string;
  email: string;
  address: Address;
  notes: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  shippingNote: ShippingNote;
  totalPaise: number;
  items: QuoteLine[];
  summary: string;
  whatsappUrl: string;
  paymentInstructions: string;
  upiId: string;
  createdAt: string;
};

export type HomeData = {
  settings: Settings;
  categories: Category[];
  products: ProductCard[];
  services: Service[];
  gallery: GalleryImage[];
  testimonials: Testimonial[];
};

export type ShopData = {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  categories: Category[];
};

export type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  amount: number;
  minSubtotalPaise: number;
  expiresOn: string | null;
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
};

export type OrderAdmin = {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  mobile: string;
  email: string;
  address: Address;
  notes: string;
  internalNotes: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  shippingNote: ShippingNote;
  totalPaise: number;
  couponCode: string | null;
  createdAt: string;
  items: { name: string; qty: number; unitPaise: number; shape: string; length: string; sizing: string }[];
};

export type CustomRequest = {
  id: string;
  number: string;
  name: string;
  mobile: string;
  email: string;
  shape: string;
  length: string;
  colors: string;
  designCategory: string;
  occasion: string;
  budget: string;
  notes: string;
  imageUrl: string;
  status: string;
  internalNotes: string;
  createdAt: string;
};

export type Appointment = {
  id: string;
  number: string;
  name: string;
  mobile: string;
  serviceName: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: string;
  internalNotes: string;
  createdAt: string;
};

export type Enquiry = {
  id: string;
  name: string;
  mobile: string;
  message: string;
  createdAt: string;
};

export type StudioData = {
  settings: Settings;
  categories: Category[];
  products: ProductDetail[];
  orders: OrderAdmin[];
  customRequests: CustomRequest[];
  appointments: Appointment[];
  enquiries: Enquiry[];
  coupons: Coupon[];
  gallery: GalleryImage[];
  testimonials: Testimonial[];
  services: Service[];
  subscribers: { email: string; createdAt: string }[];
  lowStock: { id: string; name: string; stock: number }[];
  stats: {
    orders: number;
    pending: number;
    confirmed: number;
    delivered: number;
    paidRevenuePaise: number;
    pendingPaymentPaise: number;
    topProducts: { name: string; qty: number }[];
  };
};

export type StudioBoot = {
  configured: boolean;
  signedIn: boolean;
  data: StudioData | null;
};
