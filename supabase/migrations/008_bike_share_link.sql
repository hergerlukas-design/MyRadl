-- MyRadl – Öffentlicher Share-Link pro Rad (Community-Feature, Phase 1)
--
-- Ein Rad ist standardmäßig privat (`visibility = 'private'`). Wird es auf
-- 'public' gestellt, kann jede Person mit dem Link `/share/<share_token>` das
-- Rad schreibgeschützt ansehen – ohne Login. Der Token ist eine unratbare UUID
-- und lässt sich neu setzen (App: „Link neu generieren"), um einen bereits
-- verteilten Link zu entwerten, ohne das Teilen ganz abzuschalten.
--
-- Schreibrechte bleiben unverändert beim Besitzer: die bestehenden
-- `*_owner`-Policies (`for all to authenticated`) werden nicht angefasst, die
-- neuen Policies sind reine `select`-Policies.

-- ─────────────────────────────────────────────────────────────────────────────
-- Spalten
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.bikes
  add column if not exists visibility  text not null default 'private',
  add column if not exists share_token uuid not null default gen_random_uuid();

-- gen_random_uuid() ist volatil ⇒ Postgres schreibt die Tabelle um und vergibt
-- pro bestehender Zeile einen eigenen Token (kein gemeinsamer Default-Wert).

alter table public.bikes drop constraint if exists bikes_visibility_check;
alter table public.bikes
  add constraint bikes_visibility_check check (visibility in ('private', 'public'));

create unique index if not exists idx_bikes_share_token on public.bikes(share_token);

comment on column public.bikes.visibility is
  'private (Standard) | public – bei public ist das Rad über den Share-Link lesbar.';
comment on column public.bikes.share_token is
  'Unratbarer Token für den öffentlichen Link /share/<share_token>. Neu setzbar, um alte Links zu entwerten.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Lese-Policies für öffentlich geteilte Räder
--
-- Rolle `anon` deckt Besucher ohne Login ab. `authenticated` ist bewusst
-- ebenfalls erlaubt: sonst könnten eingeloggte Nutzer den geteilten Link eines
-- *anderen* Users nicht öffnen (die Owner-Policy greift dort nicht). Sichtbar
-- wird dadurch ausschließlich, was ohnehin öffentlich geteilt ist.
--
-- Aufbau analog zu den Owner-Policies: Join über bike_id bzw. part_id → bike.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists bikes_public_read on public.bikes;
create policy bikes_public_read on public.bikes
  for select to anon, authenticated
  using (visibility = 'public');

drop policy if exists parts_public_read on public.parts;
create policy parts_public_read on public.parts
  for select to anon, authenticated
  using (exists (
    select 1 from public.bikes b
    where b.id = parts.bike_id and b.visibility = 'public'
  ));

drop policy if exists bike_geometry_public_read on public.bike_geometry;
create policy bike_geometry_public_read on public.bike_geometry
  for select to anon, authenticated
  using (exists (
    select 1 from public.bikes b
    where b.id = bike_geometry.bike_id and b.visibility = 'public'
  ));

drop policy if exists part_links_public_read on public.part_links;
create policy part_links_public_read on public.part_links
  for select to anon, authenticated
  using (exists (
    select 1 from public.parts p join public.bikes b on b.id = p.bike_id
    where p.id = part_links.part_id and b.visibility = 'public'
  ));

drop policy if exists part_settings_public_read on public.part_settings;
create policy part_settings_public_read on public.part_settings
  for select to anon, authenticated
  using (exists (
    select 1 from public.parts p join public.bikes b on b.id = p.bike_id
    where p.id = part_settings.part_id and b.visibility = 'public'
  ));

drop policy if exists part_history_public_read on public.part_history;
create policy part_history_public_read on public.part_history
  for select to anon, authenticated
  using (exists (
    select 1 from public.parts p join public.bikes b on b.id = p.bike_id
    where p.id = part_history.part_id and b.visibility = 'public'
  ));

-- Table-Grants für die anonyme Rolle (RLS filtert darüber hinaus zeilenweise).
-- In Supabase sind diese Grants per Default-Privileges meist schon gesetzt;
-- explizit gesetzt bleibt die Migration auch auf frischen Projekten korrekt.
grant select on public.bikes         to anon;
grant select on public.parts         to anon;
grant select on public.part_links    to anon;
grant select on public.part_settings to anon;
grant select on public.part_history  to anon;
grant select on public.bike_geometry to anon;
