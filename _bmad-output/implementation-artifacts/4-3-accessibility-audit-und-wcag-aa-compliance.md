# Story 4.3: Accessibility-Audit & WCAG AA Compliance

**Status: done**

## Story

Als Nutzer der Tastatur oder Screenreader verwendet
möchte ich die App vollständig ohne Maus bedienen können,
damit Playlist Cutter für alle zugänglich ist.

## Acceptance Criteria

1. **Given** alle interaktiven Elemente der App
   **When** der Nutzer ausschließlich per Tastatur navigiert
   **Then** ist jedes Element per Tab erreichbar und per Enter/Space bedienbar
   **And** der Fokus-Ring ist zu jedem Zeitpunkt sichtbar (shadcn/ui Radix Focus-States)
   **And** die Tab-Reihenfolge ist logisch und entspricht dem visuellen Layout

2. **Given** alle Text/Hintergrund-Kombinationen der App
   **When** ein Kontrast-Audit durchgeführt wird
   **Then** erreichen alle Text-Elemente mindestens 4.5:1 Kontrast (WCAG AA)
   **And** dekorative Elemente (Spalten-Tints, Icons als Dekoration) sind von der Anforderung ausgenommen

3. **Given** Fehlermeldungen und Statusmeldungen (`ErrorState`, `SuccessScreen`, Duplikat-Warnung)
   **When** ein Screenreader die Seite liest
   **Then** sind alle Statusmeldungen mit korrekten ARIA-Attributen versehen (`role="alert"` oder `aria-live`)
   **And** semantisches HTML ist durchgängig verwendet — keine bedeutungslosen `div`-Nester wo Header, Main, Section passt

## Aktueller Implementierungsstand — KRITISCH LESEN!

### Was bereits korrekt implementiert ist (NICHT anfassen!)

| Komponente | Bereits korrekt |
|------------|----------------|
| `PlaylistRow.tsx` | `role="checkbox"`, `aria-checked`, `aria-label={name}`, `tabIndex={0}`, `onKeyDown` (Space/Enter) ✓ |
| `CreationPhase.tsx` | `aria-live="polite"` auf `<main>`, `<ol>`/`<li>` für Steps ✓ |
| `SuccessScreen.tsx` | `role="alert"` auf `<main>` ✓ |
| `ErrorState.tsx` | `role="alert"` auf `<main>` ✓ |
| `AppHeader.tsx` | Semantisches `<header>` Element ✓ |
| `Toolbar.tsx` | `<label htmlFor="playlist-name">` mit `id` auf Input korrekt verbunden ✓, `focus-visible:ring-sky-500` auf Input ✓ |
| `ConfirmDialog.tsx` | shadcn Dialog/Drawer handeln ARIA intern (Focus-Trap, DialogTitle, DialogDescription) ✓ |

### Was implementiert werden muss

**AC1 — Fokus & Keyboard Navigation:**
- `LoginScreen.tsx`: Fehlendes `<main>`-Landmark und `aria-label` auf Spotify-Login-Button (Button hat Icon + Text, muss für SR klar sein)
- `PlaylistRow.tsx`: Fehlender sichtbarer Fokus-Ring (hat `tabIndex={0}` und Keyboard-Handler, aber kein `focus-visible:ring-*` Styling)
- `CreationPhase.tsx`: Fehlendes `aria-current="step"` auf aktivem Step in der Step-Liste
- `AppHeader.tsx`: Logout-Button prüfen — falls kein `aria-label` vorhanden, ergänzen

**AC2 — Kontrast:**
- Kontrastprüfung der verwendeten Tailwind-Farben für alle Text/Hintergrund-Kombinationen
- Primär betroffen: `text-muted-foreground`, `text-slate-400`, Spalten-Tint-Farben (als dekorativ klassifizieren)
- Tailwind CSS v4 — Farben in `src/index.css` definiert (CSS Custom Properties)

**AC3 — ARIA & Semantik:**
- `LoginScreen.tsx`: Fehlendes `<main>`-Element (div-Wrapper statt semantic main)
- `Toolbar.tsx`: Fehlender `aria-label` auf "Erstellen"-Button (Text ist "Erstellen" + Icon, aber kein aria-label)
- `CreationPhase.tsx`: Ping-Animation-Elemente (visuelle Indikatoren) fehlen `aria-hidden="true"`

