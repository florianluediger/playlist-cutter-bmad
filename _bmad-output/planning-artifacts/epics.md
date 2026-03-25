---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# playlist-cutter-bmad - Epic Breakdown

## Overview

Dieses Dokument enthält den vollständigen Epic- und Story-Breakdown für Playlist Cutter. Es zerlegt die Anforderungen aus PRD, UX Design Specification und Architecture in implementierbare Stories.

## Requirements Inventory

### Functional Requirements

FR1: Nutzer kann sich über Spotify OAuth 2.0 PKCE im Browser anmelden
FR2: Nutzer kann sich von der App abmelden
FR3: Das System erhält die Session über Seitenneuladen hinweg (localStorage)
FR4: Das System erkennt abgelaufene Tokens und zeigt eine Meldung mit Handlungsempfehlung
FR5: Nutzer kann alle eigenen Spotify-Playlisten im Zwei-Spalten-Layout einsehen
FR6: Nutzer kann beliebig viele Playlisten als Quell-Playlisten auswählen
FR7: Nutzer kann beliebig viele Playlisten als Ausschluss-Playlisten auswählen
FR8: Das System zeigt einen Empty State, wenn der Nutzer keine Playlisten besitzt
FR9: Das System warnt, wenn dieselbe Playlist als Quelle und Ausschluss gewählt wird
FR10: Das System lädt alle Tracks der ausgewählten Quell-Playlisten
FR11: Das System lädt alle Tracks der ausgewählten Ausschluss-Playlisten
FR12: Das System berechnet die Differenzmenge der Tracks anhand der Spotify Track-ID
FR13: Das System dedupliziert Tracks aus mehreren Quell-Playlisten (jeder Track erscheint maximal einmal)
FR14: Nutzer kann der neuen Playlist einen Namen geben
FR15: Das System zeigt einen Confirmation-Dialog mit Auswahl-Zusammenfassung vor der Erstellung
FR16: Das System erstellt eine neue Playlist im Spotify-Konto des Nutzers mit den Tracks der Differenzmenge
FR17: Das System warnt und blockiert die Erstellung, wenn die Differenzmenge leer ist
FR18: Das System blockiert die Erstellung, wenn keine Quell-Playlisten ausgewählt sind
FR19: Das System zeigt einen Fortschrittsbalken während Track-Ladeoperationen und Playlist-Erstellung
FR20: Das System erkennt hängende API-Calls nach 10 Sekunden und zeigt eine Fehlermeldung
FR21: Das System zeigt eine Erfolgsmeldung nach erfolgreicher Playlist-Erstellung
FR22: Das System zeigt verständliche Fehlermeldungen bei API-Fehlern mit konkreten Handlungsempfehlungen

### NonFunctional Requirements

NFR1 (Performance): Playlisten-Liste lädt innerhalb von 3 Sekunden nach erfolgreichem Login
NFR2 (Performance): Track-Ladeoperationen verwenden parallele API-Calls (kein sequentielles Abarbeiten)
NFR3 (Performance): API-Call-Timeout: 10 Sekunden; danach Fehlermeldung
NFR4 (Performance): UI bleibt während laufender API-Operationen responsiv
NFR5 (Sicherheit): Spotify Access Token wird ausschließlich in localStorage/sessionStorage gespeichert — keine Übertragung an Dritte
NFR6 (Sicherheit): Keine Nutzer-Credentials werden gespeichert — ausschließlich OAuth 2.0 PKCE
NFR7 (Sicherheit): HTTPS-only Deployment
NFR8 (Sicherheit): Keine serverseitige Komponente
NFR9 (Accessibility): Alle interaktiven Elemente per Tastatur erreichbar
NFR10 (Accessibility): WCAG AA Farbkontraste (min. 4.5:1 für Text)
NFR11 (Accessibility): ARIA-Attribute für Fehlermeldungen und Statusmeldungen
NFR12 (Accessibility): Semantisches HTML ohne Bedeutungsverlust bei deaktiviertem CSS
NFR13 (Integration): Spotify Web API Pagination vollständig unterstützt (max. 100 Items pro Call)
NFR14 (Integration): OAuth 2.0 PKCE-Flow gemäß Spotify Developer Guidelines implementiert
NFR15 (Integration): Graceful Degradation bei Spotify API-Ausfällen — keine stummen Fehler

### Additional Requirements

