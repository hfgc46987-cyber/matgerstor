-- =============================================================
-- StoreCraft — Migration 005: Seed data
-- Default subscription plans. Extensible for Stripe later.
-- =============================================================

insert into public.plans (name, slug, price, currency, billing_interval, features, is_active)
values
  ('Free',    'free',        0.00,  'USD', 'month', '["1 store", "Unlimited products", "Unlimited orders", "Storefront", "Basic analytics"]', true),
  ('Basic',   'basic',       19.00, 'USD', 'month', '["1 store", "Unlimited products", "Unlimited orders", "Custom domain", "Advanced analytics", "Priority support"]', true),
  ('Pro',     'pro',         49.00, 'USD', 'month', '["3 stores", "Unlimited products", "Unlimited orders", "Custom domain", "Advanced analytics", "API access", "Priority support"]', true),
  ('Enterprise', 'enterprise', 199.00, 'USD', 'month', '["Unlimited stores", "Unlimited products", "Unlimited orders", "Custom domains", "Advanced analytics", "API access", "Dedicated support", "SLA"]', true)
on conflict (slug) do update
set name = excluded.name,
    price = excluded.price,
    features = excluded.features,
    is_active = excluded.is_active;
