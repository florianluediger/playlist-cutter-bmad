---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments: []
workflowType: 'prd'
classification:
  projectType: web_app
  domain: general
  complexity: low-medium
  projectContext: greenfield
  uxPattern: two-column-layout-checkboxes
  keyDecisions:
    - Kein Vorschau-Feature; stattdessen Confirmation-Dialog + Fortschrittsanzeige
    - Deduplizierung per Track-ID (MVP)
    - Pure Frontend SPA, kein Backend
    - Spotify OAuth PKCE-Flow
---

# Product Requirements Document — Playlist Cutter

**Author:** Flo
**Date:** 2026-03-20

## Executive Summary

Playlist Cutter ist eine browserbasierte Single-Page Application, die Spotify-Nutzern ermöglicht, aus mehreren bestehenden Playlisten eine neue Playlist per Differenzmengen-Operation zu erzeugen. Der Nutzer wählt Quell-Playlisten und Ausschluss-Playlisten; das Tool berechnet die Differenzmenge der Track-IDs und erstellt eine neue Spotify-Playlist mit dem Ergebnis. Die App läuft vollständig im Browser ohne Backend — Authentifizierung erfolgt über Spotify OAuth 2.0 PKCE-Flow.

**Zielnutzer:** Spotify-Nutzer, die ihre Bibliothek aktiv kuratieren und Playlisten strukturiert verwalten.

**Problem:** Spotify bietet keine eingebaute Funktion für Playlist-Mengenoperationen. Nutzer, die eine Playlist bereinigen oder eine "Best Of"-Sammlung ohne Duplikate aus mehreren Playlisten erstellen wollen, haben kein geeignetes Werkzeug — eine Lücke, die früher iTunes mit eingebauten Smart-Playlist-Werkzeugen gefüllt hat.

## Was dieses Produkt besonders macht

Playlist Cutter ermöglicht Spotify-Playlist-Differenzoperationen direkt im Browser ohne Server-Infrastruktur. Durch parallele Spotify-API-Calls wird die Ladezeit minimiert. Deduplizierung erfolgt anhand stabiler Spotify Track-IDs. Das Zwei-Spalten-Layout (Quell-Playlisten | Ausschluss-Playlisten) macht die Diff-Logik unmittelbar intuitiv.

## Projektklassifikation

| Attribut | Wert |
|---|---|
| Projekttyp | Web App (SPA) |
| Domain | General / Entertainment |
| Komplexität | Niedrig bis Mittel |
| Projektkontext | Greenfield |
| Deployment | Pure Frontend, kein Backend |

## Erfolgskriterien

### User-Erfolg

- Nutzer erhält nach erfolgreicher Playlist-Erstellung eine eindeutige Erfolgsmeldung
- Fehler werden mit konkreten Handlungsempfehlungen kommuniziert (z.B. "Sitzung abgelaufen — bitte neu einloggen")
- Fortschritt ist während aller API-Operationen sichtbar (Fortschrittsbalken); kein hängender UI-Zustand
- Das Tool ist ästhetisch ansprechend und macht Spaß zu bedienen

### Business-Erfolg

- Primärziel: Flo nutzt das Tool regelmäßig für eigene Playlist-Verwaltung
- Sekundärziel: Organische Verbreitung durch gute UX und Ästhetik

### Technischer Erfolg

- Spotify OAuth 2.0 PKCE-Flow funktioniert zuverlässig im Browser
- Parallele API-Calls minimieren Ladezeiten
- Track-ID-basierte Deduplizierung liefert korrekte, duplikatfreie Ergebnisse
- Fehlerbehandlung für API-Timeouts, abgelaufene Tokens und leere Differenzmengen

## Produkt-Scope

### Phase 1 — MVP

- Spotify-Login via OAuth 2.0 PKCE + Session-Persistenz
- Zwei-Spalten-Layout: Quell-Playlisten | Ausschluss-Playlisten (Checkbox-Auswahl)
- Playlist-Name eingeben vor Erstellung
- Validierung: leere Auswahl, Duplikate Quell/Ausschluss, leeres Ergebnis
- Parallele API-Calls + Track-ID-Deduplizierung
- Neue Playlist in Spotify erstellen
- Confirmation-Dialog vor Erstellung
- Fortschrittsbalken mit Timeout-Erkennung
- Erfolgs- und Fehlermeldungen
- Empty State für Nutzer ohne Playlisten
- Desktop-optimiertes Layout (min. 1024px)