- Starter-Template: shadcn/ui CLI — `yarn dlx shadcn@latest init -t vite` (ergibt Vite + React + TypeScript + Tailwind CSS + shadcn/ui + Pfad-Aliase)
- Testing: Vitest v4.1 manuell ergänzen — `yarn add -D vitest @testing-library/react @testing-library/jest-dom jsdom`
- shadcn/ui Komponenten installieren: `yarn dlx shadcn@latest add checkbox dialog progress input button badge separator`
- Deployment: GitHub Pages via GitHub Actions — Push auf `main` → `vite build` → `gh-pages`-Branch
- Vite Env Variables: `VITE_SPOTIFY_CLIENT_ID` und `VITE_SPOTIFY_REDIRECT_URI` in `.env.local`; unterschiedliche Werte lokal vs. Production; GitHub Actions Repository Secrets
- GitHub Actions Workflow-Datei: `.github/workflows/deploy.yml`
- Framer Motion für Layout-Transformation Auswahl → Erstellungs-Phase (`AnimatePresence`)
- `vite.config.ts` mit `base: '/playlist-cutter/'` für GitHub Pages Subpath
- State Management: React Context + useReducer — keine externe State-Library
- Eigene PKCE-Implementierung (~100–150 Zeilen) — keine externe OAuth-Library

### UX Design Requirements

UX-DR1: Equal-Split Zwei-Spalten-Layout — zwei gleiche Spalten (Quellen | Ausschlüsse) mit Toolbar oberhalb; Breakpoint `md` (768px) — auf Mobile einspaltig gestapelt (Quellen → Ausschlüsse → sticky Toolbar unten)
UX-DR2: Farbkodierung — Sky `#0284C7` als Akzentfarbe für Quell-Spalte; gedämpftes Rose `#C9445A` als Akzentfarbe für Ausschluss-Spalte; Spalten-Tints `bg-sky-50/50` und `bg-rose-50/50` als subtile Hintergrundfarbe
UX-DR3: PlaylistRow-Komponente — Anatomie `[Checkbox] [Playlist-Name] [Track-Anzahl]`; States: default, hover, selected-source (Sky), selected-exclude (Rose); Checkbox-Pop-Animation (scale 0.82 → 1.12 → 1.0); Row-Highlight (linke Akzent-Border + Hintergrundfarbe weich per CSS Transition)
UX-DR4: ColumnHeader-Komponente — Anatomie `[Icon-Pill (+ oder −)] [Spalten-Titel] [Badge: "N ausgewählt"]`; Badge-Bounce-Animation wenn Zahl sich ändert; Icon-Pill: `+` auf Sky für Quellen, `−` auf Rose für Ausschlüsse
UX-DR5: Toolbar-Komponente — Anatomie `[Label] [Input: Playlist-Name] [Summary-Text] [Button: Erstellen]`; Button `disabled` wenn kein Name oder keine Quelle; Input fokussiert: Sky-Border; Summary live aktualisiert mit Track-Zähler; Button-Ripple bei Klick; Button-Hover: translateY -1px mit Schatten
UX-DR6: CreationPhase-Komponente — Vollbild-Zustand (ersetzt Zwei-Spalten-Layout); Anatomie: Titel, Subtitle (Playlist-Name), Progress-Bar (Sky-Akzent), Schritt-Liste (4 Schritte: done/active/pending); aktiver Schritt mit Puls-Dot; Progress-Bar fließend animiert
UX-DR7: SuccessScreen-Komponente — Anatomie: Check-Icon (Sky-Kreis), Titel, Track-Anzahl, Playlist-Card mit "In Spotify öffnen"-Button (Spotify-Grün `#1DB954`), "Neue Playlist erstellen"-Button
UX-DR8: ErrorState-Komponente — Anatomie: Warn-Icon, Titel, Fehlertext, "Nochmal versuchen", "Zurück zur Auswahl"; zwei Varianten: Timeout-Fehler vs. API-Fehler (unterschiedliche Texte, gleiche Struktur)
UX-DR9: EmptyState-Komponente — für Nutzer ohne Playlisten nach Login: Hinweis + Link zu Spotify
UX-DR10: Skeleton-Rows-Lade-Zustand — Shimmer-Animation als Platzhalter in beiden Spalten während Playlisten-Laden; kein abrupter Wechsel von leer zu Inhalt
UX-DR11: Confirmation-Dialog — shadcn/ui `Dialog`; Inhalt: X Quellen, Y Ausschlüsse, ~Z Tracks, Playlist-Name; Escape/Außenklick = Abbrechen; auf Mobile: shadcn/ui `Drawer` als Bottom Sheet
UX-DR12: Button-Hierarchie — Primary (Sky ausgefüllt, Icon links): Erstellen, Login; Secondary (Outline, neutral): Abbrechen, Zurück; Destructive-Neutral (Textlink, grau): Logout; External (Spotify-Grün): "In Spotify öffnen"
UX-DR13: Responsive Layout-Pattern — `grid grid-cols-1 md:grid-cols-2` für Spalten; Toolbar: Desktop oberhalb (static), Mobile sticky footer (`sticky bottom-0`); alle Features vollständig auf Mobile nutzbar
UX-DR14: Micro-Animations — Checkbox-Pop (scale), Row-Highlight (CSS Transition), Badge-Bounce (JS), Button-Ripple (Klick), Button-Hover (translateY -1px); alle Animationen blockieren nie Interaktionen
UX-DR15: Typografie-System — Plus Jakarta Sans via Fontsource; Typ-Skala: App-Name `text-4xl font-bold`, Spalten-Titel `text-lg font-semibold`, Playlist-Namen `text-base font-medium`, Labels `text-xs text-secondary`
UX-DR16: Phasen-Wechsel durch Layout-Transformation — Framer Motion `AnimatePresence` für Übergang Auswahl → Erstellungs-Phase; keine URL-Änderung, kein Tab-Wechsel; alle Phasen (Login, Auswahl, Bestätigung, Erstellung, Erfolg, Fehler) visuell eindeutig

