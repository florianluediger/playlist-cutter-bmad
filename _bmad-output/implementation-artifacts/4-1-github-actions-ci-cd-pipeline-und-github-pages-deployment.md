# Story 4.1: GitHub Actions CI/CD Pipeline & GitHub Pages Deployment

Status: review

## Story

Als Entwickler
möchte ich, dass die App bei jedem Push auf `main` automatisch gebaut und auf GitHub Pages deployed wird,
damit die Live-Version immer aktuell ist ohne manuellen Deploy-Aufwand.

## Acceptance Criteria

**AC1 — Automatischer Build & Deploy bei Push auf `main`:**
**Given** Code wird auf den `main`-Branch gepusht
**When** der GitHub Actions Workflow ausgelöst wird
**Then** führt `.github/workflows/deploy.yml` `yarn build` aus
**And** das `dist/`-Verzeichnis wird auf GitHub Pages deployed
**And** die App ist unter der GitHub Pages URL erreichbar (HTTPS)

**AC2 — Secrets korrekt in Vite-Build injiziert:**
**Given** `VITE_SPOTIFY_CLIENT_ID` und `VITE_SPOTIFY_REDIRECT_URI` als GitHub Actions Repository Secrets hinterlegt sind
**When** der Build läuft
**Then** werden die Env Variables korrekt in den Vite-Build injiziert
**And** keine Secrets sind im Build-Output oder im deployten Code sichtbar

**AC3 — GitHub Pages Subpath korrekt konfiguriert:**
**Given** `vite.config.ts`
**When** der Production Build erstellt wird
**Then** ist `base: '/playlist-cutter/'` konfiguriert, sodass Assets auf dem GitHub Pages Subpath korrekt geladen werden
**Note:** `base: '/playlist-cutter/'` ist bereits in `vite.config.ts` vorhanden — NICHT ändern

**AC4 — `.env.example` als Onboarding-Hilfe:**
**Given** ein Entwickler klont das Repository neu
**When** er `.env.example` liest
**Then** versteht er welche Env Variables benötigt werden und mit welchen Werten

---

## Tasks / Subtasks

- [x] `.github/workflows/deploy.yml` erstellen (AC1, AC2)
  - [x] Trigger: `on: push: branches: [main]`
  - [x] `permissions`: `contents: read`, `pages: write`, `id-token: write`
  - [x] `concurrency`: Group `pages`, `cancel-in-progress: false`
  - [x] Job `build`: `actions/checkout@v4` → `actions/setup-node@v4` (node 20, cache yarn) → `yarn install --frozen-lockfile` → `yarn build` mit Secrets als Env Vars → `actions/upload-pages-artifact@v3` (path: dist)
  - [x] Job `deploy`: `needs: build`, `environment: github-pages`, `actions/deploy-pages@v4`

- [x] `.env.example` erstellen (AC4)
  - [x] `VITE_SPOTIFY_CLIENT_ID=deine-client-id-hier`
  - [x] `VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173` (lokal) und Hinweis auf Production-URL

- [x] `vite.config.ts` prüfen — KEINE Änderung erforderlich (AC3)
  - [x] `base: '/playlist-cutter/'` ist bereits vorhanden ✅

- [ ] Manuell nach dem Deploy: GitHub Repository Settings konfigurieren
  - [ ] Repository Settings → Pages → Source: "GitHub Actions"
  - [ ] Repository Secrets: `VITE_SPOTIFY_CLIENT_ID` und `VITE_SPOTIFY_REDIRECT_URI` hinterlegen
  - [ ] Spotify Developer Dashboard: Production Redirect URI hinzufügen (`https://<username>.github.io/playlist-cutter`)

---

## Dev Notes

### Aktueller Projektzustand

- `vite.config.ts` hat bereits `base: '/playlist-cutter/'` — NICHT anfassen
- `yarn build` führt `tsc -b && vite build` aus (aus `package.json` scripts)
- Kein `.github/`-Verzeichnis vorhanden — muss komplett neu erstellt werden
- Kein `.env.example` vorhanden — neu erstellen
- `.env.local` ist bereits in `.gitignore` (NICHT committen)

### GitHub Actions Workflow — Komplette Struktur

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Build
        env:
          VITE_SPOTIFY_CLIENT_ID: ${{ secrets.VITE_SPOTIFY_CLIENT_ID }}
          VITE_SPOTIFY_REDIRECT_URI: ${{ secrets.VITE_SPOTIFY_REDIRECT_URI }}
        run: yarn build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Warum dieser Ansatz:** GitHub empfiehlt seit 2023+ den `actions/deploy-pages`-Ansatz (kein `gh-pages`-Branch nötig), der direkt über das GitHub Pages Environment deployed. Kein `peaceiris/actions-gh-pages` nötig.

### `.env.example` Inhalt

```bash
# Spotify App Credentials
# Erstelle eine App auf https://developer.spotify.com/dashboard
VITE_SPOTIFY_CLIENT_ID=deine-spotify-client-id-hier

# OAuth Redirect URI
# Lokal: http://localhost:5173
# Production (GitHub Pages): https://<dein-github-username>.github.io/playlist-cutter
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173
```

