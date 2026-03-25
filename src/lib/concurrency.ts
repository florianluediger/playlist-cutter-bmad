export async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  max: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let currentIndex = 0

  async function runNext(): Promise<void> {
    while (currentIndex < tasks.length) {
      const index = currentIndex++
      results[index] = await tasks[index]()
    }
  }

  const workers = Array.from({ length: Math.min(max, tasks.length) }, () => runNext())
  await Promise.all(workers)
  return results
}
