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
6. **Öffentlicher Share-Link** – ein Rad lässt sich über `/share/<share_token>`
   schreibgeschützt und ohne Login teilen (Toggle im Rad-Detail, Link neu
   generierbar).
7. **Community** – Tab „Entdecken" mit allen öffentlich geteilten Rädern
   (neueste zuerst, Suche nach Username/Marke/Modell), öffentliche Profile unter
   `/u/<username>` und ein Like pro Rad und User. Beides ohne Login einsehbar;
   Liken verlangt ein Konto.

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

Das Live-Projekt ist bereits angelegt:

- **Projekt**: `myradl` (Region `eu-central-1`, Ref `zulhbsdlvaqwjjakqhck`)
- **API-URL**: `https://zulhbsdlvaqwjjakqhck.supabase.co`
- **Client-Key**: Publishable Key aus **Settings → API** (`sb_publishable_…`)

Die Migrationen wurden bereits auf dieses Projekt angewendet (Tabellen, Enum,
RLS-Policies, Storage-Bucket `photos`). Für einen frischen Aufbau:

1. Projekt in Region `eu-central-1` anlegen.
2. Alle Migrationen in `supabase/migrations/` der Reihe nach ausführen
   (SQL-Editor oder `supabase db push`), beginnend mit
   `001_initial_schema.sql`.
3. Auth → Email-Provider aktivieren (Passwort und/oder Magic-Link). Standardmäßig
   ist Email-Bestätigung aktiv; zum schnellen Testen ggf. unter
   **Authentication → Sign In / Providers → Email** deaktivieren.

Alle Tabellen sind per RLS auf den eingeloggten User beschränkt: `bikes.user_id`
ist die Wurzel, die übrigen Tabellen leiten den Zugriff über `bike_id`/`part_id`
ab. Ausnahmen sind bewusst gesetzt und ausschließlich lesend:

- `*_public_read` aus `008_bike_share_link.sql` gibt Räder mit
  `visibility = 'public'` (samt Teilen, Einstellungen, Links, Verlauf und
  Geometrie) frei – Grundlage für Share-Ansicht und Community.
- `profiles` und `bike_likes` aus `009_community_profiles_likes.sql` sind
  komplett öffentlich lesbar: Profile sollen ohne Login auffindbar sein, die
  Like-Zahl eines Rads sichtbar. Geschrieben wird in beiden Tabellen nur in
  eigenem Namen (`id`/`user_id = auth.uid()`).

Geschrieben werden darf ansonsten weiterhin nur vom Besitzer.

Ein Username (`profiles`) ist Voraussetzung, bevor ein Rad öffentlich geteilt
wird – die App fragt ihn beim ersten Teilen ab. Räder aus Phase 1, deren
Besitzer noch kein Profil hat, bleiben über ihren Link erreichbar, erscheinen
aber nicht im Community-Feed.

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
