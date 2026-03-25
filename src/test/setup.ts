import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom v29 liefert kein vollständiges localStorage — wir ersetzen es durch eine Map-basierte Implementierung
function createLocalStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size },
    key: (index: number) => [...store.keys()][index] ?? null,
  }
}

vi.stubGlobal('localStorage', createLocalStorageMock())
vi.stubGlobal('sessionStorage', createLocalStorageMock())
