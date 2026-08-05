-- Härtung der RLS-Policies.
--
-- 001 nutzte eine SECURITY DEFINER Hilfsfunktion `part_belongs_to_user`, um in
-- den Policies von part_links/part_settings/part_history die Ownership zu
-- prüfen. Eine solche Funktion im `public`-Schema ist über PostgREST als RPC
-- (`/rest/v1/rpc/part_belongs_to_user`) aufrufbar – der Supabase-Advisor
-- meldet das zu Recht (Lints 0028/0029).
--
-- Fix: Funktion entfernen und die Prüfung direkt in die Policies inline-joinen
-- (part -> bike.user_id). Ergebnis identisch, aber keine exponierte Funktion.

drop policy part_links_owner    on part_links;
drop policy part_settings_owner on part_settings;
drop policy part_history_owner  on part_history;

drop function if exists part_belongs_to_user(uuid);

create policy part_links_owner on part_links
  for all to authenticated
  using (exists (
    select 1 from parts p join bikes b on b.id = p.bike_id
    where p.id = part_links.part_id and b.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from parts p join bikes b on b.id = p.bike_id
    where p.id = part_links.part_id and b.user_id = auth.uid()
  ));

create policy part_settings_owner on part_settings
  for all to authenticated
  using (exists (
    select 1 from parts p join bikes b on b.id = p.bike_id
    where p.id = part_settings.part_id and b.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from parts p join bikes b on b.id = p.bike_id
    where p.id = part_settings.part_id and b.user_id = auth.uid()
  ));

create policy part_history_owner on part_history
  for all to authenticated
  using (exists (
    select 1 from parts p join bikes b on b.id = p.bike_id
    where p.id = part_history.part_id and b.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from parts p join bikes b on b.id = p.bike_id
    where p.id = part_history.part_id and b.user_id = auth.uid()
  ));