### FR Coverage Map

FR1: Epic 1 — Nutzer kann sich über Spotify OAuth 2.0 PKCE anmelden
FR2: Epic 1 — Nutzer kann sich abmelden (Logout)
FR3: Epic 1 — Session-Persistenz via localStorage über Seitenneuladen hinweg
FR4: Epic 1 — Token-Ablauf-Erkennung mit Meldung und 1-Klick Re-Login
FR5: Epic 2 — Playlisten laden und im Zwei-Spalten-Layout anzeigen
FR6: Epic 2 — Quell-Playlisten per Checkbox auswählen
FR7: Epic 2 — Ausschluss-Playlisten per Checkbox auswählen
FR8: Epic 2 — Empty State für Nutzer ohne Playlisten
FR9: Epic 2 — Duplikat-Warnung (gleiche Playlist in Quellen + Ausschlüssen)
FR10: Epic 3 — Tracks aller Quell-Playlisten laden (parallel, mit Pagination)
FR11: Epic 3 — Tracks aller Ausschluss-Playlisten laden (parallel, mit Pagination)
FR12: Epic 3 — Differenzmenge berechnen anhand Spotify Track-ID
FR13: Epic 3 — Deduplizierung über mehrere Quell-Playlisten hinweg
FR14: Epic 2 — Playlist-Name eingeben (Toolbar-Input)
FR15: Epic 2 — Confirmation-Dialog mit Auswahl-Zusammenfassung vor der Erstellung
FR16: Epic 3 — Neue Playlist im Spotify-Konto erstellen mit Tracks der Differenzmenge
FR17: Epic 2 — Warnung + Blockierung wenn Differenzmenge leer wäre
FR18: Epic 2 — Blockierung wenn keine Quell-Playlisten ausgewählt sind
FR19: Epic 3 — Fortschrittsbalken während Track-Loading und Playlist-Erstellung
FR20: Epic 3 — 10-Sekunden-Timeout-Erkennung mit Fehlermeldung und Retry-Option
FR21: Epic 3 — Erfolgsmeldung nach erfolgreicher Playlist-Erstellung mit Spotify-Link
FR22: Epic 3 — Verständliche Fehlermeldungen mit konkreten Handlungsempfehlungen

## Epic List

### Epic 1: Projekt-Setup & Authentifizierung
Der Nutzer kann die App aufrufen, sich mit seinem Spotify-Konto anmelden und abmelden. Die Session bleibt nach Seitenneuladen erhalten — die Basis für alle weiteren Epics.
**FRs abgedeckt:** FR1, FR2, FR3, FR4

### Epic 2: Playlist-Auswahl-Interface
Der Nutzer kann seine Playlisten im Zwei-Spalten-Layout einsehen, Quell- und Ausschluss-Playlisten auswählen, der neuen Playlist einen Namen geben und den Diff konfigurieren und bestätigen.
**FRs abgedeckt:** FR5, FR6, FR7, FR8, FR9, FR14, FR15, FR17, FR18

### Epic 3: Diff-Berechnung & Playlist-Erstellung
Der Nutzer kann die konfigurierte Diff-Operation ausführen — Tracks werden geladen, die Differenzmenge berechnet und eine neue Spotify-Playlist erstellt. Fortschritt, Erfolg und Fehler werden klar kommuniziert.
**FRs abgedeckt:** FR10, FR11, FR12, FR13, FR16, FR19, FR20, FR21, FR22

### Epic 4: Deployment & Produktionsreife
Die App ist produktionsreif — deploybar via GitHub Pages, vollständig responsiv auf Mobile und mit Framer Motion Layout-Übergängen finalisiert.
**FRs abgedeckt:** (keine neuen FRs — NFRs und technische Architektur-Anforderungen)

---

## Epic 1: Projekt-Setup & Authentifizierung

Der Nutzer kann die App aufrufen, sich mit seinem Spotify-Konto anmelden und abmelden. Die Session bleibt nach Seitenneuladen erhalten — die Basis für alle weiteren Epics.

### Story 1.1: Projekt-Setup mit shadcn/ui CLI und Vitest

