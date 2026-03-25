import { describe, it, expect } from 'vitest'
import { runWithConcurrency } from '@/lib/concurrency'

describe('runWithConcurrency()', () => {
  it('führt alle Tasks aus', async () => {
    const tasks = Array.from({ length: 10 }, (_, i) => () => Promise.resolve(i))
    const results = await runWithConcurrency(tasks, 3)
    expect(results).toHaveLength(10)
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('begrenzt parallele Ausführung auf max', async () => {
    let running = 0
    let maxRunning = 0

    const tasks = Array.from({ length: 10 }, (_, i) => async () => {
      running++
      maxRunning = Math.max(maxRunning, running)
      await new Promise<void>((resolve) => setTimeout(resolve, 10))
      running--
      return i
    })

    await runWithConcurrency(tasks, 3)
    expect(maxRunning).toBeLessThanOrEqual(3)
  })

  it('gibt Ergebnisse in Task-Reihenfolge zurück', async () => {
    const delays = [30, 10, 20]
    const tasks = delays.map((delay, i) => async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, delay))
      return i
    })

    const results = await runWithConcurrency(tasks, 3)
    expect(results).toEqual([0, 1, 2])
  })

  it('propagiert Fehler wenn ein Task scheitert', async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.reject(new Error('Task fehlgeschlagen')),
      () => Promise.resolve(3),
    ]

    await expect(runWithConcurrency(tasks, 2)).rejects.toThrow('Task fehlgeschlagen')
  })

  it('funktioniert mit leerer Task-Liste', async () => {
    const results = await runWithConcurrency([], 5)
    expect(results).toEqual([])
  })

  it('funktioniert wenn max größer als Anzahl der Tasks ist', async () => {
    const tasks = [() => Promise.resolve('a'), () => Promise.resolve('b')]
    const results = await runWithConcurrency(tasks, 10)
    expect(results).toEqual(['a', 'b'])
  })
})
