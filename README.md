# MyRadl 🚵

Progressive Web App zur Verwaltung mehrerer Mountainbikes inkl. aller verbauten
Teile, deren Einstellungen (Luftdruck, Sag, Zugstufe …) und einer
Verlaufshistorie. Ziel: Beim Nachbestellen sofort erkennen, welches exakte Teil
verbaut ist, und direkt zu Shop-/Preisvergleichsseiten springen.

## Tech-Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS 4**
- **Supabase** – Postgres, Auth (Email/Passwort + Magic-Link), Storage für Fotos
- **PWA** (installierbar, offline-fähiges Grundgerüst) via `vite-plugin-pwa`
- **Deployment**: Fly.io (Docker + nginx)

## Features (MVP)

1. **Rad-Übersicht** – alle Räder mit Foto.
2. **Rad-Detail** – Bauteile nach Kategorie gruppiert, „Neues Teil".
3. **Teil-Detail** – Stammdaten, Einstellungen (Key/Value/Unit), Shop-Links,
   Verlaufshistorie.
4. **Teil ersetzen** – altes Teil auf „ersetzt", History-Eintrag, Nachfolger
   vorausgefüllt anlegen (Kategorie übernommen).
5. **Suche/Filter** – nach Freitext, Kategorie und Rad.
6. **Rechtliches** – Impressum, Datenschutzerklärung, Nutzungsbedingungen
   und Haftungshinweise unter `/legal` (auch ohne Anmeldung erreichbar).

Bildupload für Räder und Teile über Supabase Storage (Bucket `photos`).

## Rechtstexte

Impressum und Datenschutzerklärung liegen unter der öffentlichen Route
`/legal` (verlinkt aus „Mehr" und vom Login-Screen). Alle Betreiberdaten sind
in `src/lib/legal.ts` zentralisiert.

Betreibersitz ist München; die Texte zitieren entsprechend deutsches Recht
(§ 5 DDG, § 18 Abs. 2 MStV, BDSG, § 25 Abs. 2 Nr. 2 TDDDG). Zuständige
Aufsichtsbehörde ist das BayLDA in Ansbach.

**Vor einem öffentlichen Launch anzupassen:**

- `LEGAL.site` – auf die tatsächliche Produktions-Domain setzen.
- `LEGAL.updated` – bei inhaltlichen Änderungen der Texte hochziehen.
- `SUPERVISORY_AUTHORITY` – nur nötig, wenn der Betreibersitz Bayern verlässt;
  die Zuständigkeit richtet sich nach dem Bundesland.

Ein Punkt ist in der Erklärung bewusst offengelegt, weil er so implementiert
ist: der Storage-Bucket `photos` ist öffentlich lesbar, Bilder sind also über
ihre (zufällig erzeugte, nicht erratbare) URL ohne Login abrufbar. Wer das
vermeiden will, stellt den Bucket auf privat um und ersetzt `getPublicUrl`
durch `createSignedUrl` – das macht `photoUrl()` asynchron und betrifft die
drei Aufrufstellen in `ImageUpload`, `Bikes` und `Search`; ablaufende Tokens
vertragen sich zudem schlecht mit dem Offline-Cache der PWA.

## Schriftarten

Chivo und IBM Plex werden über `@fontsource` selbst ausgeliefert (siehe
`src/fonts.css`), nicht über Google Fonts. Das vermeidet die IP-Übermittlung
an Google und sorgt dafür, dass die installierte PWA auch offline in der
richtigen Schrift rendert – die woff2-Dateien sind über `globPatterns` im
Precache des Service Workers enthalten.

Importiert werden nur der `latin`-Subset und die neun Schnitte, die
`index.css` referenziert (~168 KB). Wird ein neuer Schnitt im Design
verwendet, muss er in `src/fonts.css` ergänzt werden, sonst rendert der
Browser ihn synthetisch. Die von `@fontsource` mitgelieferten `.woff`-Dateien
landen zwar im Build, werden aber von keinem aktuellen Browser angefragt.

## Lokale Entwicklung

```bash
npm install
cp .env.example .env   # Werte aus dem Supabase-Dashboard eintragen
npm run dev            # http://localhost:5181
```

### Umgebungsvariablen

| Variable                 | Beschreibung                                  |
| ------------------------ | --------------------------------------------- |
| `VITE_SUPABASE_URL`      | Projekt-URL (Settings → API)                  |
| `VITE_SUPABASE_ANON_KEY` | Anon/Publishable Key (Settings → API)         |

## Supabase einrichten

Das Live-Projekt ist bereits angelegt:

- **Projekt**: `myradl` (Region `eu-central-1`, Ref `zulhbsdlvaqwjjakqhck`)
- **API-URL**: `https://zulhbsdlvaqwjjakqhck.supabase.co`
- **Client-Key**: Publishable Key aus **Settings → API** (`sb_publishable_…`)

Die Migrationen wurden bereits auf dieses Projekt angewendet (Tabellen, Enum,
RLS-Policies, Storage-Bucket `photos`). Für einen frischen Aufbau:

1. Projekt in Region `eu-central-1` anlegen.
2. Migrationen der Reihe nach ausführen (SQL-Editor oder `supabase db push`):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_inline_rls_drop_security_definer.sql`
3. Auth → Email-Provider aktivieren (Passwort und/oder Magic-Link). Standardmäßig
   ist Email-Bestätigung aktiv; zum schnellen Testen ggf. unter
   **Authentication → Sign In / Providers → Email** deaktivieren.

Alle Tabellen sind per RLS auf den eingeloggten User beschränkt: `bikes.user_id`
ist die Wurzel, die übrigen Tabellen leiten den Zugriff über `bike_id`/`part_id`
ab.

## Deployment (Fly.io)

Push auf `master` deployt automatisch über
`.github/workflows/deploy.yml`. Benötigte GitHub-Secrets:

- `FLY_API_TOKEN`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Erstmalig: `fly launch --name myradl` (bzw. `fly deploy`).

## Versionierung

Die Version in `package.json` wird bei jedem funktionalen Change hochgezogen und
in der App unter „Mehr" angezeigt.
