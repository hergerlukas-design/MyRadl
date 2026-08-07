-- MyRadl – Kategorie „Sattelstütze"
--
-- Ergänzt den Enum-Wert für Sattelstützen (z. B. Teleskop-/Dropper-Stützen).
-- Rein additiv: bestehende Teile bleiben unverändert, kein Datenverlust.
alter type part_category add value if not exists 'sattelstuetze';