## Tasks / Subtasks

- [x] Task 1: LoginScreen — semantisches HTML & ARIA (AC: 1, 3)
  - [x] Äußersten div-Container zu `<main>` umbenennen (oder `<main>` als Wrapper ergänzen)
  - [x] Spotify-Login-Button: prüfen ob `aria-label` benötigt wird (Button-Text reicht wenn klar)
  - [x] Fokus-Ring auf Button prüfen (shadcn Button hat standardmäßig `focus-visible:ring`)

- [x] Task 2: PlaylistRow — Fokus-Ring sichtbar machen (AC: 1)
  - [x] `focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none` zu PlaylistRow-div hinzufügen
  - [x] Prüfen ob `rounded-*` Klasse für Fokus-Ring-Form nötig

- [x] Task 3: CreationPhase — aria-current & aria-hidden (AC: 1, 3)
  - [x] `aria-current="step"` auf das aktive `<li>`-Element setzen (wenn Step-Status "active" ist)
  - [x] Ping-Animationselemente (`animate-ping`) mit `aria-hidden="true"` versehen

- [x] Task 4: AppHeader — Logout-Button prüfen (AC: 1)
  - [x] Logout-Button lesen: falls kein erklärender Text vorhanden → `aria-label="Abmelden"` hinzufügen
  - [x] Falls Text "Abmelden" bereits vorhanden → kein aria-label nötig (redundant)

- [x] Task 5: Toolbar — Erstellen-Button aria-label (AC: 1, 3)
  - [x] Prüfen ob "Erstellen"-Button nur Icon oder Icon+Text ist
  - [x] Falls Icon-only → `aria-label="Playlist erstellen"` hinzufügen
  - [x] Falls Text vorhanden → nur `aria-label` wenn Text nicht selbsterklärend ist

- [x] Task 6: Kontrast-Audit (AC: 2)
  - [x] `src/index.css` lesen — alle CSS Custom Properties für Farben identifizieren
  - [x] Für jede Text/Hintergrund-Kombination Kontrast mental prüfen oder dokumentieren
  - [x] `text-muted-foreground` auf dark/light background: typisch ≥ 4.5:1 in shadcn-Themes
  - [x] Falls Kontrast-Problem gefunden → Farb-Variable in `index.css` anpassen (NICHT in Komponenten)
  - [x] Dekorative Elemente in Story als "ausgenommen" dokumentieren (kein Code nötig)

- [x] Task 7: Tests schreiben (AC: 1, 3)
  - [x] Test: `LoginScreen` rendert ein `<main>`-Element
  - [x] Test: `PlaylistRow` hat `focus-visible`-Ring-Klasse (className-Check)
  - [x] Test: `CreationPhase` setzt `aria-current="step"` auf aktiven Step
  - [x] Test: Ping-Elemente in `CreationPhase` haben `aria-hidden="true"`
  - [x] **Bestehende Tests nicht brechen** — `yarn test:run` am Ende ausführen

## Dev Notes

### Tech-Stack für diese Story

| Tool/Library | Version | Zweck |
|---|---|---|
| shadcn/ui | latest | Radix UI Basis — ARIA intern korrekt |
| Radix UI | ^1.4.3 | Focus-Management in Dialogen ✓ |
| Tailwind CSS | v4.2 | Styling — `focus-visible:*` Utilities verfügbar |
| Vitest | v4.1 | Tests |

**Package Manager: Yarn** — kein `npm` verwenden.

### WCAG AA Referenz — was gilt, was nicht

| Anforderung | Gilt für | Ausgenommen |
|---|---|---|
| Kontrast 4.5:1 | Normaler Text (< 18px oder < 14px bold) | Dekorative Elemente, Logos, Icons ohne Text-Bedeutung |
| Kontrast 3:1 | Großer Text (≥ 18px oder ≥ 14px bold) | Dekorative Spalten-Tints, Hintergrundfarben |
| Keyboard-Navigation | Alle interaktiven Elemente | Nicht-interaktive visuelle Elemente |
| ARIA-Labels | Wenn Text fehlt oder unklar | Wenn sichtbarer Text ausreichend ist |

### Fokus-Ring Pattern (Tailwind v4)

Tailwind CSS v4 — `focus-visible:ring-*` Utilities sind verfügbar ohne tailwind.config.ts.

