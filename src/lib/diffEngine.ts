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

// Story 3.2 Stub — Signatur anlegen, leerer Body
export function calculateDiff(
  sourceTracks: Set<string>,
  excludeTracks: Set<string>
): string[] {
  // TODO: Story 3.2 implementiert diese Funktion
  throw new Error('calculateDiff: noch nicht implementiert — Story 3.2')
}
