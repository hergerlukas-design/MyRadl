-- MyRadl – Initial Schema
-- MTB Bauteil- & Einstellungs-Manager
--
-- Auth: Supabase Auth (auth.users). Jeder Datensatz gehört einem User.
-- `bikes.user_id` ist die Wurzel; parts/part_links/part_settings/part_history
-- leiten den Zugriff über bike_id/part_id ab. Row Level Security ist auf allen
-- Tabellen aktiv, sodass ein eingeloggter User ausschließlich seine eigenen
-- Daten sieht und bearbeitet.

-- ─────────────────────────────────────────────────────────────────────────────
-- Kategorien als Enum
-- ─────────────────────────────────────────────────────────────────────────────
create type part_category as enum (
  'federgabel', 'daempfer', 'antrieb', 'bremsen',
  'laufraeder', 'reifen', 'cockpit', 'sattel', 'sonstiges'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Räder
-- ─────────────────────────────────────────────────────────────────────────────
create table bikes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,                 -- z.B. "Enduro 2024"
  brand      text,
  model      text,
  year       int,
  image_url  text,                          -- Storage-Pfad im Bucket "photos"
  created_at timestamptz not null default now()
);

create index idx_bikes_user_id on bikes(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Bauteile
-- ─────────────────────────────────────────────────────────────────────────────
create table parts (
  id           uuid primary key default gen_random_uuid(),
  bike_id      uuid not null references bikes(id) on delete cascade,
  category     part_category not null,
  brand        text not null,
  model        text not null,
  variant      text,                        -- Größe/Variante, z.B. "180mm, 29 Zoll"
  status       text not null default 'aktiv', -- aktiv / ersetzt
  install_date date,
  image_url    text,                        -- Storage-Pfad im Bucket "photos"
  notes        text,
  created_at   timestamptz not null default now()
);

create index idx_parts_bike_id on parts(bike_id);
create index idx_parts_category on parts(category);

-- ─────────────────────────────────────────────────────────────────────────────
-- Shop-/Preisvergleichslinks pro Teil
-- ─────────────────────────────────────────────────────────────────────────────
create table part_links (
  id       uuid primary key default gen_random_uuid(),
  part_id  uuid not null references parts(id) on delete cascade,
  label    text not null,                   -- z.B. "Bike-Components", "Geizhals"
  url      text not null
);

create index idx_part_links_part_id on part_links(part_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Einstellungen pro Teil (Key-Value, flexibel je Kategorie)
-- ─────────────────────────────────────────────────────────────────────────────
create table part_settings (
  id         uuid primary key default gen_random_uuid(),
  part_id    uuid not null references parts(id) on delete cascade,
  key        text not null,                 -- z.B. "Luftdruck", "Sag", "Zugstufe"
  value      text not null,
  unit       text,                          -- z.B. "psi", "%", "Klicks"
  updated_at timestamptz not null default now()
);

create index idx_part_settings_part_id on part_settings(part_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Verlaufshistorie (Einbau, Wartung, Austausch)
-- ─────────────────────────────────────────────────────────────────────────────
create table part_history (
  id         uuid primary key default gen_random_uuid(),
  part_id    uuid not null references parts(id) on delete cascade,
  event_type text not null,                 -- 'eingebaut' | 'gewartet' | 'ersetzt'
  event_date date not null,
  note       text,
  created_at timestamptz not null default now()
);

create index idx_part_history_part_id on part_history(part_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table bikes         enable row level security;
alter table parts         enable row level security;
alter table part_links    enable row level security;
alter table part_settings enable row level security;
alter table part_history  enable row level security;

-- bikes: direkter Owner-Check
create policy bikes_owner on bikes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- parts: gehört zu einem Rad des Users
create policy parts_owner on parts
  for all to authenticated
  using (exists (
    select 1 from bikes b where b.id = parts.bike_id and b.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from bikes b where b.id = parts.bike_id and b.user_id = auth.uid()
  ));

-- Hilfsfunktion: gehört ein Teil dem eingeloggten User?
create or replace function part_belongs_to_user(p_part_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from parts p
    join bikes b on b.id = p.bike_id
    where p.id = p_part_id and b.user_id = auth.uid()
  );
$$;

create policy part_links_owner on part_links
  for all to authenticated
  using (part_belongs_to_user(part_id))
  with check (part_belongs_to_user(part_id));

create policy part_settings_owner on part_settings
  for all to authenticated
  using (part_belongs_to_user(part_id))
  with check (part_belongs_to_user(part_id));

create policy part_history_owner on part_history
  for all to authenticated
  using (part_belongs_to_user(part_id))
  with check (part_belongs_to_user(part_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage: ein öffentlicher Bucket "photos".
-- Lesen ist öffentlich (URLs enthalten unratbare UUID-Pfade); Schreiben/Löschen
-- ist auf den eigenen Ordner beschränkt: Pfad = "<user_id>/…".
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos public read" on storage.objects
  for select to public
  using (bucket_id = 'photos');

create policy "photos owner insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos owner update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
