import { describe, it, expect } from 'vitest'
import { buildTrackSet, calculateDiff } from '@/lib/diffEngine'

describe('diffEngine', () => {
  describe('buildTrackSet()', () => {
    it('gibt leeres Set bei leeren Input-Arrays zurück', () => {
      expect(buildTrackSet([])).toEqual(new Set())
      expect(buildTrackSet([[]])).toEqual(new Set())
    })

    it('dedupliciert Tracks über Playlisten hinweg', () => {
      const result = buildTrackSet([
        [{ id: 'a' }, { id: 'b' }],
        [{ id: 'b' }, { id: 'c' }],
      ])
      expect(result).toEqual(new Set(['a', 'b', 'c']))
    })

    it('führt mehrere Playlisten zusammen', () => {
      const result = buildTrackSet([
        [{ id: 'a' }, { id: 'b' }],
        [{ id: 'c' }, { id: 'd' }],
        [{ id: 'e' }, { id: 'f' }],
      ])
      expect(result).toEqual(new Set(['a', 'b', 'c', 'd', 'e', 'f']))
      expect(result.size).toBe(6)
    })

    it('gibt alle Track-IDs einer einzelnen Playlist zurück', () => {
      const result = buildTrackSet([[{ id: 'x' }, { id: 'y' }, { id: 'z' }]])
      expect(result).toEqual(new Set(['x', 'y', 'z']))
    })

    it('dedupliciert Tracks innerhalb derselben Playlist', () => {
      const result = buildTrackSet([[{ id: 'a' }, { id: 'a' }, { id: 'b' }]])
      expect(result).toEqual(new Set(['a', 'b']))
    })
  })

  describe('calculateDiff()', () => {
    it('ist noch nicht implementiert und wirft einen Fehler (Story 3.2 Stub)', () => {
      expect(() =>
        calculateDiff(new Set(['a', 'b']), new Set(['b']))
      ).toThrow('calculateDiff: noch nicht implementiert — Story 3.2')
    })
  })
})
