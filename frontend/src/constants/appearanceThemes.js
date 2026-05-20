/** User Portal appearance catalog — lightweight CSS/SVG patterns only */

export const APPEARANCE_MODES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'Match device' },
];

export const APPEARANCE_ACCENTS = [
  { id: '', label: 'Organization default', color: 'var(--primary-color)' },
  { id: '#1f2a56', label: 'Navy', color: '#1f2a56' },
  { id: '#0369a1', label: 'Corporate blue', color: '#0369a1' },
  { id: '#059669', label: 'Emerald', color: '#059669' },
  { id: '#7c3aed', label: 'Violet', color: '#7c3aed' },
  { id: '#b45309', label: 'Amber', color: '#b45309' },
  { id: '#64748b', label: 'Slate', color: '#64748b' },
];

export const APPEARANCE_CATEGORIES = {
  standard: {
    label: 'Normal (Plain)',
    description: 'A clean, completely plain interface without patterns.',
    patterns: [
      { id: 'none', label: 'No pattern' },
    ],
  },
  minimal: {
    label: 'Minimal',
    description: 'Clean, calm backgrounds for focused work.',
    patterns: [
      { id: 'soft_circles', label: 'Soft circles' },
      { id: 'abstract_gradient', label: 'Abstract gradient' },
    ],
  },
  professional: {
    label: 'Professional',
    description: 'Structured tones suited to enterprise use.',
    patterns: [
      { id: 'waves', label: 'Waves' },
      { id: 'abstract_gradient', label: 'Abstract gradient' },
    ],
  },
  community: {
    label: 'Community',
    description: 'Warm, welcoming motifs for public engagement.',
    patterns: [
      { id: 'hearts', label: 'Hearts' },
      { id: 'smiles', label: 'Smile pattern' },
      { id: 'soft_circles', label: 'Soft circles' },
    ],
  },
  hospitality: {
    label: 'Hospitality',
    description: 'Refined highlights for service-oriented portals.',
    patterns: [
      { id: 'sparkles', label: 'Sparkles' },
      { id: 'waves', label: 'Waves' },
      { id: 'soft_circles', label: 'Soft circles' },
    ],
  },
};

export const DEFAULT_APPEARANCE = {
  appearance_category: 'standard',
  appearance_pattern: 'none',
  appearance_accent: '',
  appearance_mode: 'light',
};

export function getPatternsForCategory(categoryId) {
  return APPEARANCE_CATEGORIES[categoryId]?.patterns
    || APPEARANCE_CATEGORIES.minimal.patterns;
}

export function normalizePatternForCategory(categoryId, patternId) {
  const patterns = getPatternsForCategory(categoryId);
  if (patterns.some((p) => p.id === patternId)) return patternId;
  return patterns[0]?.id || 'soft_circles';
}
