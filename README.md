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

**Vor einem öffentlichen Launch anzupassen:**

- `LEGAL.street` / `LEGAL.city` – die Platzhalter-Anschrift durch die echte
  ersetzen. Ein unvollständiges Impressum ist nach § 5 ECG (AT) bzw. § 5 DDG
  (DE) abmahnfähig.
- `SUPERVISORY_AUTHORITY` – auf die Aufsichtsbehörde am Betreibersitz
  anpassen, falls dieser nicht in Österreich liegt.
- `LEGAL.site` – auf die tatsächliche Produktions-Domain setzen.
- `LEGAL.updated` – bei inhaltlichen Änderungen der Texte hochziehen.

Zwei Punkte sind in der Erklärung bewusst offengelegt, weil sie so
implementiert sind: der Storage-Bucket `photos` ist öffentlich lesbar (Bilder
sind über ihre zufällige URL abrufbar), und Google Fonts werden zur Laufzeit
von Google-Servern geladen (IP-Übermittlung). Wer beides vermeiden will,
stellt den Bucket auf privat um (mit signierten URLs) bzw. hostet die
Schriften selbst – dann sind die Abschnitte 6 und 7 der Datenschutzerklärung
entsprechend zu kürzen.

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
