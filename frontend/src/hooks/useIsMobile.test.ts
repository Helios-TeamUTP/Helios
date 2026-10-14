import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from './useIsMobile'

type Listener = (e: { matches: boolean }) => void

function mockMatchMedia(matches: boolean) {
  let listener: Listener | null = null
  const mq = {
    matches,
    addEventListener: vi.fn((_: string, cb: Listener) => {
      listener = cb
    }),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mq))
  return { mq, emit: (m: boolean) => listener?.({ matches: m }) }
}

describe('useIsMobile', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('devuelve false si matchMedia no existe (jsdom/SSR)', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('refleja el valor inicial de la media query (<768px)', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('reacciona a cambios de tamaño y limpia el listener al desmontar', () => {
    const { mq, emit } = mockMatchMedia(false)
    const { result, unmount } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => emit(true))
    expect(result.current).toBe(true)

    unmount()
    expect(mq.removeEventListener).toHaveBeenCalled()
  })
})
