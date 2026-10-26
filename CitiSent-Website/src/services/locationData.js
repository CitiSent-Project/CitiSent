const STO_TOMAS_CITY_CODE = '041028000'
const PSGC_BASE_URL = 'https://psgc.gitlab.io/api'

export const STO_TOMAS_BARANGAYS_FALLBACK = [
  'Barangay I (Pob.)',
  'Barangay II (Pob.)',
  'Barangay III (Pob.)',
  'Barangay IV (Pob.)',
  'San Agustin',
  'San Antonio',
  'San Bartolome',
  'San Felix',
  'San Fernando',
  'San Francisco',
  'San Isidro Norte',
  'San Isidro Sur',
  'San Joaquin',
  'San Jose',
  'San Juan',
  'San Luis',
  'San Miguel',
  'San Pablo',
  'San Pedro',
  'San Rafael',
  'San Roque',
  'San Vicente',
  'Santa Ana',
  'Santa Anastacia',
  'Santa Clara',
  'Santa Cruz',
  'Santa Elena',
  'Santa Maria',
  'Santa Teresita',
  'Santiago',
]

function normalizeBarangayName(name) {
  return String(name || '').trim()
}

let cachedBarangays = null

/**
 * Fetches the official Sto. Tomas, Batangas barangays from the PSGC API.
 * Uses an in-memory session cache and seamlessly falls back to the official
 * Sto. Tomas barangays if the network request fails or times out.
 */
export async function fetchStoTomasBatangasBarangays({ forceRefresh = false } = {}) {
  if (cachedBarangays && !forceRefresh) {
    return cachedBarangays
  }

  try {
    const response = await fetch(
      `${PSGC_BASE_URL}/cities-municipalities/${STO_TOMAS_CITY_CODE}/barangays/`
    )

    if (!response.ok) {
      throw new Error(`PSGC API returned HTTP ${response.status}`)
    }

    const payload = await response.json()
    if (!Array.isArray(payload) || payload.length === 0) {
      throw new Error('Unexpected or empty barangay data format.')
    }

    const result = payload
      .map((item) => normalizeBarangayName(item?.name))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))

    if (result.length > 0) {
      cachedBarangays = result
      return result
    }

    throw new Error('No valid barangay records found.')
  } catch (error) {
    console.warn('Failed to load Sto. Tomas barangays from PSGC API; falling back to static list.', error)
    cachedBarangays = [...STO_TOMAS_BARANGAYS_FALLBACK]
    return cachedBarangays
  }
}

/**
 * Clears the in-memory cache (primarily useful for testing).
 */
export function clearBarangayCache() {
  cachedBarangays = null
}
