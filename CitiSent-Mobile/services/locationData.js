const STO_TOMAS_CITY_CODE = "041028000";
const PSGC_BASE_URL = "https://psgc.gitlab.io/api";

function normalizeBarangayName(name) {
  return String(name || "").trim();
}

export async function fetchStoTomasBatangasBarangays() {
  const response = await fetch(
    `${PSGC_BASE_URL}/cities-municipalities/${STO_TOMAS_CITY_CODE}/barangays/`,
  );

  if (!response.ok) {
    throw new Error("Unable to load barangays right now. Please try again.");
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Unexpected barangay data format.");
  }

  return payload
    .map((item) => normalizeBarangayName(item?.name))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}
