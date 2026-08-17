-- =============================================================
-- StoreHub — Migration 006: Marketing Features
-- =============================================================

-- 1. Create coupons table
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores on delete cascade not null,
  code text not null,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric(12, 2) not null check (value > 0),
  min_order_amount numeric(12, 2) default 0,
  max_uses integer,
  used_count integer not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, code)
);

alter table public.coupons enable row level security;

create policy "Store members can manage coupons"
  on public.coupons for all
  to authenticated
  using (is_store_member(store_id))
  with check (is_store_member(store_id));

create policy "Public can read active coupons"
  on public.coupons for select
  to public
  using (
    is_active = true 
    and (valid_from is null or valid_from <= now())
    and (valid_until is null or valid_until >= now())
    and (max_uses is null or used_count < max_uses)
  );

-- 2. Add announcement fields to store_settings
alter table public.store_settings 
  add column announcement_text text,
  add column announcement_link text,
  add column announcement_active boolean not null default false;

-- 3. Replace create_order to accept and validate p_coupon_code securely
drop function if exists public.create_order(uuid, text, text, text, jsonb, text, text, numeric, numeric, jsonb);

create or replace function public.create_order(
  p_store_id uuid,
  p_customer_name text,
  p_customer_email text default null,
  p_customer_phone text default null,
  p_shipping_address jsonb default null,
  p_notes text default null,
  p_shipping_method_name text default null,
  p_shipping_cost numeric default 0,
  p_coupon_code text default null,
  p_items jsonb default null
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
  v_discount   numeric := 0;
  v_total      numeric := 0;
  v_currency   text;
  v_order_number text;
  v_coupon     record;
begin
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

  -- Insert order initially with 0 totals
  insert into public.orders (
    store_id, customer_id, order_number, status, payment_status,
    subtotal, shipping_cost, discount, total, currency, shipping_address, notes
  ) values (
    p_store_id, v_customer_id, v_order_number, 'pending', 'unpaid',
    0, coalesce(p_shipping_cost, 0), 0, 0,
    v_currency, p_shipping_address, p_notes
  )
  returning * into v_order;

  -- Insert items and calculate subtotal
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

  -- Process coupon if provided
  if p_coupon_code is not null and p_coupon_code <> '' then
    select * into v_coupon 
    from public.coupons 
    where store_id = p_store_id 
      and lower(code) = lower(p_coupon_code) 
      and is_active = true
      and (valid_from is null or valid_from <= now())
      and (valid_until is null or valid_until >= now())
      and (max_uses is null or used_count < max_uses)
    for update; -- Lock the row

    if not found then
      raise exception 'Invalid or expired coupon code.';
    end if;

    if v_coupon.min_order_amount > 0 and v_subtotal < v_coupon.min_order_amount then
      raise exception 'Order subtotal does not meet the minimum requirement for this coupon.';
    end if;

    if v_coupon.type = 'percentage' then
      v_discount := v_subtotal * (v_coupon.value / 100);
    else
      v_discount := v_coupon.value;
    end if;

    if v_discount > v_subtotal then
      v_discount := v_subtotal;
    end if;

    -- Increment coupon usage
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
  end if;

  v_total := v_subtotal + coalesce(p_shipping_cost, 0) - v_discount;

  update public.orders
  set subtotal = v_subtotal, discount = v_discount, total = v_total
  where id = v_order.id
  returning * into v_order;

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

-- 4. RPC to validate coupon (for frontend preview)
create or replace function public.validate_coupon(
  p_store_id uuid,
  p_code text,
  p_cart_subtotal numeric
) returns numeric as $$
declare
  v_coupon record;
  v_discount numeric := 0;
begin
  select * into v_coupon 
  from public.coupons 
  where store_id = p_store_id 
    and lower(code) = lower(p_code) 
    and is_active = true
    and (valid_from is null or valid_from <= now())
    and (valid_until is null or valid_until >= now())
    and (max_uses is null or used_count < max_uses);

  if not found then
    raise exception 'Invalid or expired coupon code.';
  end if;

  if v_coupon.min_order_amount > 0 and p_cart_subtotal < v_coupon.min_order_amount then
    raise exception 'Order subtotal does not meet the minimum requirement for this coupon.';
  end if;

  if v_coupon.type = 'percentage' then
    v_discount := p_cart_subtotal * (v_coupon.value / 100);
  else
    v_discount := v_coupon.value;
  end if;

  if v_discount > p_cart_subtotal then
    v_discount := p_cart_subtotal;
  end if;

  return v_discount;
end;
$$ language plpgsql security definer;
