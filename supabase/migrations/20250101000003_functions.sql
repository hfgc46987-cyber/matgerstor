-- =============================================================
-- StoreCraft — Migration 003: Functions, triggers, RPCs
-- =============================================================

-- Unique index: one subscription per store ---------------------
create unique index if not exists subscriptions_store_id_unique_idx
  on public.subscriptions (store_id);

-- Order number sequence ----------------------------------------
create sequence if not exists public.order_number_seq;

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  v_num text;
begin
  v_num := nextval('public.order_number_seq')::text;
  return 'ORD-' || to_char(now(), 'YYMMDD') || '-' || lpad(v_num, 4, '0');
end;
$$;

-- Auto-create profile on signup --------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profile email in sync -----------------------------------
create or replace function public.handle_user_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email,
      full_name = coalesce(new.raw_user_meta_data ->> 'full_name', profiles.full_name)
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_user_update();

-- Auto-bootstrap store: owner membership, settings, sub, notif -
create or replace function public.handle_new_store()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.store_members (store_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (store_id, user_id) do nothing;

  insert into public.store_settings (store_id)
  values (new.id)
  on conflict (store_id) do nothing;

  insert into public.notifications (store_id, type, title, message)
  values (new.id, 'store', 'Store created', 'Welcome to StoreCraft! Your store "' || new.name || '" is ready to be configured.')
  on conflict do nothing;

  insert into public.subscriptions (store_id, plan_id, status, current_period_start, current_period_end)
  select new.id, id, 'active', now(), now() + interval '1 month'
  from public.plans
  where slug = 'free' and is_active
  on conflict (store_id) do nothing;

  return new;
end;
$$;

create trigger on_store_created
  after insert on public.stores
  for each row execute function public.handle_new_store();

-- RPC: create a store (returns the new store row) ---------------
create or replace function public.create_store(
  p_name text,
  p_slug text,
  p_description text default null,
  p_logo_url text default null,
  p_currency text default 'USD',
  p_country text default null
)
returns public.stores
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store public.stores%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.stores (owner_id, name, slug, description, logo_url, currency, country)
  values (auth.uid(), p_name, p_slug, p_description, p_logo_url, p_currency, p_country)
  returning * into v_store;

  return v_store;
end;
$$;

-- Protect the last owner of a store ----------------------------
create or replace function public.prevent_last_owner_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' and old.role = 'owner' then
    if not exists (
      select 1 from public.store_members
      where store_id = old.store_id and role = 'owner' and id <> old.id
    ) and not public.is_platform_admin() then
      raise exception 'Cannot remove the last owner of the store';
    end if;
  end if;

  if tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner' then
    if not exists (
      select 1 from public.store_members
      where store_id = old.store_id and role = 'owner' and id <> old.id
    ) and not public.is_platform_admin() then
      raise exception 'Cannot demote the last owner of the store';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger on_member_change
  before update or delete on public.store_members
  for each row execute function public.prevent_last_owner_removal();

-- RPC: create order (atomic: order + items + stock + customer) --
create or replace function public.create_order(
  p_store_id uuid,
  p_customer_name text,
  p_customer_email text default null,
  p_customer_phone text default null,
  p_shipping_address jsonb default null,
  p_notes text default null,
  p_shipping_method_name text default null,
  p_shipping_cost numeric default 0,
  p_discount numeric default 0,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order      public.orders%rowtype;
  v_item       jsonb;
  v_product    public.products%rowtype;
  v_customer_id uuid;
  v_subtotal   numeric := 0;
  v_total      numeric := 0;
  v_currency   text;
  v_order_number text;
begin
  -- Allow guest (anonymous) checkout, but block authenticated users from
  -- placing orders into stores they do not belong to.
  if auth.uid() is not null and not public.is_store_member(p_store_id) then
    raise exception 'Not authorized for this store';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  select currency into v_currency from public.stores where id = p_store_id;
  if v_currency is null then
    raise exception 'Store not found';
  end if;

  -- Upsert customer
  if p_customer_email is not null then
    select id into v_customer_id
    from public.customers
    where store_id = p_store_id and lower(email) = lower(p_customer_email)
    limit 1;
  end if;

  if v_customer_id is null then
    insert into public.customers (store_id, name, email, phone)
    values (p_store_id, p_customer_name, nullif(p_customer_email, ''), nullif(p_customer_phone, ''))
    returning id into v_customer_id;
  else
    update public.customers
    set name = coalesce(nullif(p_customer_name, ''), name),
        phone = coalesce(nullif(p_customer_phone, ''), phone),
        updated_at = now()
    where id = v_customer_id;
  end if;

  v_order_number := public.generate_order_number();

  insert into public.orders (
    store_id, customer_id, order_number, status, payment_status,
    subtotal, shipping_cost, discount, total, currency, shipping_address, notes
  ) values (
    p_store_id, v_customer_id, v_order_number, 'pending', 'unpaid',
    0, coalesce(p_shipping_cost, 0), coalesce(p_discount, 0), 0,
    v_currency, p_shipping_address, p_notes
  )
  returning * into v_order;

  -- Insert items, validate stock, snapshot price/name, decrement stock
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid and store_id = p_store_id;

    if v_product.id is null then
      raise exception 'Product not found in this store';
    end if;

    if v_product.status <> 'active' then
      raise exception 'Product "%" is not available', v_product.name;
    end if;

    if v_product.track_inventory and v_product.stock_quantity < (v_item ->> 'quantity')::int then
      raise exception 'Insufficient stock for product "%"', v_product.name;
    end if;

    insert into public.order_items (order_id, product_id, product_name, quantity, price, total)
    values (
      v_order.id,
      v_product.id,
      v_product.name,
      (v_item ->> 'quantity')::int,
      v_product.price,
      v_product.price * (v_item ->> 'quantity')::int
    );

    v_subtotal := v_subtotal + v_product.price * (v_item ->> 'quantity')::int;

    if v_product.track_inventory then
      update public.products
      set stock_quantity = stock_quantity - (v_item ->> 'quantity')::int
      where id = v_product.id;
    end if;
  end loop;

  v_total := v_subtotal + coalesce(p_shipping_cost, 0) - coalesce(p_discount, 0);

  update public.orders
  set subtotal = v_subtotal, total = v_total
  where id = v_order.id;

  update public.customers
  set total_orders = total_orders + 1,
      total_spent = total_spent + v_total,
      updated_at = now()
  where id = v_customer_id;

  insert into public.notifications (store_id, type, title, message)
  values (p_store_id, 'order', 'New order received', 'Order ' || v_order_number || ' was placed by ' || p_customer_name || '.');

  return v_order;
end;
$$;

-- Convenience helper for storefront product listing -------------
create or replace function public.get_store_products(p_slug text)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  price numeric,
  compare_price numeric,
  stock_quantity integer,
  featured boolean,
  category_id uuid,
  category_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.name, p.slug, p.description, p.price, p.compare_price,
    p.stock_quantity, p.featured, p.category_id, c.name, p.created_at
  from public.products p
  left join public.categories c on c.id = p.category_id
  join public.stores s on s.id = p.store_id and s.slug = p_slug and s.status = 'active'
  where p.status = 'active'
  order by p.created_at desc;
$$;

-- =============================================================
-- Platform admin RPCs (security definer; callable only by
-- platform admins). Keeps aggregate access off the public API.
-- =============================================================

create or replace function public.require_platform_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Access denied: platform admin required';
  end if;
end;
$$;

create or replace function public.get_platform_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  perform public.require_platform_admin();
  select jsonb_build_object(
    'total_users',    (select count(*) from auth.users),
    'total_stores',   (select count(*) from public.stores),
    'active_stores',  (select count(*) from public.stores where status = 'active'),
    'suspended_stores', (select count(*) from public.stores where status = 'suspended'),
    'total_products', (select count(*) from public.products),
    'total_orders',   (select count(*) from public.orders),
    'total_revenue',  (select coalesce(sum(total), 0) from public.orders where status not in ('cancelled', 'refunded')),
    'new_users_30d',  (select count(*) from auth.users where created_at >= now() - interval '30 days'),
    'new_stores_30d', (select count(*) from public.stores where created_at >= now() - interval '30 days'),
    'month_revenue',  (select coalesce(sum(total), 0) from public.orders where status not in ('cancelled', 'refunded') and created_at >= date_trunc('month', now()))
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.get_platform_stores()
returns table (
  id uuid,
  name text,
  slug text,
  status text,
  currency text,
  created_at timestamptz,
  owner_name text,
  owner_email text,
  product_count bigint,
  order_count bigint,
  customer_count bigint,
  revenue numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_platform_admin();
  return query
    select
      s.id, s.name, s.slug, s.status, s.currency, s.created_at,
      p.full_name as owner_name,
      p.email as owner_email,
      (select count(*) from public.products pr where pr.store_id = s.id) as product_count,
      (select count(*) from public.orders o where o.store_id = s.id) as order_count,
      (select count(*) from public.customers c where c.store_id = s.id) as customer_count,
      (select coalesce(sum(o.total), 0) from public.orders o where o.store_id = s.id and o.status not in ('cancelled', 'refunded')) as revenue
    from public.stores s
    left join public.profiles p on p.id = s.owner_id
    order by s.created_at desc;
end;
$$;

create or replace function public.get_platform_users()
returns table (
  id uuid,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz,
  role text,
  store_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_platform_admin();
  return query
    select
      u.id,
      p.full_name,
      u.email,
      p.avatar_url,
      u.created_at,
      coalesce(ur.role, 'user') as role,
      (select count(*) from public.stores s where s.owner_id = u.id) as store_count
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.user_roles ur on ur.user_id = u.id
    order by u.created_at desc;
end;
$$;

create or replace function public.set_user_platform_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_platform_admin();
  if p_role not in ('user', 'platform_admin') then
    raise exception 'Invalid role';
  end if;
  if p_role = 'user' then
    delete from public.user_roles where user_id = p_user_id;
  else
    insert into public.user_roles (user_id, role) values (p_user_id, p_role)
    on conflict (user_id) do update set role = excluded.role;
  end if;
end;
$$;

create or replace function public.set_store_status(p_store_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_platform_admin();
  if p_status not in ('active', 'suspended') then
    raise exception 'Invalid status';
  end if;
  update public.stores set status = p_status where id = p_store_id;
end;
$$;