Als Entwickler
möchte ich ein vollständig konfiguriertes Projekt-Grundgerüst,
damit ich sofort mit der Feature-Entwicklung beginnen kann ohne manuelle Konfigurationsarbeit.

**Acceptance Criteria:**

**Given** ein leeres Verzeichnis mit Node.js und yarn
**When** die Initialisierungskommandos ausgeführt werden (`yarn dlx shadcn@latest init -t vite`, Vitest hinzufügen, shadcn/ui-Komponenten installieren)
**Then** läuft `yarn dev` ohne Fehler auf `localhost:5173`
**And** `yarn test` (Vitest) läuft erfolgreich durch
**And** Tailwind CSS v4.2, React, TypeScript, shadcn/ui und Pfad-Alias `@/` sind korrekt konfiguriert
**And** shadcn/ui-Komponenten `checkbox`, `dialog`, `progress`, `input`, `button`, `badge`, `separator` sind installiert
**And** `.env.local` mit `VITE_SPOTIFY_CLIENT_ID` und `VITE_SPOTIFY_REDIRECT_URI` ist vorhanden (mit Beispielwerten)
**And** `.env.example` ist als Template committed (ohne echte Secrets)
**And** Projektstruktur entspricht exakt dem Architecture-Dokument (`src/components/`, `src/hooks/`, `src/lib/`, `src/context/`, `src/types/`)
**And** Plus Jakarta Sans ist via Fontsource installiert und als Standard-Font konfiguriert

### Story 1.2: Spotify OAuth PKCE Login (FR1)

Als Spotify-Nutzer
möchte ich mich über einen "Mit Spotify anmelden"-Button authentifizieren,
damit ich Zugriff auf meine Playlisten erhalte ohne mein Passwort an die App weiterzugeben.

**Acceptance Criteria:**

**Given** der Nutzer öffnet die App und ist nicht eingeloggt
**When** die App lädt
**Then** wird der `LoginScreen` angezeigt mit App-Name in Plus Jakarta Sans und einem primären "Mit Spotify anmelden"-Button (Sky `#0284C7`)

**Given** der Nutzer klickt "Mit Spotify anmelden"
**When** der OAuth-Flow startet
**Then** wird ein PKCE Code Verifier und Code Challenge generiert (`auth.ts`)
**And** der Nutzer wird zu Spotify weitergeleitet mit korrekten Scopes (`playlist-read-private`, `playlist-modify-public`, `playlist-modify-private`)

**Given** der Nutzer hat Spotify-Berechtigungen erteilt
**When** Spotify zum Redirect URI zurückleitet (mit Authorization Code)
**Then** tauscht die App den Authorization Code gegen einen Access Token (`auth.ts`)
**And** der Token wird in localStorage gespeichert
**And** der App-State wechselt zu Phase `authenticated`

**Given** der OAuth-Flow schlägt fehl oder wird vom Nutzer abgebrochen
**When** der Redirect zurückkommt ohne gültigen Code
**Then** bleibt der Nutzer auf dem `LoginScreen` ohne Fehlerzustand

### Story 1.3: Session-Persistenz, Logout & AppHeader (FR2, FR3)

Als Nutzer der die Seite neu lädt
möchte ich nicht erneut durch den OAuth-Flow geführt werden,
damit meine Sitzung nahtlos weiterläuft.

**Acceptance Criteria:**

**Given** ein Nutzer hat sich erfolgreich angemeldet und der Token ist in localStorage gespeichert
**When** der Nutzer die Seite neu lädt
**Then** erkennt die App den gültigen Token beim Start
**And** der LoginScreen wird übersprungen — die App wechselt direkt zu Phase `authenticated`

**Given** der Nutzer ist angemeldet
**When** die App die authenticated Phase anzeigt
**Then** ist der `AppHeader` sichtbar mit App-Name links und User-Info (Spotify-Displayname) + Logout-Button rechts

**Given** der Nutzer klickt den Logout-Button (Tür/Exit-Icon, Textlink-Stil in Grau)
**When** Logout ausgelöst wird
**Then** wird der Token aus localStorage gelöscht
**And** der App-State wechselt zurück zu Phase `login`
**And** der `LoginScreen` wird angezeigt

### Story 1.4: Token-Ablauf-Erkennung & Re-Login-Flow (FR4)

Als Nutzer mit einer abgelaufenen Spotify-Sitzung
möchte ich eine klare Meldung mit einem einfachen Re-Login-Link erhalten,
damit ich schnell weiterarbeiten kann ohne zu verstehen was technisch passiert ist.

**Acceptance Criteria:**

**Given** der Nutzer führt eine API-Operation durch
**When** die Spotify API mit 401 antwortet
**Then** wird der Token aus localStorage entfernt
**And** eine verständliche Meldung erscheint: "Deine Sitzung ist abgelaufen — bitte melde dich erneut an"
**And** ein primärer "Erneut anmelden"-Button ist sichtbar (Sky, kein Logout-Confirmation-Dialog)

