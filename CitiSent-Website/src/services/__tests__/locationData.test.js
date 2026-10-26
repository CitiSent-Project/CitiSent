import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchStoTomasBatangasBarangays,
  clearBarangayCache,
  STO_TOMAS_BARANGAYS_FALLBACK,
} from '../locationData'

describe('locationData service', () => {
  beforeEach(() => {
    clearBarangayCache()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    clearBarangayCache()
    vi.restoreAllMocks()
  })

  it('fetches and returns sorted Sto. Tomas barangays from PSGC API', async () => {
    const mockApiResponse = [
      { code: '041028001', name: 'Santiago' },
      { code: '041028002', name: 'San Antonio' },
      { code: '041028003', name: 'Barangay I (Pob.)' },
    ]

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    })

    const barangays = await fetchStoTomasBatangasBarangays()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(barangays).toEqual(['Barangay I (Pob.)', 'San Antonio', 'Santiago'])
  })

  it('caches the result in memory and avoids duplicate network calls', async () => {
    const mockApiResponse = [{ code: '041028001', name: 'San Roque' }]

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    })

    const firstResult = await fetchStoTomasBatangasBarangays()
    const secondResult = await fetchStoTomasBatangasBarangays()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(firstResult).toEqual(['San Roque'])
    expect(secondResult).toEqual(['San Roque'])
  })

  it('falls back to STO_TOMAS_BARANGAYS_FALLBACK when PSGC API fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    const barangays = await fetchStoTomasBatangasBarangays()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(barangays).toEqual(STO_TOMAS_BARANGAYS_FALLBACK)
    expect(barangays.length).toBe(30)
    expect(barangays).toContain('San Isidro Norte')
    warnSpy.mockRestore()
  })

  it('falls back to STO_TOMAS_BARANGAYS_FALLBACK when API returns non-200 status', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
    })

    const barangays = await fetchStoTomasBatangasBarangays()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(barangays).toEqual(STO_TOMAS_BARANGAYS_FALLBACK)
    warnSpy.mockRestore()
  })
})