### Phase 2 — Growth (Post-MVP)

- Vollständig responsives Layout (Tablet + Mobile, min. 375px)
- Post-Erfolg: UI-Reset für sofortigen neuen Diff
- Rate-Limit-Handling
- Direkt-Link zur erstellten Playlist in der Erfolgsmeldung

### Phase 3 — Vision

- Weitere Mengenoperationen (Union, Intersection)
- Fuzzy Matching (Track-Titel + Artist statt nur ID)
- Mehrsprachigkeit
- Teilen von Diff-Rezepten

## User Journeys

### Journey 1 — Erstnutzer: Login & Onboarding

Flo öffnet die App zum ersten Mal. Er klickt den Login-Button, wird zu Spotify weitergeleitet, erteilt Berechtigungen und landet zurück in der App. Seine Playlisten erscheinen im Zwei-Spalten-Layout. Die Session wird per localStorage persistiert — ein Seitenneuladen erfordert keinen erneuten Login.

**Edge Case:** Nutzer ohne Playlisten → Empty State mit erklärendem Text statt leerer Liste.

### Journey 2 — Hauptnutzung: Playlist-Diff erstellen

Flo wählt links Quell-Playlisten, rechts Ausschluss-Playlisten. Er gibt der neuen Playlist einen Namen, klickt "Erstellen" und bestätigt den Confirmation-Dialog. Der Fortschrittsbalken zeigt den Ladefortschritt der Tracks und die Erstellung. Erfolgsmeldung am Ende. Checkboxen werden zurückgesetzt — Flo kann sofort einen neuen Diff starten.

**Validierungen vor Erstellung:**
- Keine Quell-Playlisten gewählt → Hinweis, Erstellung blockiert
- Dieselbe Playlist in Quell + Ausschluss → Warnung
- Differenzmenge leer → Warnung vor Erstellung einer leeren Playlist

### Journey 3 — Fehlerfall: API-Probleme

- **Token abgelaufen:** Meldung "Sitzung abgelaufen — bitte neu einloggen", 1-Klick Re-Login
- **Netzwerkfehler / Timeout:** Fehlermeldung nach 10 Sekunden statt eingefrorenem Fortschrittsbalken
- **Partielles Scheitern:** Klare Statusmeldung, kein stummer Absturz

### Journey Requirements Summary

| Capability | Quelle |
|---|---|
| Spotify OAuth PKCE + Session-Persistenz | Journey 1 |
| Empty State | Journey 1 Edge Case |
| Playlist-Namenseingabe | Journey 2 |
| Validierungen (leere Auswahl, Duplikat, leeres Ergebnis) | Journey 2 |
| Fortschrittsbalken + Timeout-Erkennung | Journey 2, 3 |
| Post-Erfolg UI-Reset | Journey 2 |
| Verständliche Fehlermeldungen | Journey 3 |

## Web App Anforderungen

**Architektur:** Client-Side Rendering (SPA), kein Server-Side Rendering, kein Backend.

**Browser-Support:** Chrome, Firefox, Safari, Edge (aktuelle Versionen). Kein Legacy-Support.

**SEO:** Nicht relevant — kein öffentlicher, indexierbarer Inhalt.

### Responsive Design

- **MVP:** Desktop-optimiertes Layout (min. 1024px)
- **Post-MVP:** Vollständig responsives Layout (min. 375px); Zwei-Spalten-Layout kollabiert auf kleinen Bildschirmen in alternatives Layout

### Accessibility

- Alle interaktiven Elemente per Tastatur bedienbar
- Farbkontraste: WCAG AA (min. 4.5:1 für Text)
- Fehlermeldungen und Statusmeldungen per ARIA zugänglich
- Semantisches HTML

## Risikominimierung