**Given** der Nutzer klickt "Erneut anmelden"
**When** der Re-Login-Flow startet
**Then** wird der OAuth PKCE Flow neu gestartet (wie Story 1.2)
**And** kein technischer Fehlercode ist im primären Text sichtbar

---

## Epic 2: Playlist-Auswahl-Interface

Der Nutzer kann seine Playlisten im Zwei-Spalten-Layout einsehen, Quell- und Ausschluss-Playlisten auswählen, der neuen Playlist einen Namen geben und den Diff konfigurieren und bestätigen.

### Story 2.1: Playlisten laden und Zwei-Spalten-Layout (FR5, FR8)

Als angemeldeter Nutzer
möchte ich meine Spotify-Playlisten im Zwei-Spalten-Layout sehen,
damit ich sofort verstehe, welche ich als Quellen und welche als Ausschlüsse wählen kann.

**Acceptance Criteria:**

**Given** der Nutzer ist erfolgreich angemeldet (Phase `authenticated`)
**When** die App die Playlisten-Ansicht lädt
**Then** werden in beiden Spalten Skeleton-Rows mit Shimmer-Animation als Lade-Platzhalter angezeigt

**Given** die Playlisten-Daten wurden von der Spotify API geladen (`spotifyApi.getPlaylists()`)
**When** die Daten verfügbar sind
**Then** erscheinen die Playlisten in beiden Spalten als `PlaylistRow`-Einträge (Name + Track-Anzahl)
**And** die linke Spalte trägt den Header "Quellen" mit `+`-Icon-Pill in Sky
**And** die rechte Spalte trägt den Header "Ausschlüsse" mit `−`-Icon-Pill in Rose
**And** das Layout ist zweispaltig auf ≥768px und einspaltig auf <768px (`md:grid-cols-2`)

**Given** der Nutzer hat keine Playlisten in seinem Spotify-Konto
**When** die leere Playlisten-Liste geladen wird
**Then** wird die `EmptyState`-Komponente angezeigt mit erklärendem Text und Link zu Spotify
**And** kein leeres Zwei-Spalten-Layout ist sichtbar

**Given** die Playlisten sind angezeigt
**When** der Nutzer die Ladezeit misst
**Then** ist die Ladezeit unter 3 Sekunden nach erfolgtem Login (NFR1)

### Story 2.2: Playlist-Auswahl mit Farbkodierung und Animationen (FR6, FR7, FR9)

Als Nutzer
möchte ich Playlisten per Checkbox als Quellen oder Ausschlüsse markieren,
damit ich visuell klar zwischen den beiden Rollen unterscheiden kann.

**Acceptance Criteria:**

**Given** der Nutzer klickt auf eine Playlist-Zeile in der Quell-Spalte
**When** die Auswahl togglet
**Then** wechselt die Checkbox in den ausgewählten Zustand mit Pop-Animation (scale 0.82 → 1.12 → 1.0)
**And** der Zeilenhintergrund wechselt weich zu Sky-Tint mit linker Sky-Akzent-Border (CSS Transition)
**And** der Ausgewählt-Zähler im `ColumnHeader`-Badge springt mit Bounce-Animation hoch

**Given** der Nutzer klickt auf eine Playlist-Zeile in der Ausschluss-Spalte
**When** die Auswahl togglet
**Then** wechselt die Darstellung analog zu Rose-Tint und Rose-Border

**Given** eine Playlist ist in der Quell-Spalte ausgewählt
**When** der Nutzer dieselbe Playlist auch in der Ausschluss-Spalte auswählt
**Then** erscheint ein nicht-blockierender Hinweis: "Diese Playlist ist sowohl als Quelle als auch als Ausschluss gewählt"
**And** beide Auswahlen bleiben erhalten — kein automatisches Entfernen

**Given** Playlisten sind ausgewählt
**When** der Nutzer weitere Playlisten auswählt
**Then** bleibt die Reihenfolge der Liste unverändert (kein Umsortieren bei Auswahl)

**Given** alle interaktiven Elemente
**When** der Nutzer per Tastatur navigiert
**Then** sind alle `PlaylistRow`-Elemente per Tab erreichbar und per Space togglebar (`aria-checked` korrekt gesetzt)

### Story 2.3: Toolbar mit Playlist-Name, Live-Summary & Erstellen-Button (FR14, FR17, FR18)

Als Nutzer
möchte ich der neuen Playlist einen Namen geben und sehen wie viele Tracks im Diff wären,
damit ich vor dem Erstellen informiert entscheiden kann.

**Acceptance Criteria:**

