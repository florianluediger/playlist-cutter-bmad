import type { Track } from '@/types'

// Story 3.1: Deduplication
export function buildTrackSet(trackArrays: Track[][]): Set<string> {
  const ids = new Set<string>()
  for (const tracks of trackArrays) {
    for (const track of tracks) {
      ids.add(track.id)
    }
  }
  return ids
}

// Story 3.2: Reine Funktion — kein React, kein State, kein API-Call
export function calculateDiff(
  sourceTracks: Set<string>,
  excludeTracks: Set<string>
): string[] {
  return [...sourceTracks].filter((id) => !excludeTracks.has(id))
}