**Korrektes Pattern für custom Interactive Elements (wie PlaylistRow):**
```tsx
// PlaylistRow.tsx — div mit tabIndex
<div
  tabIndex={0}
  role="checkbox"
  aria-checked={selected}
  aria-label={name}
  onKeyDown={handleKeyDown}
  className="... focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none rounded-lg"
>
```

**Shadcn Button:** Fokus-Ring ist bereits eingebaut — NICHT manuell hinzufügen.
**Shadcn Input:** Hat `focus-visible:ring-sky-500` bereits in Toolbar.tsx — NICHT anfassen.

### Semantisches HTML — Pflicht-Landmarks

| Landmark | Komponente | Status |
|---|---|---|
| `<header>` | AppHeader | ✓ vorhanden |
| `<main>` | LoginScreen | ❌ fehlt — `<div className="min-h-screen...">` → `<main ...>` |
| `<main>` | CreationPhase | ✓ vorhanden |
| `<main>` | SuccessScreen | ✓ vorhanden |
| `<main>` | ErrorState | ✓ vorhanden |
| `<main>` | PlaylistColumns | prüfen |

**Wichtig:** Es darf immer nur EIN `<main>` pro Seite geben. Da die Phasen sich gegenseitig ersetzen (AnimatePresence), ist das korrekt — nur eine Phase ist gleichzeitig sichtbar.

### aria-current für Steps in CreationPhase

```tsx
// In CreationPhase.tsx — Schritt-Liste
steps.map((step, index) => (
  <li
    key={step.id}
    aria-current={step.status === 'active' ? 'step' : undefined}
    // ... bestehende Klassen
  >
    {/* Ping-Animation-Element: */}
    {step.status === 'active' && (
      <span aria-hidden="true" className="animate-ping ...">
    )}
  </li>
))
```

**Wichtig:** `aria-current` auf `undefined` setzen (nicht `false`) wenn nicht aktiv — `false` ist auch gültig aber `undefined` ist sauberer.

### Kontrast-Audit-Strategie

Da kein Browser-Tool verfügbar ist, prüfe die CSS Custom Properties in `src/index.css`:

1. Lese `src/index.css` vollständig
2. Identifiziere alle `--foreground`, `--muted-foreground`, `--background`, `--card` Variablen
3. shadcn/ui Standard-Themes sind WCAG AA konform designed — hohes Vertrauen
4. Prüfe nur ob `text-muted-foreground` auf weißem/hellem Hintergrund ausreichend ist
5. Dokumentiere die Audit-Entscheidung in der Story als Completion Note

**Dekorative Elemente (ausgenommen):**
- Spalten-Tint-Farben (farbige Hintergründe in Playlist-Spalten)
- Track-Punkt-Dekoration (kleine farbige Kreise vor Track-Namen)
- Icon-only Elemente die keine Bedeutung transportieren

### Datei-Liste — voraussichtliche Änderungen

| Datei | Erwartete Änderung |
|-------|-------------------|
| `src/components/LoginScreen.tsx` | `div` → `<main>`, ggf. aria-label auf Button |
| `src/components/PlaylistRow.tsx` | `focus-visible:ring-*` Klasse ergänzen |
| `src/components/CreationPhase.tsx` | `aria-current` auf Steps, `aria-hidden` auf Ping-Elemente |
| `src/components/AppHeader.tsx` | Prüfen, ggf. `aria-label` auf Logout-Button |
| `src/components/Toolbar.tsx` | Prüfen, ggf. `aria-label` auf Erstellen-Button |
| `src/index.css` | Ggf. Farbanpassung falls Kontrast-Problem |
| Neue/angepasste Test-Dateien | Tests für ARIA-Änderungen |

**Keine neuen Dateien oder Ordner anlegen** — alle Änderungen in bestehenden Dateien.

### Learnings aus Story 4.2

- `framer-motion` in Tests mocken mit `vi.mock('framer-motion', ...)` — falls AppContent getestet wird
- Tailwind v4 hat KEINE `tailwind.config.ts` — Custom Properties in `src/index.css`
- `yarn test:run` für einmaligen CI-Test-Durchlauf
- Vor Implementierung Dateien lesen um bestehende Implementierung zu kennen (AC2+AC3 waren in 4.2 bereits implementiert!)

### Bestehende Tests — NICHT brechen

Aktuell: **139 Tests (16 Dateien) grün** nach Story 4.2.