| Risiko | Mitigation |
|---|---|
| API-Pagination komplex | Parallele Calls + Fortschrittsbalken |
| Token-Ablauf | Explizite Fehlermeldung + 1-Klick Re-Login |
| Leerer Diff | Validierung vor Erstellung |
| Solo-Entwickler | Enger MVP-Scope, kein Backend |

## Functional Requirements

### Authentifizierung & Session

- FR1: Nutzer kann sich über Spotify OAuth 2.0 PKCE im Browser anmelden
- FR2: Nutzer kann sich von der App abmelden
- FR3: Das System erhält die Session über Seitenneuladen hinweg (localStorage)
- FR4: Das System erkennt abgelaufene Tokens und zeigt eine Meldung mit Handlungsempfehlung

### Playlist-Verwaltung & Auswahl

- FR5: Nutzer kann alle eigenen Spotify-Playlisten im Zwei-Spalten-Layout einsehen
- FR6: Nutzer kann beliebig viele Playlisten als Quell-Playlisten auswählen
- FR7: Nutzer kann beliebig viele Playlisten als Ausschluss-Playlisten auswählen
- FR8: Das System zeigt einen Empty State, wenn der Nutzer keine Playlisten besitzt
- FR9: Das System warnt, wenn dieselbe Playlist als Quelle und Ausschluss gewählt wird

### Diff-Berechnung

- FR10: Das System lädt alle Tracks der ausgewählten Quell-Playlisten
- FR11: Das System lädt alle Tracks der ausgewählten Ausschluss-Playlisten
- FR12: Das System berechnet die Differenzmenge der Tracks anhand der Spotify Track-ID
- FR13: Das System dedupliziert Tracks aus mehreren Quell-Playlisten (jeder Track erscheint maximal einmal)

### Playlist-Erstellung

- FR14: Nutzer kann der neuen Playlist einen Namen geben
- FR15: Das System zeigt einen Confirmation-Dialog mit Auswahl-Zusammenfassung vor der Erstellung
- FR16: Das System erstellt eine neue Playlist im Spotify-Konto des Nutzers mit den Tracks der Differenzmenge
- FR17: Das System warnt und blockiert die Erstellung, wenn die Differenzmenge leer ist
- FR18: Das System blockiert die Erstellung, wenn keine Quell-Playlisten ausgewählt sind

### Fortschritt & Feedback

- FR19: Das System zeigt einen Fortschrittsbalken während Track-Ladeoperationen und Playlist-Erstellung
- FR20: Das System erkennt hängende API-Calls nach 10 Sekunden und zeigt eine Fehlermeldung
- FR21: Das System zeigt eine Erfolgsmeldung nach erfolgreicher Playlist-Erstellung
- FR22: Das System zeigt verständliche Fehlermeldungen bei API-Fehlern mit konkreten Handlungsempfehlungen

## Non-Functional Requirements

### Performance

- Playlisten-Liste lädt innerhalb von 3 Sekunden nach erfolgreichem Login
- Track-Ladeoperationen verwenden parallele API-Calls (kein sequentielles Abarbeiten)
- API-Call-Timeout: 10 Sekunden; danach Fehlermeldung
- UI bleibt während laufender API-Operationen responsiv

### Sicherheit

- Spotify Access Token wird ausschließlich in localStorage/sessionStorage gespeichert — keine Übertragung an Dritte
- Keine Nutzer-Credentials werden gespeichert — ausschließlich OAuth 2.0 PKCE
- HTTPS-only Deployment
- Keine serverseitige Komponente

### Accessibility

- Alle interaktiven Elemente per Tastatur erreichbar
- WCAG AA Farbkontraste (min. 4.5:1 für Text)
- ARIA-Attribute für Fehlermeldungen und Statusmeldungen
- Semantisches HTML ohne Bedeutungsverlust bei deaktiviertem CSS

### Integration

- Spotify Web API Pagination vollständig unterstützt (max. 100 Items pro Call)
- OAuth 2.0 PKCE-Flow gemäß Spotify Developer Guidelines implementiert
- Graceful Degradation bei Spotify API-Ausfällen — keine stummen Fehler
