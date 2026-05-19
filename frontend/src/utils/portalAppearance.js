import { DEFAULT_APPEARANCE, normalizePatternForCategory } from '../constants/appearanceThemes';

export function normalizeAppearancePrefs(source = {}) {
  const category = source.appearance_category || DEFAULT_APPEARANCE.appearance_category;
  return {
    appearance_category: category,
    appearance_pattern: normalizePatternForCategory(
      category,
      source.appearance_pattern || DEFAULT_APPEARANCE.appearance_pattern
    ),
    appearance_accent: source.appearance_accent || '',
    appearance_mode: source.appearance_mode || DEFAULT_APPEARANCE.appearance_mode,
  };
}

export function resolveAppearanceMode(mode) {
  if (mode === 'system' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

/** Apply data attributes + CSS variables to a portal root element */
export function applyPortalAppearance(prefs, rootEl) {
  if (!rootEl) return normalizeAppearancePrefs(prefs);
  const p = normalizeAppearancePrefs(prefs);
  const effectiveMode = resolveAppearanceMode(p.appearance_mode);

  rootEl.setAttribute('data-appearance-category', p.appearance_category);
  rootEl.setAttribute('data-appearance-pattern', p.appearance_pattern);
  rootEl.setAttribute('data-appearance-mode', effectiveMode);

  if (p.appearance_accent) {
    rootEl.style.setProperty('--portal-accent', p.appearance_accent);
  } else {
    rootEl.style.removeProperty('--portal-accent');
  }

  return { ...p, effectiveMode };
}

export function getPortalAppearanceClassName() {
  return 'portal-appearance-surface';
}
