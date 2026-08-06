-- MyRadl – Rahmengröße zur Geometrie
--
-- Rahmengröße als Freitext (z.B. „M" oder „44 cm"), damit sowohl Größen-Codes
-- als auch Zentimeter-Angaben abgebildet werden können.
alter table bike_geometry add column if not exists frame_size text;