`PlaylistRow.test.tsx` testet bereits ARIA — prüfe ob Tests nach Fokus-Ring-Ergänzung noch passen (sie sollten, da nur neue Klassen hinzukommen).

### Anti-Patterns (verboten)

- `aria-label` hinzufügen wenn sichtbarer Text bereits ausreichend erklärend ist (redundant)
- `role="presentation"` oder `role="none"` auf semantische Elemente setzen
- Fokus-Ring mit `outline: none` ohne Alternative entfernen
- `aria-hidden="true"` auf interaktive Elemente setzen (macht sie für Tastatur unsichtbar)
- Tailwind Custom Properties außerhalb `src/index.css` definieren

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (Vertex AI)

### Debug Log References

(keine)

### Completion Notes List

- ✅ Task 1: `LoginScreen.tsx` — äußerstes `div` zu `<main>` geändert. Button-Text "Mit Spotify anmelden" ausreichend, kein `aria-label` nötig. shadcn Button hat standardmäßig `focus-visible:ring`.
- ✅ Task 2: `PlaylistRow.tsx` — `focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none rounded-lg` ergänzt für sichtbaren Keyboard-Fokus-Ring (WCAG AC1).
- ✅ Task 3: `CreationPhase.tsx` — `aria-current={step.status === 'active' ? 'step' : undefined}` auf `<li>` und `aria-hidden="true"` auf Ping-Container-`<span>` gesetzt.
- ✅ Task 4: `AppHeader.tsx` — Logout-Button zeigt "Abmelden" als sichtbaren Text → kein `aria-label` nötig (Text ist selbsterklärend).
- ✅ Task 5: `Toolbar.tsx` — Erstellen-Button zeigt "Erstellen" als sichtbaren Text → kein `aria-label` nötig.
- ✅ Task 6 Kontrast-Audit:
  - shadcn Custom Properties (`--muted-foreground: oklch(0.556 0 0)`, `--foreground: oklch(0.145 0 0)`) sind WCAG AA konform.
  - `text-gray-500` (#6B7280 auf #FFFFFF) → ~4.86:1 ✓
  - `text-gray-400` (#9CA3AF auf #FFFFFF) → nur ~2.53:1 ❌ — in 3 Stellen verwendet (PlaylistRow Track-Count, ConfirmDialog Hinweistext, AppHeader Logout-Button Ruhezustand).
  - Fix: `--color-gray-400: oklch(0.55 0.015 264)` in `@theme inline` in `src/index.css` → WCAG AA konform, keine Komponenten-Änderung.
  - Dekorative Elemente (ausgenommen): Spalten-Tint-Farben in PlaylistColumns, Track-Punkt-Dekorationen, Ping-Animations-Dots (visuell).
- ✅ Task 7: 8 neue Tests geschrieben. 147 Tests gesamt — alle grün, keine Regressionen.

### File List

- `src/components/LoginScreen.tsx` — `div` → `<main>`
- `src/components/PlaylistRow.tsx` — focus-visible:ring-* Klassen ergänzt
- `src/components/CreationPhase.tsx` — aria-current auf Steps, aria-hidden auf Ping-Container
- `src/index.css` — `--color-gray-400` in `@theme inline` überschrieben (WCAG AA Kontrast)
- `src/components/LoginScreen.test.tsx` — neu erstellt (2 Tests)
- `src/components/PlaylistRow.test.tsx` — 1 Test ergänzt (focus-visible Klassen)
- `src/components/CreationPhase.test.tsx` — 3 Tests ergänzt (aria-current, aria-hidden)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status auf "review" aktualisiert

## Change Log

- 2026-03-26: Story erstellt — Accessibility-Audit mit Code-Analyse aller Komponenten, WCAG-AA-Gaps identifiziert, konkrete Tasks definiert
- 2026-03-26: Story implementiert — 7 Tasks abgeschlossen, 8 neue Tests, 147 Tests grün, Status → review
- 2026-03-26: Code-Review abgeschlossen — 3 Intent Gaps (IG1-IG3) + 4 Patches (P1-P4) behoben: einzelne &lt;main&gt; in App.tsx, sr-only Status-Text für aktive Schritte, Pending-Dots aria-hidden, ol aria-label, Tests vervollständigt, Windows Forced Colors Fallback; 147 Tests grün, Status → done
