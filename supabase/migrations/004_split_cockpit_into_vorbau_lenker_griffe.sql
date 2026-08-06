-- MyRadl – Cockpit-Aufteilung
--
-- „Cockpit" wird in die drei Kategorien Vorbau, Lenker und Griffe unterteilt.
-- Die neuen Werte werden dem Enum hinzugefügt; der bisherige Wert „cockpit"
-- bleibt erhalten (Postgres-Enums lassen sich nicht ohne Weiteres verkleinern),
-- wird in der App aber nicht mehr zur Auswahl angeboten.
alter type part_category add value if not exists 'vorbau';
alter type part_category add value if not exists 'lenker';
alter type part_category add value if not exists 'griffe';