**Given** die Haupt-Ansicht ist aktiv
**When** der Nutzer die `Toolbar` sieht
**Then** ist ein Playlist-Name-Input-Feld sichtbar (shadcn/ui `Input`, bei Fokus Sky-Border)
**And** eine Live-Summary-Zeile zeigt die aktuelle Auswahl (z.B. "3 Quellen · 1 Ausschluss · ~42 Tracks")
**And** ein "Erstellen"-Button mit `+`-Icon ist sichtbar

**Given** keine Quell-Playlisten ausgewählt sind ODER kein Playlist-Name eingegeben wurde
**When** der Nutzer den "Erstellen"-Button sieht
**Then** ist der Button `disabled` (`opacity-50`, `cursor-not-allowed`)
**And** kein Tooltip oder Fehlermeldungs-Modal erscheint

**Given** die Auswahl würde 0 Tracks ergeben
**When** der Live-Zähler aktualisiert wird
**Then** zeigt die Summary-Zeile eine Warnung: "0 Tracks — alle Tracks würden ausgeschlossen" (FR17)

**Given** mindestens eine Quelle und ein Name sind eingegeben
**When** der Nutzer auf "Erstellen" klickt
**Then** gibt der Button einen Welleneffekt (Button-Ripple)
**And** beim Hover bewegt sich der Button um -1px nach oben mit leichtem Schatten

### Story 2.4: Confirmation-Dialog vor der Erstellung (FR15)

Als Nutzer
möchte ich vor dem Erstellen eine Zusammenfassung meiner Auswahl sehen und bestätigen,
damit ich sicher sein kann, dass die richtige Konfiguration ausgeführt wird.

**Acceptance Criteria:**

**Given** der "Erstellen"-Button ist aktiv (Name vorhanden + min. 1 Quelle)
**When** der Nutzer auf "Erstellen" klickt
**Then** öffnet sich der `ConfirmDialog` mit der Auswahl-Zusammenfassung (Anzahl Quellen, Anzahl Ausschlüsse, geschätzte Track-Anzahl, Playlist-Name)

**Given** der `ConfirmDialog` ist geöffnet
**When** der Nutzer auf "Erstellen" klickt (Primary-Button im Dialog)
**Then** schließt der Dialog und die App wechselt zu Phase `creating`
**And** ein Lade-Platzhalter-Screen ist sichtbar mit dem Playlist-Namen als Titel und dem Text "Erstelle Playlist…" sowie einem indeterminierten Ladeindikator (Spinner oder Skeleton)
**And** alle Auswahl-Interaktionen sind deaktiviert (kein zurück zur Auswahl ohne expliziten Abbruch)
**And** die volle CreationPhase-Implementierung mit 4-Schritt-Fortschrittsbalken folgt in Story 3.3

**Given** der `ConfirmDialog` ist geöffnet
**When** der Nutzer auf "Abbrechen" klickt, Escape drückt oder außerhalb des Dialogs klickt
**Then** schließt der Dialog ohne Datenverlust — alle Auswahlen und der Playlist-Name bleiben erhalten

**Given** der Nutzer befindet sich auf Mobile
**When** der "Erstellen"-Button geklickt wird
**Then** erscheint der Dialog als Bottom Sheet (shadcn/ui `Drawer`) statt als zentrierter Modal

---

## Epic 3: Diff-Berechnung & Playlist-Erstellung

Der Nutzer kann die konfigurierte Diff-Operation ausführen — Tracks werden geladen, die Differenzmenge berechnet und eine neue Spotify-Playlist erstellt. Fortschritt, Erfolg und Fehler werden klar kommuniziert.

### Story 3.1: Track-Loading mit Pagination und Parallelität (FR10, FR11, FR13)

Als System
möchte ich alle Tracks der ausgewählten Quell- und Ausschluss-Playlisten effizient laden,
damit die Diff-Berechnung korrekte und vollständige Daten erhält.

**Acceptance Criteria:**

**Given** der Nutzer hat Quell- und/oder Ausschluss-Playlisten ausgewählt und "Erstellen" bestätigt
**When** der Track-Loading-Prozess startet
**Then** ruft `spotifyApi.getPlaylistTracks()` die Tracks aller ausgewählten Playlisten ab
**And** die Spotify API Pagination wird vollständig durchlaufen (max. 100 Items/Call, iteriert bis `next === null`)
**And** alle Playlisten werden parallel geladen via `concurrency.ts` (max. 5 gleichzeitige Requests)

**Given** mehrere Quell-Playlisten denselben Track enthalten
**When** die Tracks zusammengeführt werden
**Then** erscheint jeder Track-ID maximal einmal im Quell-Set (Deduplizierung in `diffEngine.ts`)

**Given** die Spotify API liefert einen Fehler während des Track-Loadings
**When** ein Request fehlschlägt
**Then** wird der gesamte Erstellungs-Prozess abgebrochen (kein stummer partieller Erfolg)
**And** der Fehler wird an das Error-Handling weitergegeben (Story 3.4)

