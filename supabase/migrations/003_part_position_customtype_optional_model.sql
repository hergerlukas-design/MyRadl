-- MyRadl – Formular-Erweiterungen
--
-- 1) Reifen & Laufräder: Einbauposition (vorne/hinten) auswählbar.
-- 2) Sonstiges: freie Bezeichnung des Bauteils als Freitext.
-- 3) Modell ist kein Pflichtfeld mehr.

-- Reifen/Laufräder: Position (vorne / hinten), sonst NULL.
alter table parts add column if not exists position text;

-- Sonstiges: freie Bezeichnung des Bauteils.
alter table parts add column if not exists custom_type text;

-- Modell ist kein Pflichtfeld mehr.
alter table parts alter column model drop not null;
