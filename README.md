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

Bildupload für Räder und Teile über Supabase Storage (Bucket `photos`).

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

1. Projekt in Region `eu-central-1` anlegen.
2. Migration `supabase/migrations/001_initial_schema.sql` ausführen
   (SQL-Editor oder `supabase db push`). Sie legt Tabellen, Enum,
   Row-Level-Security-Policies und den Storage-Bucket `photos` an.
3. Auth → Email-Provider aktivieren (Passwort und/oder Magic-Link).

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
