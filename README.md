# StoreCraft — Multi-Tenant E-Commerce SaaS Platform

StoreCraft is a production-ready, multi-tenant e-commerce platform. Anyone can sign up, create
their own online store, and manage it completely from a separate dashboard. Every store is
logically isolated — users can never access another store's data.

**Frontend:** React 19 · TypeScript · Tailwind CSS 4 · Vite · React Query · Recharts
**Backend:** Supabase (Auth, PostgreSQL, Storage, Row Level Security)

---

## Getting started

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. From **Settings → API** copy the **Project URL** and the **anon public** key.
3. Configure Authentication → URL Configuration so email redirects work (see `supabase/config.toml` for local values):
   - Site URL: your frontend URL (e.g. `http://localhost:5173`)
   - Redirect URLs: `http://localhost:5173/verify-email`, `http://localhost:5173/reset-password`

### 2. Apply the database migrations

All tables, RLS policies, triggers, functions and storage buckets are in `supabase/migrations/`.
Apply them in order (`20250101000001` → `…00005`):

```bash
# Option A — with the Supabase CLI linked to your project
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# Option B — open the SQL Editor in the Dashboard and paste each file's contents in order
```

### 3. Grant your first platform admin

Platform admin access is role-based and RLS-protected. After signing up, promote yourself by
running this in the SQL Editor (replace the UUID with your `auth.users.id`):

```sql
insert into public.user_roles (user_id, role)
values ('YOUR-USER-UUID', 'platform_admin')
on conflict (user_id) do update set role = excluded.role;
```

### 4. Configure the frontend

```bash
cp .env.example .env
```

Then edit `.env`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

### 5. Run

```bash
npm install
npm run dev        # http://localhost:5173
```

---

## What's included

| Area | Details |
|---|---|
| **Authentication** | Sign up, sign in, logout, forgot/reset password, email verification (Supabase Auth) |
| **Onboarding** | Create a store: name, link (slug), description, logo, currency, country |
| **Multi-tenancy** | `stores`, `store_members`, `profiles` — strict RLS on every table |
| **Dashboard** | Overview (stats + charts), Orders, Products, Categories, Customers, Inventory, Analytics, Customization, Settings |
| **Products** | CRUD, multiple image upload, primary image, price/compare/cost, SKU, barcode, stock, featured, draft/active/archived |
| **Orders** | Full lifecycle (pending → … → refunded), payment status, snapshot of item name & price |
| **Customers** | Auto-created per store from orders, total orders & lifetime spend |
| **Analytics** | Sales/orders charts with Today, 7d, 30d, 12 months ranges |
| **Storefront** | Public `/store/{slug}` — header, search, categories, product grid/details, cart, checkout |
| **Customization** | Logo, favicon, primary/secondary colors, font, banner, homepage sections, footer, social links + live preview |
| **Settings** | Store info, shipping methods, free-shipping threshold, payment-provider placeholder (Stripe-ready) |
| **Admin Panel** | `/admin` — all users, all stores, suspend/activate stores, plans & subscriptions, platform stats |
| **Subscriptions** | `plans` + `subscriptions` seeded with Free/Basic/Pro/Enterprise — payment gateways plug in later |

---

## Architecture

### Database (PostgreSQL)

```text
profiles            ── owns ──▶ stores        ──┬──▶ products ──▶ product_images
store_members (join)             ├──▶ categories ──▶ (children via parent_id)
                                 ├──▶ customers ──▶ orders ──▶ order_items
                                 ├──▶ orders ───────┘
                                 ├──▶ store_settings
                                 ├──▶ shipping_methods
                                 └──▶ notifications
plans ── subscriptions ──▶ stores
user_roles                     (platform admins)
```

### Row Level Security

Every sensitive table has RLS enabled. Access is driven by helper functions:

- `is_store_member(store_id)` — any member (owner/admin/manager/staff)
- `is_store_owner(store_id)` / `is_store_admin(store_id)`
- `is_platform_admin()`

Public storefront read access is scoped to `status = 'active'` stores only. Write access always
requires store membership. Platform admin aggregate data is exposed only through
`security definer` RPCs (`get_platform_stats`, `get_platform_stores`, `get_platform_users`).

### Storage

- `store-assets` — logos, banners, favicons → `stores/{store_id}/branding/*`
- `product-images` — product photos → `stores/{store_id}/products/{product_id}/*`

Both are public for **read** (storefront needs them), but **write/delete** policies verify that the
caller is a member of the store encoded in the object path, so no store can touch another's files.

### Key security guarantees

- Only the **anon key** ships to the frontend. The service-role key is never included.
- No table is protected by UI hiding alone — RLS governs every `select/insert/update/delete`.
- Order creation happens through the `create_order` RPC, which atomically creates the order,
  snapshots item name/price, updates stock, and updates customer totals.

---

## Project structure

```text
supabase/migrations/          # 001 schema · 002 RLS · 003 functions/triggers/RPCs · 004 storage · 005 seed
src/
  components/ui/              # Button, Input, Modal, Table, Toast, Badge, Dropdown, Charts, …
  lib/                        # supabase client, types, utils, auth/store contexts, api + query hooks
  features/
    auth/                     # login, signup, forgot/reset password, verify email
    onboarding/               # store creation
    dashboard/                # merchant dashboard (layout, sidebar, pages)
    storefront/               # public store (home, product, category, cart, checkout)
    admin/                    # platform admin panel
    landing/                  # marketing homepage
    connect/                  # "connect Supabase" helper screen
```

---

## Extending the platform

The architecture is designed to grow:

- **Payments** — add a provider by inserting rows into `subscriptions` / `orders.payment_status`
  and adding provider webhooks; `payment_provider` fields already exist.
- **Custom domains** — map `stores.slug` to a domain and add a `store_domains` table.
- **Coupons / discounts** — the `orders.discount` column and `discounts` table are the hooks.
- **Reviews** — new `reviews` table scoped to `store_id` with the same RLS pattern.
- **Mobile apps** — every query already runs through the Supabase API with RLS enforced.

## Scripts

```bash
npm run dev          # start Vite dev server
npm run build        # typecheck + production build
npm run typecheck    # TypeScript check only
```

## Security notes

- Never commit `.env` (it's gitignored).
- Never expose `service_role` keys anywhere in the frontend.
- Store suspension (`stores.status = 'suspended'`) automatically hides the storefront because
  public policies require `status = 'active'`.
