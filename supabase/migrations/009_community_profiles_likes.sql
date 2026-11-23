-- MyRadl – Community, Phase 2: öffentliche Profile & Likes
--
-- Baut auf 008_bike_share_link.sql auf. Dort wurde `bikes.visibility`
-- eingeführt; dieses Flag bleibt unverändert die einzige Quelle dafür, was
-- überhaupt öffentlich sichtbar ist. Phase 2 ergänzt zwei Tabellen:
--
--   profiles    – ein öffentliches Profil (Username) pro User. Nötig, damit
--                 geteilte Räder einer Person zugeordnet und unter
--                 `/u/<username>` gesammelt angezeigt werden können.
--   bike_likes  – ein Like pro (Rad, User); Grundlage für die Like-Zahl an
--                 Rad-Karten und im Rad-Detail.
--
-- Beide Tabellen sind per Definition öffentlich lesbar (auch für `anon`):
-- Profile sollen ohne Login auffindbar sein, und die Like-Zahl eines
-- öffentlichen Rads soll jede Person sehen. Geschrieben werden darf
-- ausschließlich in eigenem Namen (`… = auth.uid()`).

-- ─────────────────────────────────────────────────────────────────────────────
-- Profile
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text not null unique,
  display_name text,
  created_at   timestamptz not null default now()
);

-- Usernames sind Teil einer URL (`/u/<username>`) und werden ausschließlich
-- kleingeschrieben gespeichert. Damit ist der `unique`-Index oben zugleich eine
-- Groß-/Kleinschreibung-unabhängige Eindeutigkeit – ohne citext-Extension.
alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles
  add constraint profiles_username_check
  check (username ~ '^[a-z0-9_]{3,20}$');

comment on table public.profiles is
  'Öffentliches Profil pro User. Pflicht, bevor ein Rad öffentlich geteilt wird.';
comment on column public.profiles.username is
  'Kleingeschrieben, 3–20 Zeichen aus a-z, 0-9 und _. Teil der URL /u/<username>.';
comment on column public.profiles.display_name is
  'Optionaler Anzeigename; fällt in der App auf @username zurück.';

alter table public.profiles enable row level security;

-- Lesen: für alle offen – Profile sind per Definition öffentlich.
drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read on public.profiles
  for select to anon, authenticated
  using (true);

-- Schreiben: nur das eigene Profil, und die Zeilen-ID muss die eigene sein
-- (kein Anlegen eines Profils "für" jemand anderen).
drop policy if exists profiles_owner_insert on public.profiles;
create policy profiles_owner_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_owner_delete on public.profiles;
create policy profiles_owner_delete on public.profiles
  for delete to authenticated
  using (id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- Likes
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.bike_likes (
  id         uuid primary key default gen_random_uuid(),
  bike_id    uuid not null references public.bikes(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (bike_id, user_id)
);

create index if not exists idx_bike_likes_bike_id on public.bike_likes(bike_id);
create index if not exists idx_bike_likes_user_id on public.bike_likes(user_id);

comment on table public.bike_likes is
  'Ein Like pro (Rad, User). Die Like-Zahl ist öffentlich, das Setzen/Entfernen nur in eigenem Namen.';

alter table public.bike_likes enable row level security;

-- Lesen: offen. Sichtbar werden dadurch ausschließlich UUID-Paare
-- (bike_id, user_id) – die eigentliche Rad-Sichtbarkeit regelt weiterhin
-- `bikes.visibility` über die Policies aus 008.
drop policy if exists bike_likes_public_read on public.bike_likes;
create policy bike_likes_public_read on public.bike_likes
  for select to anon, authenticated
  using (true);

-- Schreiben: nur eingeloggt und nur die eigene Zeile. Ein Update gibt es
-- bewusst nicht – ein Like wird gesetzt oder gelöscht.
drop policy if exists bike_likes_own_insert on public.bike_likes;
create policy bike_likes_own_insert on public.bike_likes
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists bike_likes_own_delete on public.bike_likes;
create policy bike_likes_own_delete on public.bike_likes
  for delete to authenticated
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants für die anonyme Rolle (RLS filtert darüber hinaus zeilenweise).
-- ─────────────────────────────────────────────────────────────────────────────
grant select on public.profiles   to anon;
grant select on public.bike_likes to anon;
