-- PayTrack: cobros generales. Un negocio (buildings) tiene clientes (clients) y cobros (charges).
-- Ejecutar en Supabase > SQL Editor después de 0001_paytrack.sql.

alter table public.units rename to clients;
alter table public.clients rename column label to name;
alter table public.clients rename column resident_name to phone;
alter table public.clients add column if not exists email text;
alter table public.clients drop constraint if exists units_building_label_key;

alter table public.charges rename column unit_id to client_id;
alter table public.charges drop constraint if exists charges_unit_period_concept_key;
alter table public.charges drop column if exists period;

alter table public.charges add constraint charges_client_fk
  foreign key (client_id) references public.clients(id) on delete cascade;
