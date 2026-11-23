# MyRadl App-Icon

Marke: „MR“ in Chivo Black über einem Bergkamm.

## Dateien
- myradl-{dark,light}.svg — Quelle, Text als <text> (Chivo Black nötig; vor Abgabe in Pfade konvertieren)
- myradl-{dark,light}-{1024,512,192,180,120,48}.png

## Like-Button (Community)
- bike-like-{outline,filled}.svg — Fahrrad im Ring, Quelle für den Like-Button
- Die Pfade sind in beiden Dateien identisch; `filled` hinterlegt nur eine
  Scheibe und spart das Rad darin aus.
- Eingesetzt werden sie **nicht** von hier geladen, sondern inline in
  `src/components/icons/BikeLikeIcon.tsx` (die Zeichnung nutzt `currentColor`
  und muss der Button- und Theme-Farbe folgen). Beim Ändern der Dateien also
  die Pfade in der Komponente mit nachziehen.

## Farben
dark  bg #12100E · kamm #22301A · mark #A6D65A
light bg #F4F2ED · kamm #DCE6CC · mark #233B10 · balken #4C7A24

## Hinweise
- 1024 = App Store / Play Store, ohne Ecken-Radius (Store rundet selbst)
- 180/120 iOS, 192/48 Android
- Ab 120 px abwärts fällt der Balken weg und die Marke wird größer (optische Korrektur)
- Für Android adaptive icons: Kamm + Marke als Vordergrund, #12100E bzw. #F4F2ED als Hintergrund
