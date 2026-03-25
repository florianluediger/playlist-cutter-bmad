export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-gray-500 mb-4">Keine Playlisten gefunden.</p>
      <a
        href="https://open.spotify.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sky-600 hover:underline text-sm"
      >
        Playlisten auf Spotify erstellen →
      </a>
    </div>
  )
}