### Secrets-Verwaltung — Kritische Details

- **GitHub Secrets:** Unter Repository → Settings → Secrets and variables → Actions → New repository secret
- **Secret Names** (exakt so, da Vite `VITE_`-Prefix benötigt):
  - `VITE_SPOTIFY_CLIENT_ID`
  - `VITE_SPOTIFY_REDIRECT_URI` (Production-URL, z.B. `https://florianludiger.github.io/playlist-cutter`)
- **Vite Env Variable Regel:** Nur Variablen mit `VITE_`-Prefix werden in den Client-Bundle injiziert
- **Sicherheit:** Secrets werden NIEMALS im Build-Output angezeigt — Vite ersetzt sie zur Build-Zeit durch den Wert (kein Runtime-Lookup)

### GitHub Pages Einrichtung (manuell, einmalig)

1. Repository Settings → Pages → Source: **"GitHub Actions"** auswählen (nicht Branch!)
2. Nach erstem erfolgreichem Deploy: URL wird `https://<username>.github.io/playlist-cutter/`
3. **Spotify Developer Dashboard:** `https://developer.spotify.com/dashboard` → App → Edit Settings → Redirect URIs → Production-URL hinzufügen

### SPA-Routing: Kein Problem

Diese App nutzt **kein** React Router — Navigation läuft über State-Maschine. Der OAuth-Callback kommt als Query-Parameter auf der Haupt-URL zurück (`?code=xxx&state=xxx`). Mit `base: '/playlist-cutter/'` wird `index.html` korrekt als Root-Einstiegspunkt serviert. Kein `404.html` Redirect-Hack nötig.

### Regression-Risiken: Minimal

- Diese Story ist **reine Infrastruktur** — kein bestehender Code wird verändert
- `vite.config.ts` wird NICHT verändert (bereits korrekt konfiguriert)
- `package.json` wird NICHT verändert

### Projektstruktur — Neue Dateien

```
playlist-cutter/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← NEU: GitHub Actions Workflow
├── .env.example                ← NEU: Env Variable Template
└── ...                         ← alles andere bleibt unberührt
```

### Architektur-Referenzen

- [Source: architecture.md — Infrastructure & Deployment: GitHub Pages, GitHub Actions, Vite Env Variables]
- [Source: architecture.md — Development Workflow: `yarn build` → `dist/`, `base: '/playlist-cutter/'`]
- [Source: epics.md — Story 4.1 Acceptance Criteria]

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (create-story workflow)

### Debug Log References

Pre-existing TS-Build-Fehler gefunden: Test-Dateien aus `src/components/` waren in `tsconfig.app.json`
einbezogen, aber `@testing-library/jest-dom`-Types fehlten. Außerdem war `AppState` in Story 3.4 um
`userId`, `createdPlaylistUrl`, `createdTrackCount` erweitert worden, ohne dass `PlaylistColumns.test.tsx`
aktualisiert wurde. Fixes: (1) Test-Dateien aus `tsconfig.app.json` exclude, (2) `baseState` in
`PlaylistColumns.test.tsx` ergänzt.

### Completion Notes List

- `.github/workflows/deploy.yml` erstellt: GitHub Actions Workflow mit build- und deploy-Job,
  Secrets-Injection via `VITE_SPOTIFY_CLIENT_ID` und `VITE_SPOTIFY_REDIRECT_URI`, `upload-pages-artifact@v3`
  und `deploy-pages@v4` gemäß aktuellem GitHub-Standard.
- `.env.example` erstellt: Erklärende Kommentare mit lokaler und Production-Redirect-URI-Hinweis.
- `tsconfig.app.json`: Test-Dateien (`**/*.test.ts`, `**/*.test.tsx`) aus dem Prod-Build-Check
  ausgeschlossen — pre-existing Problem das `yarn build` blockierte (AC1).
- `PlaylistColumns.test.tsx`: `baseState` um fehlende AppState-Pflichtfelder ergänzt (Story-3.4-Versäumnis).
- `yarn build` erfolgreich, alle 129 Tests grün.
- Manuelle Nachbereitung (GitHub Repository Settings, Secrets, Spotify Dashboard) ist im Task dokumentiert.

### File List

- `.github/workflows/deploy.yml` (neu)
- `.env.example` (aktualisiert — war leer, jetzt mit Kommentaren und Beispielwerten)
- `tsconfig.app.json` (angepasst — Test-Dateien aus Build-Check ausgeschlossen)
- `src/components/PlaylistColumns.test.tsx` (fix — baseState um userId, createdPlaylistUrl, createdTrackCount ergänzt)

## Change Log

- 2026-03-26: Story implementiert — GitHub Actions CI/CD Workflow, .env.example, tsconfig.app.json Build-Fix, PlaylistColumns.test.tsx baseState-Fix. yarn build erfolgreich, alle 129 Tests grün.
