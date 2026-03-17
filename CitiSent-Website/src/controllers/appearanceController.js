const FONT_SIZE_MAP = {
  Small: 14,
  Medium: 16,
  Large: 18,
}

export function resolveEffectiveTheme({ themePreference, systemPrefersDark }) {
  if (themePreference === 'Dark') {
    return 'dark'
  }

  if (themePreference === 'Light') {
    return 'light'
  }

  return systemPrefersDark ? 'dark' : 'light'
}

export function buildAppearanceState({
  themePreference,
  fontSizePreference,
  animationsEnabled,
  systemPrefersDark,
}) {
  return {
    effectiveTheme: resolveEffectiveTheme({ themePreference, systemPrefersDark }),
    rootFontSizePx: FONT_SIZE_MAP[fontSizePreference] || FONT_SIZE_MAP.Medium,
    animationsEnabled: animationsEnabled !== false,
  }
}