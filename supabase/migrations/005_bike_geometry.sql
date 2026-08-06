-- MyRadl – Geometrie-Datenbank
--
-- Pro Rad ein Geometrie-Datensatz (1:1). Alle Werte sind optional.
-- Längen in Millimetern, Winkel in Grad. Zugriff per RLS über den Rad-Besitz.
create table if not exists bike_geometry (
  bike_id           uuid primary key references bikes(id) on delete cascade,
  seat_tube_length  numeric,   -- Sitzrohrlänge (mm)
  top_tube_length   numeric,   -- Oberrohrlänge horizontal (mm)
  head_angle        numeric,   -- Steuerwinkel / Lenkwinkel (°)
  seat_angle        numeric,   -- Sitzwinkel (°)
  head_tube_length  numeric,   -- Steuerrohrlänge (mm)
  chainstay_length  numeric,   -- Kettenstrebenlänge (mm)
  wheelbase         numeric,   -- Radstand (mm)
  bb_drop           numeric,   -- Tretlagerabsenkung (mm)
  standover_height  numeric,   -- Überstandshöhe (mm)
  reach             numeric,   -- Reach (mm)
  stack             numeric,   -- Stack (mm)
  updated_at        timestamptz not null default now()
);

alter table bike_geometry enable row level security;

-- Zugriff nur auf Geometrie eigener Räder.
create policy bike_geometry_owner on bike_geometry
  for all to authenticated
  using (exists (
    select 1 from bikes b where b.id = bike_geometry.bike_id and b.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from bikes b where b.id = bike_geometry.bike_id and b.user_id = auth.uid()
  ));
