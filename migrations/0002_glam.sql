-- Glam Nails by Yukti. Sample designs are marked is_sample and are not live listings.

create table if not exists categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text not null default '',
  sort_order integer not null default 0,
  visible boolean not null default true
);

create table if not exists products (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  category_id text references categories (id) on delete set null,
  price_paise integer not null,
  compare_paise integer,
  stock integer not null default 0,
  featured boolean not null default false,
  best_seller boolean not null default false,
  published boolean not null default true,
  is_sample boolean not null default false,
  shapes text not null default '',
  lengths text not null default '',
  sizing text not null default '',
  units_sold integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_images (
  id text primary key,
  product_id text not null references products (id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0
);

create table if not exists services (
  id text primary key,
  name text not null,
  description text not null default '',
  image_url text not null default '',
  starting_paise integer,
  duration_minutes integer,
  sort_order integer not null default 0,
  visible boolean not null default true
);

create table if not exists gallery_images (
  id text primary key,
  category text not null default 'Custom',
  url text not null,
  alt text not null default '',
  caption text not null default '',
  sort_order integer not null default 0,
  visible boolean not null default true
);

create table if not exists testimonials (
  id text primary key,
  name text not null,
  location text not null default '',
  quote text not null,
  rating integer,
  photo_url text not null default '',
  approved boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists coupons (
  id text primary key,
  code text not null unique,
  type text not null,
  amount integer not null,
  min_subtotal_paise integer not null default 0,
  expires_on date,
  usage_limit integer,
  usage_count integer not null default 0,
  active boolean not null default true
);

create table if not exists orders (
  id text primary key,
  number text not null unique,
  access_token text not null unique,
  idempotency_key text not null unique,
  status text not null,
  payment_status text not null,
  customer_name text not null,
  mobile text not null,
  email text not null default '',
  address_json text not null,
  notes text not null default '',
  internal_notes text not null default '',
  subtotal_paise integer not null,
  discount_paise integer not null,
  shipping_paise integer not null,
  shipping_note text not null,
  total_paise integer not null,
  coupon_code text,
  stock_restored boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id text primary key,
  order_id text not null references orders (id) on delete cascade,
  product_id text,
  name text not null,
  unit_paise integer not null,
  qty integer not null,
  shape text not null default '',
  length text not null default '',
  sizing text not null default '',
  image_url text not null default ''
);

create table if not exists custom_requests (
  id text primary key,
  number text not null unique,
  access_token text not null unique,
  name text not null,
  mobile text not null,
  email text not null default '',
  shape text not null default '',
  length text not null default '',
  colors text not null default '',
  design_category text not null default '',
  occasion text not null default '',
  budget text not null default '',
  notes text not null default '',
  image_url text not null default '',
  status text not null default 'NEW',
  internal_notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id text primary key,
  number text not null unique,
  access_token text not null unique,
  name text not null,
  mobile text not null,
  service_name text not null,
  preferred_date text not null,
  preferred_time text not null,
  notes text not null default '',
  status text not null default 'PENDING',
  internal_notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists enquiries (
  id text primary key,
  name text not null,
  mobile text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value text not null
);

create table if not exists studio_auth (
  id integer primary key check (id = 1),
  password_hash text not null,
  recovery_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists studio_sessions (
  token_hash text primary key,
  expires_at timestamptz not null
);

create table if not exists inventory_log (
  id text primary key,
  product_id text not null,
  delta integer not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id text primary key,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on products (category_id);
create index if not exists orders_created_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);

insert into categories (id, name, slug, description, image_url, sort_order) values
('c_bridal', 'Bridal Nails', 'bridal', 'Occasion sets for weddings and ceremonies.', '/images/bridal.jpg', 1),
('c_french', 'French Tips', 'french', 'Quiet French tips with a soft smile line.', '/images/french.jpg', 2),
('c_floral', 'Floral Nails', 'floral', 'Hand-painted flowers and small botanicals.', '/images/floral.jpg', 3),
('c_minimal', 'Minimal Nails', 'minimal', 'Short, clean, everyday colour.', '/images/minimal.jpg', 4),
('c_party', 'Party Wear', 'party', 'Deeper colour and a metallic accent.', '/images/glam.jpg', 5),
('c_custom', 'Custom Nails', 'custom', 'A design made from your reference.', '/images/packaging.jpg', 6),
('c_seasonal', 'Seasonal Collections', 'seasonal', 'Festive colour for the season.', '/images/festive.jpg', 7)
on conflict (id) do nothing;

insert into products (
  id, slug, name, description, category_id, price_paise, compare_paise, stock,
  featured, best_seller, published, is_sample, shapes, lengths, sizing
) values
(
  'p_blush', 'blush-pearl', 'Blush Pearl',
  'Studio sample. Illustrative price, not a confirmed listing. A blush almond set with a pearl and a touch of gold foil.',
  'c_bridal', 125000, 149000, 8, true, true, true, true,
  'Almond,Oval,Square,Coffin', 'Short,Medium,Long', 'Standard set,Custom sizing,Ask the artist'
),
(
  'p_french', 'ivory-french', 'Ivory French',
  'Studio sample. Illustrative price, not a confirmed listing. Classic French tips on a warm ivory base.',
  'c_french', 89900, null, 10, true, false, true, true,
  'Almond,Oval,Square,Coffin', 'Short,Medium,Long', 'Standard set,Custom sizing,Ask the artist'
),
(
  'p_floral', 'garden-rose', 'Garden Rose',
  'Studio sample. Illustrative price, not a confirmed listing. Blush roses and small leaves on a glossy nude.',
  'c_floral', 145000, null, 6, true, true, true, true,
  'Almond,Oval,Square,Coffin', 'Short,Medium,Long', 'Standard set,Custom sizing,Ask the artist'
),
(
  'p_minimal', 'soft-nude', 'Soft Nude',
  'Studio sample. Illustrative price, not a confirmed listing. A short glossy nude for everyday wear.',
  'c_minimal', 75000, null, 12, false, false, true, true,
  'Almond,Oval,Square,Coffin', 'Short,Medium,Long', 'Standard set,Custom sizing,Ask the artist'
),
(
  'p_glam', 'rose-chrome', 'Rose Chrome',
  'Studio sample. Illustrative price, not a confirmed listing. Dusty rose coffin nails with one chrome accent.',
  'c_party', 165000, 189000, 5, true, true, true, true,
  'Almond,Oval,Square,Coffin', 'Short,Medium,Long', 'Standard set,Custom sizing,Ask the artist'
),
(
  'p_festive', 'maroon-gold', 'Maroon Gold',
  'Studio sample. Illustrative price, not a confirmed listing. Deep maroon with antique gold detail.',
  'c_seasonal', 135000, null, 6, false, false, true, true,
  'Almond,Oval,Square,Coffin', 'Short,Medium,Long', 'Standard set,Custom sizing,Ask the artist'
)
on conflict (id) do nothing;

insert into product_images (id, product_id, url, alt, sort_order) values
('i_blush', 'p_blush', '/images/bridal.jpg', 'Blush bridal press-on nails with pearls', 0),
('i_french', 'p_french', '/images/french.jpg', 'Ivory French tip press-on nails', 0),
('i_floral', 'p_floral', '/images/floral.jpg', 'Floral blush press-on nails', 0),
('i_minimal', 'p_minimal', '/images/minimal.jpg', 'Minimal nude press-on nails', 0),
('i_glam', 'p_glam', '/images/glam.jpg', 'Dusty rose chrome press-on nails', 0),
('i_festive', 'p_festive', '/images/festive.jpg', 'Maroon and gold festive nails', 0)
on conflict (id) do nothing;

insert into services (id, name, description, image_url, sort_order) values
('s_art', 'Nail Art', 'Painted nail art at the studio in Bhusawal. Duration and price are confirmed when you enquire.', '/images/process.jpg', 1),
('s_bridal', 'Bridal Nail Art', 'Occasion nails for weddings and ceremonies. Share your date when you enquire. A time is not held until Yukti confirms it.', '/images/bridal.jpg', 2),
('s_custom', 'Custom Nail Designs', 'A one-off design planned with you, in the studio or as a press-on set.', '/images/packaging.jpg', 3)
on conflict (id) do nothing;

insert into gallery_images (id, category, url, alt, caption, sort_order) values
('g1', 'Bridal', '/images/bridal.jpg', 'Bridal pearl press-on set', 'Sample — bridal pearls', 1),
('g2', 'French', '/images/french.jpg', 'French tip press-on set', 'Sample — French tips', 2),
('g3', 'Floral', '/images/floral.jpg', 'Hand-painted rose nails', 'Sample — garden roses', 3),
('g4', 'Minimal', '/images/minimal.jpg', 'Short nude nails', 'Sample — soft nude', 4),
('g5', 'Party Wear', '/images/glam.jpg', 'Rose chrome nails', 'Sample — rose chrome', 5),
('g6', 'Custom Designs', '/images/festive.jpg', 'Maroon and gold nails', 'Sample — maroon gold', 6),
('g7', 'Custom Designs', '/images/packaging.jpg', 'Press-on packaging', 'Sample — packaging', 7),
('g8', 'Minimal', '/images/hero.jpg', 'Blush almond nails on silk', 'Sample — blush silk', 8),
('g9', 'Custom Designs', '/images/process.jpg', 'A nail being painted', 'Sample — at the desk', 9),
('g10', 'Bridal', '/images/salon.jpg', 'Quiet nail studio interior', 'Sample — studio', 10)
on conflict (id) do nothing;

insert into settings (key, value) values
('brand_name', 'Glam Nails by Yukti'),
('announcement', 'Handcrafted press-on nails from Bhusawal, delivered across India.'),
('hero_heading', 'Elegance at Your Fingertips.'),
('hero_text', 'Handcrafted press-on nails from Bhusawal, shaped for everyday wear, celebrations and bridal days, with delivery across India.'),
('hero_image', '/images/hero.jpg'),
('about_title', 'The artist behind the brand'),
('about_body', $$Yukti is the nail artist behind Glam Nails by Yukti, based in Bhusawal, Maharashtra.

She makes handcrafted press-on nails and occasion nail art, and takes salon appointment enquiries. Sets are delivered across India.

This introduction is a starting point. Rewrite it in the studio in your own words. Qualifications, awards and years of experience are left blank until you add them.$$),
('whatsapp_number', '918766067782'),
('whatsapp_display', '+91 87660 67782'),
('instagram_url', 'https://www.instagram.com/glam_nails_by_yukti/'),
('instagram_handle', '@glam_nails_by_yukti'),
('location', 'Bhusawal, Maharashtra, India'),
('salon_address', ''),
('shipping_mode', 'confirm'),
('shipping_paise', '0'),
('free_shipping_paise', ''),
('upi_id', ''),
('payment_instructions', 'Online payment is not collected on this website. After you place an order, open WhatsApp and send the summary yourself. The order stays unpaid until Yukti confirms payment. Add a UPI ID in Studio, under Settings, when you are ready.'),
('payment_account', ''),
('policy_shipping', 'This note has not been published yet. Add your own delivery wording in Studio, under Settings, before you rely on it. Delivery coverage in this starter setup is India only. No delivery timeline is promised here.'),
('policy_privacy', 'This note has not been published yet. Add your own privacy wording in Studio, under Settings. Orders store the name, mobile number and address needed to fulfil a request. They are visible to the studio, and to the customer who holds the private order link.'),
('policy_terms', 'This note has not been published yet. Add your own terms in Studio, under Settings. Nothing on this website is a confirmed booking or a paid order until Yukti says so on WhatsApp.'),
('policy_returns', 'This note has not been published yet. Add your own returns wording in Studio, under Settings. No return window is promised here.'),
('low_stock', '3'),
('faqs', $$[{"q":"How do I place an order?","a":"Add a set to your bag and check out. The site saves the order, then asks you to send the summary on WhatsApp yourself. Orders stay unpaid until Yukti confirms payment."},{"q":"Where do you deliver?","a":"Across India. If a flat delivery charge is set, it appears at checkout. Otherwise Yukti confirms the charge on WhatsApp."},{"q":"Can I ask for a custom design?","a":"Yes. Use Custom Nails to share shape, colours, occasion and a reference image. Yukti replies with availability and a price."},{"q":"Does a salon enquiry reserve a time?","a":"No. The form is an enquiry only. A time is not held until Yukti confirms it."}]$$)
on conflict (key) do nothing;
