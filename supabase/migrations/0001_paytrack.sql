-- PayTrack: esquema inicial para encargados de edificios.
-- Ejecutar en Supabase > SQL Editor.

create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  address text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  label text not null,
  resident_name text,
  created_at timestamptz not null default now(),
  constraint units_building_label_key unique (building_id, label)
);

create table if not exists public.charges (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  period text not null,
  concept text not null,
  amount_cents integer not null check (amount_cents > 0),
  due_date date not null,
  created_at timestamptz not null default now(),
  constraint charges_unit_period_concept_key unique (unit_id, period, concept)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  charge_id uuid not null references public.charges(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  method text not null,
  idempotency_key text not null,
  paid_at timestamptz not null default now(),
  constraint payments_charge_idempotency_key unique (charge_id, idempotency_key)
);

-- La app móvil no lee ni escribe estas tablas directamente con la clave anon.
-- Se activa RLS sin políticas: solo la API (conexión de servicio) tiene acceso.
alter table public.buildings enable row level security;
alter table public.units enable row level security;
alter table public.charges enable row level security;
alter table public.payments enable row level security;
