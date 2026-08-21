import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, ExternalLink } from 'lucide-react'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { LEGAL, PROCESSORS, SUPERVISORY_AUTHORITY } from '@/lib/legal'

/* ── Kleine Textbausteine im App-Look ───────────────────────────────────── */

function P({ children }: { children: ReactNode }) {
  return <p className="text-[13px] leading-relaxed text-cream-dim">{children}</p>
}

function H({ children }: { children: ReactNode }) {
  return <h3 className="text-[13px] font-extrabold text-cream mt-1">{children}</h3>
}

function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-cream-dim">
          <span className="text-accent select-none">–</span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-accent underline underline-offset-2 break-words"
    >
      {children}
    </a>
  )
}

/** Aufklappbare Karte – hält die langen Rechtstexte auf dem Handy handhabbar. */
function Section({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section id={id} className="bg-surface border border-hair rounded-[20px] scroll-mt-4">
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        className="w-full flex items-center justify-between gap-3 p-[18px] text-left"
      >
        <span className="text-[15px] font-extrabold text-cream">{title}</span>
        <ChevronDown
          size={18}
          className={`flex-none text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div id={`${id}-body`} className="px-[18px] pb-[18px] flex flex-col gap-3 border-t border-hair pt-4">
          {children}
        </div>
      )}
    </section>
  )
}

/* ── Seite ──────────────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'impressum', title: 'Impressum' },
  { id: 'datenschutz', title: 'Datenschutzerklärung' },
  { id: 'daten', title: 'Deine Daten & Rechte' },
  { id: 'nutzung', title: 'Nutzungsbedingungen' },
  { id: 'haftung', title: 'Haftung & Sicherheitshinweis' },
  { id: 'lizenzen', title: 'Open-Source-Lizenzen' },
] as const

export default function Legal() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const [open, setOpen] = useState<string | null>(hash ? hash.slice(1) : null)

  // Deep-Links wie /legal#datenschutz öffnen den Abschnitt und scrollen hin.
  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    setOpen(id)
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
  }, [hash])

  const mailto = `mailto:${LEGAL.email}`
  const address = `${LEGAL.street}, ${LEGAL.city}, ${LEGAL.country}`

  return (
    <Layout hideNav={!session}>
      <div className="px-5 pt-4 flex-none">
        <PageHeader
          eyebrow="RECHTLICHES"
          onBack={() => navigate(session ? '/settings' : '/login')}
        />
        <h1 className="font-display font-black text-[32px] leading-none tracking-[-0.02em] text-cream mt-4">
          Rechtliches
        </h1>
        <p className="text-[13px] leading-relaxed text-muted mt-2">
          Impressum, Datenschutz und Nutzungsbedingungen für MyRadl. Stand:{' '}
          {LEGAL.updated}.
        </p>
      </div>

      {/* Sprungmarken */}
      <div className="px-5 pt-4 flex-none">
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setOpen(s.id)
                requestAnimationFrame(() =>
                  document.getElementById(s.id)?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
                )
              }}
              className="font-mono text-[10px] font-medium tracking-[0.12em] uppercase px-3 py-1.5 rounded-full border border-hair-strong text-muted active:scale-95 transition-transform"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 py-4 flex flex-col gap-3.5">
        {/* ── IMPRESSUM ───────────────────────────────────────────────── */}
        <Section
          id="impressum"
          title="Impressum"
          open={open === 'impressum'}
          onToggle={() => setOpen(open === 'impressum' ? null : 'impressum')}
        >
          <P>
            Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).
          </P>

          <H>Diensteanbieter</H>
          <P>
            {LEGAL.operator}
            <br />
            {LEGAL.street}
            <br />
            {LEGAL.city}
            <br />
            {LEGAL.country}
          </P>

          <H>Kontakt</H>
          <P>
            E-Mail: <A href={mailto}>{LEGAL.email}</A>
            {LEGAL.phone && (
              <>
                <br />
                Telefon: {LEGAL.phone}
              </>
            )}
            <br />
            Web: <A href={LEGAL.site}>{LEGAL.site}</A>
          </P>

          <H>Art des Angebots</H>
          <P>
            MyRadl ist ein privates, nicht-kommerzielles Hobbyprojekt zur
            Verwaltung der eigenen Mountainbikes und der daran verbauten Teile.
            Es werden keine Waren oder Dienstleistungen verkauft, es besteht
            keine Umsatzsteuer-Identifikationsnummer nach § 27a UStG und kein
            angemeldetes Gewerbe.
          </P>

          <H>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</H>
          <P>
            {LEGAL.operator}, {address}
          </P>

          <H>Verbraucherstreitbeilegung</H>
          <P>
            Über MyRadl werden keine Verträge mit Verbraucherinnen und
            Verbrauchern geschlossen. Es besteht daher weder eine Verpflichtung
            noch die Bereitschaft, an einem Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle im Sinne des
            Verbraucherstreitbeilegungsgesetzes (VSBG) teilzunehmen. Die
            Online-Streitbeilegungsplattform der Europäischen Kommission wurde
            zum 20. Juli 2025 eingestellt und steht nicht mehr zur Verfügung.
          </P>

          <H>Urheberrecht</H>
          <P>
            Die Inhalte, das Design und der Quellcode dieser Anwendung
            unterliegen dem Urheberrecht. Von dir hochgeladene Fotos und
            eingegebene Inhalte bleiben in vollem Umfang dein Eigentum; es wird
            daran keinerlei Nutzungsrecht über den Betrieb der App hinaus
            beansprucht.
          </P>

          <H>Haftung für Links</H>
          <P>
            Du kannst zu Teilen eigene Shop- und Preisvergleichs-Links
            hinterlegen. Diese Links führen auf fremde Websites, auf deren
            Inhalte kein Einfluss besteht. Für die Inhalte verlinkter Seiten ist
            ausschließlich deren jeweiliger Betreiber verantwortlich. Zum
            Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar; bei
            Bekanntwerden von Rechtsverletzungen werden entsprechende Links
            entfernt.
          </P>
        </Section>

        {/* ── DATENSCHUTZ ─────────────────────────────────────────────── */}
        <Section
          id="datenschutz"
          title="Datenschutzerklärung"
          open={open === 'datenschutz'}
          onToggle={() => setOpen(open === 'datenschutz' ? null : 'datenschutz')}
        >
          <P>
            Der Schutz deiner Daten ist uns wichtig. Nachfolgend wird
            transparent dargestellt, welche personenbezogenen Daten bei der
            Nutzung von MyRadl verarbeitet werden – gemäß
            Datenschutz-Grundverordnung (DSGVO) und
            Bundesdatenschutzgesetz (BDSG).
          </P>

          <H>1. Verantwortlicher</H>
          <P>
            Verantwortlich im Sinne des Art. 4 Nr. 7 DSGVO ist:
            <br />
            {LEGAL.operator}, {address}
            <br />
            E-Mail: <A href={mailto}>{LEGAL.email}</A>
          </P>
          <P>
            Die Voraussetzungen für die Pflicht zur Bestellung eines
            Datenschutzbeauftragten nach § 38 BDSG liegen nicht vor; ein
            solcher wurde daher nicht bestellt.
          </P>

          <H>2. Welche Daten verarbeitet werden</H>
          <P>
            <strong className="text-cream">Kontodaten.</strong> Bei der
            Registrierung werden deine E-Mail-Adresse, ein kryptografisch
            gehashtes Passwort (das Klartext-Passwort ist niemals einsehbar),
            eine zufällige Benutzer-ID sowie Zeitstempel zu Registrierung und
            letzter Anmeldung gespeichert. Meldest du dich per Magic-Link an,
            wird zusätzlich ein einmaliger, kurzlebiger Anmeldetoken per E-Mail
            versendet.
          </P>
          <P>
            <strong className="text-cream">Inhaltsdaten.</strong> Alles, was du
            selbst in der App anlegst: Räder (Name, Marke, Modell, Baujahr,
            Foto), Rahmengeometrie, Bauteile (Kategorie, Marke, Modell,
            Variante, Einbauposition, Einbaudatum, Status, Notizen, Foto),
            Einstellungen wie Luftdruck oder Sag, hinterlegte Shop-Links sowie
            Wartungs- und Verlaufseinträge.
          </P>
          <P>
            <strong className="text-cream">Technische Daten.</strong> Beim
            Aufruf der App erhebt der Hosting-Anbieter automatisch
            Server-Logdaten: IP-Adresse, Datum und Uhrzeit des Zugriffs,
            aufgerufene Adresse, übertragene Datenmenge, Browsertyp und
            Betriebssystem. Diese Daten sind technisch erforderlich, um die App
            auszuliefern und Angriffe abzuwehren.
          </P>
          <P>
            <strong className="text-cream">Keine Werbe- oder Trackingdaten.</strong>{' '}
            MyRadl setzt keine Analyse-, Tracking- oder Werbedienste ein. Es
            gibt keine Profilbildung, kein Scoring und keine automatisierte
            Entscheidungsfindung im Sinne des Art. 22 DSGVO. Deine Daten werden
            nicht verkauft und nicht zu Werbezwecken weitergegeben.
          </P>

          <H>3. Zwecke und Rechtsgrundlagen</H>
          <UL
            items={[
              <>
                <strong className="text-cream">Bereitstellung des Nutzerkontos und Speichern deiner Inhalte</strong> –
                Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Nutzungsverhältnisses).
              </>,
              <>
                <strong className="text-cream">Betriebssicherheit, Fehlersuche, Missbrauchsabwehr</strong> –
                Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am
                störungsfreien und sicheren Betrieb).
              </>,
              <>
                <strong className="text-cream">Versand von Anmelde- und Bestätigungs-E-Mails</strong> –
                Art. 6 Abs. 1 lit. b DSGVO.
              </>,
            ]}
          />

          <H>4. Cookies und lokale Speicherung</H>
          <P>
            MyRadl verwendet keine Werbe- oder Tracking-Cookies. Es besteht
            deshalb keine Einwilligungspflicht und kein Cookie-Banner.
            Gespeichert werden im lokalen Speicher deines Geräts ausschließlich
            technisch notwendige Daten:
          </P>
          <UL
            items={[
              <>
                <strong className="text-cream">Anmelde-Token</strong> (Supabase-Session)
                – hält dich angemeldet, bis du dich abmeldest.
              </>,
              <>
                <strong className="text-cream">Design-Einstellung</strong> (Schlüssel{' '}
                <code className="font-mono text-[12px] text-muted">myradl-theme</code>)
                – merkt sich hell oder dunkel.
              </>,
              <>
                <strong className="text-cream">Offline-Cache</strong> des Service
                Workers – speichert Programmdateien, damit die App als
                installierte PWA auch ohne Verbindung startet.
              </>,
            ]}
          />
          <P>
            Diese Daten verlassen dein Gerät nicht und lassen sich jederzeit
            über die Browsereinstellungen („Websitedaten löschen") entfernen.
            Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG (unbedingt
            erforderliche Speicherung), da ohne sie der von dir gewünschte
            Dienst nicht bereitgestellt werden kann.
          </P>

          <H>5. Empfänger und Auftragsverarbeiter</H>
          <P>
            Zum Betrieb der App werden folgende Dienstleister eingesetzt. Mit
            ihnen bestehen Auftragsverarbeitungsverträge nach Art. 28 DSGVO;
            für Übermittlungen in die USA stützen sie sich auf
            EU-Standardvertragsklauseln bzw. das EU-US Data Privacy Framework.
          </P>
          <div className="flex flex-col gap-2.5">
            {PROCESSORS.map((p) => (
              <div key={p.name} className="bg-surface-2 border border-hair rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[13px] font-bold text-cream">{p.name}</span>
                <span className="text-[12px] leading-relaxed text-muted">{p.purpose}</span>
                <span className="text-[12px] leading-relaxed text-muted">{p.location}</span>
                <A href={p.privacy}>
                  <span className="inline-flex items-center gap-1 text-[12px]">
                    Datenschutzerklärung <ExternalLink size={11} />
                  </span>
                </A>
              </div>
            ))}
          </div>
          <P>
            Die Datenbank, die Nutzerkonten und alle Fotos liegen auf Servern
            innerhalb der EU (Frankfurt am Main). Darüber hinaus werden beim
            Aufruf der App keine weiteren Server Dritter kontaktiert:
            Schriftarten, Symbole und alle übrigen Bestandteile der Oberfläche
            werden direkt von MyRadl ausgeliefert und nicht von externen
            Anbietern wie Google Fonts nachgeladen.
          </P>

          <H>6. Sichtbarkeit hochgeladener Fotos</H>
          <P>
            Wichtiger Hinweis: Fotos zu Rädern und Teilen werden in einem
            Speicher abgelegt, der über eine lange, zufällig erzeugte Adresse
            öffentlich abrufbar ist. Nur wer diese exakte Adresse kennt, kann
            das Bild sehen – in der App selbst sind fremde Fotos nicht
            auffindbar, und niemand kann in deinem Konto stöbern. Lade dennoch
            keine Fotos hoch, die vertrauliche Informationen enthalten
            (z. B. Ausweise, Rechnungen mit Adressdaten oder Personen, die
            damit nicht einverstanden sind).
          </P>

          <H>7. Datensicherheit</H>
          <UL
            items={[
              'Die gesamte Übertragung erfolgt ausschließlich verschlüsselt über HTTPS/TLS.',
              'Auf Datenbankebene sorgen Zugriffsregeln (Row Level Security) dafür, dass jeder Datensatz nur dem jeweiligen Konto zugänglich ist – auch bei direkten Zugriffen auf die Schnittstelle.',
              'Passwörter werden ausschließlich als Hash gespeichert und sind nicht rückrechenbar.',
            ]}
          />

          <H>8. Speicherdauer</H>
          <UL
            items={[
              'Konto- und Inhaltsdaten werden gespeichert, solange dein Konto besteht, und nach einer Löschung des Kontos entfernt.',
              'Von dir gelöschte Räder, Teile und Fotos werden unmittelbar aus der Datenbank bzw. dem Speicher entfernt; sie können für kurze Zeit noch in technischen Sicherungskopien der Dienstleister enthalten sein.',
              'Server-Logdaten werden vom Hosting-Anbieter nur kurzfristig zur Fehleranalyse vorgehalten und danach automatisch gelöscht.',
            ]}
          />

          <H>9. Änderungen dieser Erklärung</H>
          <P>
            Wird die App um neue Funktionen erweitert, kann eine Anpassung
            dieser Erklärung notwendig werden. Es gilt jeweils die hier
            veröffentlichte Fassung. Stand: {LEGAL.updated}.
          </P>
        </Section>

        {/* ── BETROFFENENRECHTE ───────────────────────────────────────── */}
        <Section
          id="daten"
          title="Deine Daten & Rechte"
          open={open === 'daten'}
          onToggle={() => setOpen(open === 'daten' ? null : 'daten')}
        >
          <P>Als betroffene Person stehen dir nach der DSGVO folgende Rechte zu:</P>
          <UL
            items={[
              <>
                <strong className="text-cream">Auskunft</strong> (Art. 15) – welche
                Daten zu dir gespeichert sind und zu welchem Zweck.
              </>,
              <>
                <strong className="text-cream">Berichtigung</strong> (Art. 16) –
                unrichtige Daten korrigieren. Deine Inhalte kannst du jederzeit
                direkt in der App bearbeiten.
              </>,
              <>
                <strong className="text-cream">Löschung</strong> (Art. 17) – deine
                Daten und dein Konto vollständig entfernen lassen.
              </>,
              <>
                <strong className="text-cream">Einschränkung der Verarbeitung</strong>{' '}
                (Art. 18).
              </>,
              <>
                <strong className="text-cream">Datenübertragbarkeit</strong> (Art. 20)
                – Herausgabe deiner Daten in einem maschinenlesbaren Format.
              </>,
              <>
                <strong className="text-cream">Widerspruch</strong> (Art. 21) gegen
                Verarbeitungen auf Grundlage berechtigter Interessen.
              </>,
            ]}
          />

          <H>Konto und Daten löschen</H>
          <P>
            Einzelne Räder, Teile und Fotos kannst du direkt in der App löschen.
            Für die Löschung des gesamten Kontos samt aller Inhalte genügt eine
            formlose E-Mail von deiner registrierten Adresse an{' '}
            <A href={`${mailto}?subject=MyRadl%20Konto%20l%C3%B6schen`}>{LEGAL.email}</A>.
            Die Löschung erfolgt ohne Rückfrage und ist unwiderruflich; du
            erhältst eine Bestätigung, sobald sie durchgeführt wurde.
          </P>

          <H>Auskunft anfordern</H>
          <P>
            Auch für eine Kopie deiner Daten reicht eine E-Mail an{' '}
            <A href={`${mailto}?subject=MyRadl%20Daten-Auskunft`}>{LEGAL.email}</A>.
            Anfragen werden innerhalb der gesetzlichen Frist von einem Monat
            beantwortet.
          </P>

          <H>Beschwerderecht</H>
          <P>
            Wenn du der Ansicht bist, dass die Verarbeitung deiner Daten gegen
            das Datenschutzrecht verstößt, kannst du dich bei der
            Aufsichtsbehörde beschweren:
            <br />
            {SUPERVISORY_AUTHORITY.name}
            <br />
            {SUPERVISORY_AUTHORITY.address}
            <br />
            <A href={SUPERVISORY_AUTHORITY.url}>{SUPERVISORY_AUTHORITY.url}</A>
          </P>
        </Section>

        {/* ── NUTZUNGSBEDINGUNGEN ─────────────────────────────────────── */}
        <Section
          id="nutzung"
          title="Nutzungsbedingungen"
          open={open === 'nutzung'}
          onToggle={() => setOpen(open === 'nutzung' ? null : 'nutzung')}
        >
          <H>1. Gegenstand</H>
          <P>
            MyRadl wird als kostenloses, privates Projekt bereitgestellt. Mit
            der Registrierung erkennst du diese Bedingungen an. Ein
            Rechtsanspruch auf Nutzung, auf bestimmte Funktionen oder auf
            Verfügbarkeit besteht nicht.
          </P>

          <H>2. Dein Konto</H>
          <UL
            items={[
              'Gib bei der Registrierung eine gültige E-Mail-Adresse an, über die du erreichbar bist.',
              'Halte dein Passwort geheim und verwende ein Passwort, das du nirgendwo sonst nutzt.',
              'Konten sind persönlich und dürfen nicht an Dritte weitergegeben werden.',
            ]}
          />

          <H>3. Deine Inhalte</H>
          <P>
            Für die eingestellten Inhalte bist du selbst verantwortlich. Lade
            nur Fotos hoch, an denen du die Rechte hast, und keine Inhalte, die
            Rechte Dritter oder geltendes Recht verletzen. Rechtswidrige
            Inhalte können ohne Vorankündigung entfernt werden.
          </P>

          <H>4. Verfügbarkeit und Datensicherung</H>
          <P>
            Die App wird ohne Zusicherung einer bestimmten Verfügbarkeit
            betrieben. Wartungsarbeiten, Störungen beim Hosting-Anbieter oder
            die Einstellung des Projekts können zu Unterbrechungen oder zum
            Verlust von Daten führen. Es besteht keine Verpflichtung zur
            Vorhaltung von Sicherungskopien – sichere dir wichtige Angaben
            zusätzlich selbst.
          </P>

          <H>5. Beendigung</H>
          <P>
            Du kannst die Nutzung jederzeit beenden und die Löschung deines
            Kontos verlangen. Bei erheblichen Verstößen gegen diese Bedingungen
            kann ein Konto gesperrt oder gelöscht werden. Wird das Projekt
            eingestellt, wird das mit angemessener Vorlaufzeit in der App
            angekündigt, damit du deine Daten sichern kannst.
          </P>

          <H>6. Anwendbares Recht</H>
          <P>
            Es gilt das Recht am Sitz des Betreibers ({LEGAL.country}) unter
            Ausschluss der Verweisungsnormen. Zwingende
            Verbraucherschutzbestimmungen deines Wohnsitzstaates bleiben davon
            unberührt.
          </P>
        </Section>

        {/* ── HAFTUNG ─────────────────────────────────────────────────── */}
        <Section
          id="haftung"
          title="Haftung & Sicherheitshinweis"
          open={open === 'haftung'}
          onToggle={() => setOpen(open === 'haftung' ? null : 'haftung')}
        >
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3.5">
            <P>
              <strong className="text-cream">
                MyRadl ist ein Notizbuch, keine Wartungsanleitung.
              </strong>{' '}
              Alle Angaben zu Teilen, Luftdruck, Sag, Zugstufe, Drehmomenten
              oder Wartungsintervallen stammen aus deinen eigenen Eingaben und
              werden weder geprüft noch fachlich bewertet. Sicherheitsrelevante
              Arbeiten an Bremsen, Federelementen, Laufrädern oder Cockpit
              gehören in eine Fachwerkstatt; maßgeblich sind stets die
              Herstellerangaben.
            </P>
          </div>

          <H>Haftungsumfang</H>
          <P>
            Die Haftung für Schäden ist auf Vorsatz und grobe Fahrlässigkeit
            beschränkt. Für leichte Fahrlässigkeit wird nur bei Verletzung
            wesentlicher Vertragspflichten und begrenzt auf den typischen,
            vorhersehbaren Schaden gehaftet. Ausgeschlossen ist insbesondere
            die Haftung für Datenverlust, entgangenen Nutzen und mittelbare
            Schäden. Die Haftung für Schäden aus der Verletzung des Lebens, des
            Körpers oder der Gesundheit sowie nach dem Produkthaftungsgesetz
            bleibt unberührt.
          </P>

          <H>Inhalte Dritter</H>
          <P>
            Für die Richtigkeit von Preisen, Verfügbarkeiten und
            Produktangaben auf verlinkten Shop- oder Preisvergleichsseiten wird
            keine Gewähr übernommen. Ob ein Ersatzteil tatsächlich zu deinem
            Rad passt, musst du vor dem Kauf selbst prüfen.
          </P>
        </Section>

        {/* ── LIZENZEN ────────────────────────────────────────────────── */}
        <Section
          id="lizenzen"
          title="Open-Source-Lizenzen"
          open={open === 'lizenzen'}
          onToggle={() => setOpen(open === 'lizenzen' ? null : 'lizenzen')}
        >
          <P>
            MyRadl baut auf freier Software auf. Dank an alle Beteiligten – die
            jeweiligen Lizenzbedingungen gelten fort:
          </P>
          <UL
            items={[
              'React und React Router – MIT-Lizenz',
              'Vite und vite-plugin-pwa – MIT-Lizenz',
              'Tailwind CSS – MIT-Lizenz',
              'TanStack Query – MIT-Lizenz',
              'Lucide Icons – ISC-Lizenz',
              'date-fns – MIT-Lizenz',
              'supabase-js – MIT-Lizenz',
              'Chivo und IBM Plex – SIL Open Font License 1.1',
            ]}
          />
        </Section>

        <p className="text-center text-[11px] leading-relaxed text-dim px-2 pt-1">
          Diese Texte sind sorgfältig erstellt, ersetzen aber keine
          Rechtsberatung im Einzelfall.
        </p>
      </div>
    </Layout>
  )
}
