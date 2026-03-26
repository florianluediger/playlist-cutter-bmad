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
    it('leere Quellen → leeres Ergebnis', () => {
      const result = calculateDiff(new Set(), new Set(['a', 'b']))
      expect(result).toEqual([])
    })

    it('leere Ausschlüsse → alle Quell-Tracks', () => {
      const result = calculateDiff(new Set(['a', 'b', 'c']), new Set())
      expect(result).toEqual(expect.arrayContaining(['a', 'b', 'c']))
      expect(result).toHaveLength(3)
    })

    it('vollständige Überschneidung → leeres Ergebnis', () => {
      const result = calculateDiff(new Set(['a', 'b']), new Set(['a', 'b', 'c']))
      expect(result).toEqual([])
    })

    it('partielle Überschneidung → nur nicht-ausgeschlossene', () => {
      const result = calculateDiff(new Set(['a', 'b', 'c']), new Set(['b']))
      expect(result).toContain('a')
      expect(result).toContain('c')
      expect(result).not.toContain('b')
    })

    it('keine Duplikate im Ergebnis (buildTrackSet dedupliziert bereits)', () => {
      const source = new Set(['a', 'b', 'c'])
      const exclude = new Set<string>()
      const result = calculateDiff(source, exclude)
      const resultSet = new Set(result)
      expect(result).toHaveLength(resultSet.size)
    })
  })
})
