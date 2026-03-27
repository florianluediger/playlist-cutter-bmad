# Playlist Cutter

A browser-based tool to create new Spotify playlists using set difference — pick source playlists, exclude tracks from other playlists, and save the result directly to your Spotify account.

## What it does

Select one or more **source playlists** and one or more **exclusion playlists**. The app calculates which tracks appear in the sources but _not_ in the exclusions, then creates a new playlist with those tracks in your Spotify account.

Example use case: you have a "Big Library" playlist and a "Already Heard" playlist — create a "Fresh Picks" playlist with everything you haven't listened to yet.

## Features

- **Spotify OAuth 2.0 PKCE** — secure authentication, no backend required
- **Two-column selection** — source playlists on the left, exclusions on the right
- **Parallel track loading** — up to 5 concurrent API calls to minimize wait time
- **Track deduplication** — based on Spotify track IDs
- **Confirmation dialog** — review before creating
- **Progress indicator** — live feedback during playlist creation
- **Session persistence** — stays logged in across page reloads
- **WCAG AA compliant** — keyboard navigable, screen-reader friendly
- **Animated phase transitions** — smooth UX between steps

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Testing | Vitest + Testing Library |
| UI Components | shadcn/ui + Radix UI |
| Animation | Framer Motion |
| Styling | Tailwind CSS v4 |
| Auth | Spotify OAuth 2.0 PKCE |
| Package Manager | Yarn 4 |

## Getting started

### Prerequisites

- Node.js 18+
- Yarn 4 (`corepack enable`)
- A [Spotify Developer App](https://developer.spotify.com/dashboard) with a registered redirect URI

### Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/your-username/playlist-cutter-bmad.git
   cd playlist-cutter-bmad
   yarn install
   ```

2. Create a `.env.local` file with your Spotify app credentials:

   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id
   VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
   ```

3. Start the dev server:

   ```bash
   yarn dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) and log in with Spotify.

### Commands

| Command | Description |
|---|---|
| `yarn dev` | Start development server |
| `yarn build` | Type-check and build for production |
| `yarn preview` | Preview the production build locally |
| `yarn test` | Run tests in watch mode |
| `yarn test:run` | Run tests once (CI) |
| `yarn lint` | Run ESLint |

## Architecture

The app is a pure frontend SPA — no server, no database. All processing happens in the browser.

**State machine:** The app moves through distinct phases (`login → loading → selection → creating → success / error`), managed via React Context and a reducer.

**Auth:** Spotify OAuth 2.0 PKCE flow — the code verifier never leaves the browser.

**Track diffing:** Simple `Set`-based subtraction on Spotify track IDs. Runs entirely in memory.

**API concurrency:** Track loading uses a concurrency limiter capped at 5 parallel requests to stay within Spotify's rate limits.

## Project structure

```
src/
├── components/       # UI components
│   └── ui/           # shadcn/ui primitives
├── context/          # AppContext + appReducer
├── hooks/            # useAuth, useMediaQuery
├── lib/              # auth, spotifyApi, diffEngine, concurrency, utils
└── types/            # Shared TypeScript types
```
