-- =============================================================
-- StoreCraft — Multi-Tenant E-Commerce Platform
-- Migration 001: Core schema (tables, indexes, constraints)
-- Run order matters: this file creates all base tables.
-- RLS policies live in 002. Functions/triggers in 003.
-- Storage in 004. Seed data in 005.
-- =============================================================

-- Extensions ---------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- profiles -----------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- stores -------------------------------------------------------
create table public.stores (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  logo_url    text,
  currency    text not null default 'USD',
  country     text,
  phone       text,
  email       text,
  address     text,
  status      text not null default 'active' check (status in ('active', 'suspended')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index stores_owner_id_idx on public.stores (owner_id);
create index stores_slug_idx on public.stores (slug);

-- store_members ------------------------------------------------
create table public.store_members (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'staff'
             check (role in ('owner', 'admin', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create index store_members_user_id_idx on public.store_members (user_id);

-- categories ---------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores (id) on delete cascade,
  name        text not null,
  slug        text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  image_url   text,
  parent_id   uuid references public.categories (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (store_id, slug)
);

create index categories_store_id_idx on public.categories (store_id);
create index categories_parent_id_idx on public.categories (parent_id);

-- products -----------------------------------------------------
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references public.stores (id) on delete cascade,
  category_id     uuid references public.categories (id) on delete set null,
  name            text not null,
  slug            text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description     text,
  price           numeric(12, 2) not null default 0 check (price >= 0),
  compare_price   numeric(12, 2) check (compare_price >= 0),
  cost_price      numeric(12, 2) check (cost_price >= 0),
  sku             text,
  barcode         text,
  stock_quantity  integer not null default 0 check (stock_quantity >= 0),
  track_inventory boolean not null default true,
  status          text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  featured        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (store_id, slug)
);

create index products_store_id_idx on public.products (store_id);
create index products_category_id_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create index products_featured_idx on public.products (store_id, featured);
create index products_search_idx on public.products
  using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(sku, '') || ' ' || coalesce(barcode, '')));

-- product_images ----------------------------------------------
create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  store_id   uuid not null references public.stores (id) on delete cascade,
  url        text not null,
  position   integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);
create index product_images_store_id_idx on public.product_images (store_id);

-- customers ----------------------------------------------------
create table public.customers (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  name         text not null,
  email        text,
  phone        text,
  total_orders integer not null default 0,
  total_spent  numeric(12, 2) not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index customers_store_id_idx on public.customers (store_id);

-- Allow at most one non-null email per store.
create unique index customers_store_email_unique_idx
  on public.customers (store_id, lower(email))
  where email is not null;

-- orders -------------------------------------------------------
create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores (id) on delete cascade,
  customer_id      uuid references public.customers (id) on delete set null,
  order_number     text not null,
  status           text not null default 'pending'
                   check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status   text not null default 'unpaid'
                   check (payment_status in ('unpaid', 'paid', 'refunded')),
  subtotal         numeric(12, 2) not null default 0,
  shipping_cost    numeric(12, 2) not null default 0,
  discount         numeric(12, 2) not null default 0,
  total            numeric(12, 2) not null default 0,
  currency         text not null default 'USD',
  shipping_address jsonb,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (store_id, order_number)
);

create index orders_store_id_idx on public.orders (store_id);
create index orders_customer_id_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

-- order_items (snapshot of product name/price at order time) ---
create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,
  quantity     integer not null default 1 check (quantity > 0),
  price        numeric(12, 2) not null,
  total        numeric(12, 2) not null,
  created_at   timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);

-- shipping_methods ---------------------------------------------
create table public.shipping_methods (
  id                      uuid primary key default gen_random_uuid(),
  store_id                uuid not null references public.stores (id) on delete cascade,
  name                    text not null,
  price                   numeric(12, 2) not null default 0 check (price >= 0),
  free_shipping_threshold numeric(12, 2) check (free_shipping_threshold >= 0),
  is_active               boolean not null default true,
  created_at              timestamptz not null default now()
);

create index shipping_methods_store_id_idx on public.shipping_methods (store_id);

-- store_settings (customization + shipping + payment) ----------
create table public.store_settings (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null unique references public.stores (id) on delete cascade,
  primary_color      text not null default '#4f46e5',
  secondary_color    text not null default '#111827',
  font               text not null default 'Inter',
  favicon_url        text,
  banner_url         text,
  footer_text        text,
  social_links       jsonb not null default '{}'::jsonb,
  homepage_sections  jsonb not null default '{"show_featured": true, "show_categories": true, "show_banner": true, "banner_heading": "", "banner_subheading": ""}'::jsonb,
  free_shipping      boolean not null default false,
  free_shipping_min  numeric(12, 2) default null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- notifications ------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  type       text not null default 'info',
  title      text not null,
  message    text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_store_id_idx on public.notifications (store_id, read);

-- platform admin roles -----------------------------------------
create table public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  role       text not null default 'user' check (role in ('user', 'platform_admin')),
  created_at timestamptz not null default now()
);

-- plans & subscriptions ----------------------------------------
create table public.plans (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,
  slug             text not null unique,
  price            numeric(12, 2) not null default 0 check (price >= 0),
  currency         text not null default 'USD',
  billing_interval text not null default 'month' check (billing_interval in ('month', 'year')),
  features         jsonb not null default '[]'::jsonb,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  store_id             uuid not null references public.stores (id) on delete cascade,
  plan_id              uuid not null references public.plans (id),
  status               text not null default 'trialing'
                       check (status in ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  current_period_start timestamptz not null default now(),
  current_period_end   timestamptz,
  payment_provider     text,
  payment_provider_id  text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index subscriptions_store_id_idx on public.subscriptions (store_id);

-- updated_at trigger helper (function + trigger per table) -----
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.stores
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
