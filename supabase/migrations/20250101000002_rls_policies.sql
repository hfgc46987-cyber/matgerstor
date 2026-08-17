-- =============================================================
-- StoreCraft — Migration 002: Row Level Security
-- Strict multi-tenant isolation. Every table is RLS protected.
-- Anonymous (public storefront) read access is scoped to
-- active stores only. Write access requires store membership.
-- =============================================================

-- Helper functions (security definer => bypass RLS on store_members
-- avoids recursive policy evaluation) --------------------------

create or replace function public.is_store_member(check_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_members
    where store_id = check_store_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_store_owner(check_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_members
    where store_id = check_store_id and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.is_store_admin(check_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_members
    where store_id = check_store_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'platform_admin'
  );
$$;

create or replace function public.is_active_store(check_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.stores
    where id = check_store_id and status = 'active'
  );
$$;

-- Enable RLS on all tables -------------------------------------
alter table public.profiles         enable row level security;
alter table public.stores           enable row level security;
alter table public.store_members    enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.customers        enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.store_settings   enable row level security;
alter table public.notifications    enable row level security;
alter table public.user_roles       enable row level security;
alter table public.plans            enable row level security;
alter table public.subscriptions    enable row level security;

-- =============================================================
-- profiles
-- =============================================================
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_platform_admin" on public.profiles
  for select using (public.is_platform_admin());

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- =============================================================
-- stores
-- =============================================================
create policy "stores_select_member_or_public_active" on public.stores
  for select using (
    public.is_store_member(id)
    or auth.uid() = owner_id
    or public.is_platform_admin()
    or status = 'active'
  );

create policy "stores_insert_owned" on public.stores
  for insert with check (owner_id = auth.uid());

create policy "stores_update_owner_or_admin" on public.stores
  for update using (
    public.is_store_owner(id)
    or public.is_platform_admin()
  );

create policy "stores_delete_owner_or_admin" on public.stores
  for delete using (
    public.is_store_owner(id)
    or public.is_platform_admin()
  );

-- =============================================================
-- store_members
-- =============================================================
create policy "members_select_member" on public.store_members
  for select using (public.is_store_member(store_id));

create policy "members_insert_admin" on public.store_members
  for insert with check (
    public.is_store_admin(store_id)
    and role in ('admin', 'manager', 'staff')
  );

create policy "members_update_admin_not_owner" on public.store_members
  for update using (
    public.is_store_admin(store_id)
    and not (role = 'owner')
  );

create policy "members_delete_admin_not_owner" on public.store_members
  for delete using (
    (public.is_store_admin(store_id) and not (role = 'owner'))
    or public.is_platform_admin()
  );

-- =============================================================
-- categories
-- =============================================================
create policy "categories_select_member_or_public" on public.categories
  for select using (
    public.is_store_member(store_id)
    or public.is_active_store(store_id)
  );

create policy "categories_insert_member" on public.categories
  for insert with check (public.is_store_member(store_id));

create policy "categories_update_member" on public.categories
  for update using (public.is_store_member(store_id));

create policy "categories_delete_member" on public.categories
  for delete using (public.is_store_member(store_id));

-- =============================================================
-- products
-- =============================================================
create policy "products_select_member_or_public" on public.products
  for select using (
    public.is_store_member(store_id)
    or (status = 'active' and public.is_active_store(store_id))
  );

create policy "products_insert_member" on public.products
  for insert with check (public.is_store_member(store_id));

create policy "products_update_member" on public.products
  for update using (public.is_store_member(store_id));

create policy "products_delete_member" on public.products
  for delete using (public.is_store_member(store_id));

-- =============================================================
-- product_images
-- =============================================================
create policy "product_images_select_member_or_public" on public.product_images
  for select using (
    public.is_store_member(store_id)
    or public.is_active_store(store_id)
  );

create policy "product_images_insert_member" on public.product_images
  for insert with check (public.is_store_member(store_id));

create policy "product_images_update_member" on public.product_images
  for update using (public.is_store_member(store_id));

create policy "product_images_delete_member" on public.product_images
  for delete using (public.is_store_member(store_id));

-- =============================================================
-- customers
-- =============================================================
create policy "customers_select_member" on public.customers
  for select using (public.is_store_member(store_id));

create policy "customers_insert_member" on public.customers
  for insert with check (public.is_store_member(store_id));

create policy "customers_update_member" on public.customers
  for update using (public.is_store_member(store_id));

create policy "customers_delete_member" on public.customers
  for delete using (public.is_store_member(store_id));

-- =============================================================
-- orders
-- =============================================================
create policy "orders_select_member" on public.orders
  for select using (public.is_store_member(store_id));

create policy "orders_insert_member" on public.orders
  for insert with check (public.is_store_member(store_id));

create policy "orders_update_member" on public.orders
  for update using (public.is_store_member(store_id));

create policy "orders_delete_member" on public.orders
  for delete using (public.is_store_member(store_id));

-- =============================================================
-- order_items
-- =============================================================
create policy "order_items_select_member" on public.order_items
  for select using (exists (
    select 1 from public.orders o
    where o.id = order_id and public.is_store_member(o.store_id)
  ));

create policy "order_items_insert_member" on public.order_items
  for insert with check (exists (
    select 1 from public.orders o
    where o.id = order_id and public.is_store_member(o.store_id)
  ));

create policy "order_items_update_member" on public.order_items
  for update using (exists (
    select 1 from public.orders o
    where o.id = order_id and public.is_store_member(o.store_id)
  ));

create policy "order_items_delete_member" on public.order_items
  for delete using (exists (
    select 1 from public.orders o
    where o.id = order_id and public.is_store_member(o.store_id)
  ));

-- =============================================================
-- shipping_methods
-- =============================================================
create policy "shipping_methods_select_member_or_public" on public.shipping_methods
  for select using (
    public.is_store_member(store_id)
    or public.is_active_store(store_id)
  );

create policy "shipping_methods_insert_member" on public.shipping_methods
  for insert with check (public.is_store_member(store_id));

create policy "shipping_methods_update_member" on public.shipping_methods
  for update using (public.is_store_member(store_id));

create policy "shipping_methods_delete_member" on public.shipping_methods
  for delete using (public.is_store_member(store_id));

-- =============================================================
-- store_settings
-- =============================================================
create policy "settings_select_member_or_public" on public.store_settings
  for select using (
    public.is_store_member(store_id)
    or public.is_active_store(store_id)
  );

create policy "settings_update_admin" on public.store_settings
  for update using (public.is_store_admin(store_id));

create policy "settings_insert_admin" on public.store_settings
  for insert with check (public.is_store_admin(store_id));

create policy "settings_delete_admin" on public.store_settings
  for delete using (public.is_store_admin(store_id));

-- =============================================================
-- notifications
-- =============================================================
create policy "notifications_select_member" on public.notifications
  for select using (public.is_store_member(store_id));

create policy "notifications_update_member" on public.notifications
  for update using (public.is_store_member(store_id));

create policy "notifications_delete_admin" on public.notifications
  for delete using (public.is_store_admin(store_id));

-- =============================================================
-- user_roles (platform admin only)
-- =============================================================
create policy "user_roles_select_self_or_admin" on public.user_roles
  for select using (auth.uid() = user_id or public.is_platform_admin());

create policy "user_roles_insert_admin" on public.user_roles
  for insert with check (public.is_platform_admin());

create policy "user_roles_update_admin" on public.user_roles
  for update using (public.is_platform_admin());

create policy "user_roles_delete_admin" on public.user_roles
  for delete using (public.is_platform_admin());

-- =============================================================
-- plans
-- =============================================================
create policy "plans_select_authenticated" on public.plans
  for select using (auth.role() = 'authenticated');

create policy "plans_insert_admin" on public.plans
  for insert with check (public.is_platform_admin());

create policy "plans_update_admin" on public.plans
  for update using (public.is_platform_admin());

create policy "plans_delete_admin" on public.plans
  for delete using (public.is_platform_admin());

-- =============================================================
-- subscriptions
-- =============================================================
create policy "subscriptions_select_member" on public.subscriptions
  for select using (public.is_store_member(store_id));

create policy "subscriptions_select_platform_admin" on public.subscriptions
  for select using (public.is_platform_admin());

create policy "subscriptions_insert_admin" on public.subscriptions
  for insert with check (public.is_store_admin(store_id));

create policy "subscriptions_update_admin" on public.subscriptions
  for update using (public.is_store_admin(store_id));

create policy "subscriptions_delete_admin" on public.subscriptions
  for delete using (public.is_store_admin(store_id));
