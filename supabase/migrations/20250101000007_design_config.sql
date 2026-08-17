-- add design_config JSONB column to store_settings
alter table public.store_settings add column design_config jsonb not null default '{}'::jsonb;