### Story 3.2: Diff-Engine und Playlist-Erstellung (FR12, FR16)

Als Nutzer
möchte ich dass eine neue Spotify-Playlist mit exakt den Tracks erstellt wird, die in den Quellen sind aber nicht in den Ausschlüssen,
damit ich ein präzises, duplikatfreies Ergebnis erhalte.

**Acceptance Criteria:**

**Given** alle Track-Daten wurden geladen
**When** `diffEngine.calculateDiff()` ausgeführt wird
**Then** enthält das Ergebnis alle Track-IDs aus den Quell-Playlisten, die nicht in den Ausschluss-Playlisten vorkommen
**And** die Diff-Funktion ist eine reine Funktion ohne React-State oder API-Abhängigkeiten (testbar isoliert)

**Given** die Differenzmenge berechnet wurde
**When** `spotifyApi.createPlaylist()` aufgerufen wird
**Then** wird eine neue Playlist im Spotify-Konto des Nutzers mit dem eingegebenen Namen angelegt
**And** danach fügt `spotifyApi.addTracksToPlaylist()` alle Tracks der Differenzmenge hinzu (in 100er-Batches gemäß Spotify-Limit)

**Given** eine Unit-Test-Suite für `diffEngine.ts`
**When** die Tests ausgeführt werden
**Then** sind folgende Cases abgedeckt: leere Quellen, leere Ausschlüsse, vollständige Überschneidung, partielle Überschneidung, Deduplizierung über mehrere Quellen

### Story 3.3: CreationPhase mit Fortschrittsbalken (FR19, FR20)

Als Nutzer der auf die Erstellung wartet
möchte ich einen klaren Fortschrittsbalken mit 4 expliziten Schritten sehen,
damit ich jederzeit weiß was gerade passiert und nicht in einem eingefrorenen UI-Zustand hänge.

**Acceptance Criteria:**

**Given** der Nutzer hat "Erstellen" im Confirmation-Dialog bestätigt
**When** die App zu Phase `creating` wechselt
**Then** ersetzt die `CreationPhase`-Komponente das Zwei-Spalten-Layout vollständig
**And** der Playlist-Name wird als Subtitle angezeigt
**And** vier Schritte sind sichtbar: "Tracks laden", "Differenz berechnen", "Playlist anlegen", "Tracks hinzufügen"
**And** der aktive Schritt ist mit einem Puls-Dot markiert; abgeschlossene Schritte mit einem Check-Icon

**Given** die Erstellung läuft
**When** jeder Schritt abgeschlossen wird
**Then** aktualisiert sich der Fortschrittsbalken (Sky-Akzent) fließend auf den nächsten Wert
**And** die UI bleibt responsiv — kein eingefrorener Zustand (NFR4)

**Given** ein API-Call läuft länger als 10 Sekunden ohne Antwort
**When** der Timeout ausgelöst wird
**Then** stoppt der Prozess und zeigt eine Timeout-Fehlermeldung mit Retry-Option (FR20)
**And** kein automatischer Retry — der Nutzer entscheidet

### Story 3.4: SuccessScreen, ErrorState & Post-Erfolg Reset (FR21, FR22)

Als Nutzer nach abgeschlossener Erstellung
möchte ich eine eindeutige Erfolgs- oder Fehlermeldung mit klarer nächster Handlung sehen,
damit ich weiß ob meine Playlist erstellt wurde und wie ich weiterarbeiten kann.

**Acceptance Criteria:**

**Given** die Playlist-Erstellung war erfolgreich
**When** die App zu Phase `success` wechselt
**Then** zeigt der `SuccessScreen` einen Check-Icon in Sky-Kreis, den Playlist-Namen, die Anzahl der hinzugefügten Tracks und einen "In Spotify öffnen"-Button (Spotify-Grün `#1DB954`)

**Given** der Nutzer klickt "In Spotify öffnen"
**When** der Link ausgelöst wird
**Then** öffnet sich die neu erstellte Playlist in Spotify (direkter Link zur Playlist-URL)

**Given** der Nutzer klickt "Neue Playlist erstellen"
**When** der Reset-Flow ausgelöst wird
**Then** wechselt die App zurück zu Phase `selection`
**And** alle Checkboxen sind zurückgesetzt und das Playlist-Name-Feld ist geleert

**Given** ein API-Fehler ist aufgetreten (non-401, non-Timeout)
**When** die App zu Phase `error` wechselt
**Then** zeigt der `ErrorState` ein Warn-Icon, einen nutzerfreundlichen Fehlertext auf Deutsch und zwei Buttons: "Nochmal versuchen" + "Zurück zur Auswahl"
**And** kein technischer Fehlercode oder Stack Trace ist im primären Text sichtbar

**Given** der Fehler ist ein 401 (Token abgelaufen) während der Erstellung
**When** der 401-Fehler erkannt wird
**Then** greift Story 1.4 (Token-Ablauf Re-Login) — kein generischer ErrorState

---

## Epic 4: Deployment & Produktionsreife

Die App ist produktionsreif — deploybar via GitHub Pages, vollständig responsiv auf Mobile und mit Framer Motion Layout-Übergängen finalisiert.

### Story 4.1: GitHub Actions CI/CD Pipeline & GitHub Pages Deployment

Als Entwickler
möchte ich dass die App bei jedem Push auf `main` automatisch gebaut und auf GitHub Pages deployed wird,
damit die Live-Version immer aktuell ist ohne manuellen Deploy-Aufwand.

**Acceptance Criteria:**

**Given** Code wird auf den `main`-Branch gepusht
**When** der GitHub Actions Workflow ausgelöst wird
**Then** führt `.github/workflows/deploy.yml` `yarn build` aus
**And** das `dist/`-Verzeichnis wird auf den `gh-pages`-Branch deployed
**And** die App ist unter der GitHub Pages URL erreichbar (HTTPS, NFR7)

**Given** `VITE_SPOTIFY_CLIENT_ID` und `VITE_SPOTIFY_REDIRECT_URI` als GitHub Actions Repository Secrets hinterlegt sind
**When** der Build läuft
**Then** werden die Env Variables korrekt in den Vite-Build injiziert
**And** keine Secrets sind im Build-Output oder im `gh-pages`-Branch sichtbar

**Given** `vite.config.ts`
**When** der Production Build erstellt wird
**Then** ist `base: '/playlist-cutter/'` konfiguriert, sodass Assets auf dem GitHub Pages Subpath korrekt geladen werden

**Given** ein Entwickler klont das Repository neu
**When** er `.env.example` liest
**Then** versteht er welche Env Variables benötigt werden und mit welchen Werten

### Story 4.2: Framer Motion Phasen-Übergänge & Mobile-Layout finalisieren

Als Nutzer
möchte ich fließende Übergänge zwischen den App-Phasen und ein vollständig nutzbares Mobile-Layout,
damit die App sich durchdacht und poliert anfühlt auf allen Geräten.

**Acceptance Criteria:**

**Given** der Nutzer bestätigt "Erstellen" im Confirmation-Dialog
**When** die App von Phase `selection` zu `creating` wechselt
**Then** animiert Framer Motion `AnimatePresence` das Zwei-Spalten-Layout heraus und die `CreationPhase` herein
**And** die Animation blockiert keine Interaktionen und läuft parallel zur Funktionsausführung

**Given** der Nutzer befindet sich auf einem Gerät mit Viewport < 768px
**When** er die App öffnet
**Then** sind Quellen-Spalte und Ausschlüsse-Spalte vertikal gestapelt (Quellen oben, Ausschlüsse darunter)
**And** die Toolbar ist als `sticky bottom-0` Footer fixiert (Mobile) statt oberhalb (Desktop)
**And** alle Features sind vollständig nutzbar — kein Funktionsverlust gegenüber Desktop

**Given** der Nutzer auf Mobile den "Erstellen"-Button klickt
**When** der Confirmation-Dialog öffnet
**Then** erscheint er als Bottom Sheet (`shadcn/ui Drawer`) — ergonomisch mit dem Daumen erreichbar

### Story 4.3: Accessibility-Audit & WCAG AA Compliance

Als Nutzer der Tastatur oder Screenreader verwendet
möchte ich die App vollständig ohne Maus bedienen können,
damit Playlist Cutter für alle zugänglich ist.

**Acceptance Criteria:**

**Given** alle interaktiven Elemente der App
**When** der Nutzer ausschließlich per Tastatur navigiert
**Then** ist jedes Element per Tab erreichbar und per Enter/Space bedienbar
**And** der Fokus-Ring ist zu jedem Zeitpunkt sichtbar (shadcn/ui Radix Focus-States)
**And** die Tab-Reihenfolge ist logisch und entspricht dem visuellen Layout

**Given** alle Text/Hintergrund-Kombinationen der App
**When** ein Kontrast-Audit durchgeführt wird
**Then** erreichen alle Text-Elemente mindestens 4.5:1 Kontrast (WCAG AA)
**And** dekorative Elemente (Spalten-Tints, Icons als Dekoration) sind von der Anforderung ausgenommen

**Given** Fehlermeldungen und Statusmeldungen (`ErrorState`, `SuccessScreen`, Duplikat-Warnung)
**When** ein Screenreader die Seite liest
**Then** sind alle Statusmeldungen mit korrekten ARIA-Attributen versehen (`role="alert"` oder `aria-live`)
**And** semantisches HTML ist durchgängig verwendet — keine bedeutungslosen `div`-Nester wo Header, Main, Section passt
