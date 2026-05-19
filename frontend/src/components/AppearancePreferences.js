import React, { useEffect, useMemo, useRef, useState } from 'react';
import { updateUser } from '../services/api';
import {
  APPEARANCE_ACCENTS,
  APPEARANCE_CATEGORIES,
  APPEARANCE_MODES,
  getPatternsForCategory,
} from '../constants/appearanceThemes';
import { applyPortalAppearance, normalizeAppearancePrefs } from '../utils/portalAppearance';

const AppearancePreferences = ({ currentUser, onUserUpdate, showToast, styles: sharedStyles }) => {
  const saved = useMemo(() => normalizeAppearancePrefs(currentUser), [currentUser]);

  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    setDraft(saved);
  }, [saved]);

  useEffect(() => {
    if (previewRef.current) {
      applyPortalAppearance(draft, previewRef.current);
    }
  }, [draft]);

  const patterns = getPatternsForCategory(draft.appearance_category);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const setCategory = (categoryId) => {
    const nextPatterns = getPatternsForCategory(categoryId);
    setDraft((prev) => ({
      ...prev,
      appearance_category: categoryId,
      appearance_pattern: nextPatterns.some((p) => p.id === prev.appearance_pattern)
        ? prev.appearance_pattern
        : nextPatterns[0].id,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = normalizeAppearancePrefs(draft);
      await updateUser(currentUser.id, payload);
      onUserUpdate({ ...currentUser, ...payload });
      showToast('Appearance preferences saved');
    } catch {
      showToast('Failed to save appearance preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setDraft(saved);

  return (
    <div style={sharedStyles.viewContainer}>
      <div className="settings-section-header" style={sharedStyles.sectionHeader}>
        <h2 style={sharedStyles.viewTitle}>Appearance Preferences</h2>
        <p style={sharedStyles.viewSubtitle}>
          Personalize your portal background mood. Organization branding on buttons and headers stays unchanged.
        </p>
      </div>

      <div
        ref={previewRef}
        className="portal-appearance-surface portal-appearance-preview"
        aria-label="Live appearance preview"
      >
        <div className="portal-appearance-bg" aria-hidden="true" />
        <div className="portal-appearance-preview-card">
          Live preview
          <span className="portal-appearance-preview-chip">
            {APPEARANCE_CATEGORIES[draft.appearance_category]?.label || 'Minimal'}
          </span>
        </div>
      </div>

      <div className="user-portal-card settings-section-card" style={{ ...sharedStyles.sectionCardPremium, marginTop: 16 }}>
        <h4 style={sharedStyles.cardTitlePremium}>Theme category</h4>
        <p style={{ ...sharedStyles.viewSubtitle, marginTop: 4, marginBottom: 12 }}>Choose the overall mood of your portal.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {Object.entries(APPEARANCE_CATEGORIES).map(([id, cat]) => {
            const active = draft.appearance_category === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  borderRadius: 12,
                  border: active ? '2px solid var(--primary-color)' : '1.5px solid #e2e8f0',
                  background: active ? 'color-mix(in srgb, var(--primary-color) 8%, #fff)' : '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--primary-color)' }}>{cat.label}</span>
                <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>{cat.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="user-portal-card settings-section-card" style={sharedStyles.sectionCardPremium}>
        <h4 style={sharedStyles.cardTitlePremium}>Background style</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {patterns.map((p) => {
            const active = draft.appearance_pattern === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, appearance_pattern: p.id }))}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: active ? '2px solid var(--primary-color)' : '1px solid #e2e8f0',
                  background: active ? 'var(--primary-color)' : 'white',
                  color: active ? 'white' : '#475569',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="user-portal-card settings-section-card" style={sharedStyles.sectionCardPremium}>
        <h4 style={sharedStyles.cardTitlePremium}>Accent color</h4>
        <p style={{ ...sharedStyles.viewSubtitle, marginTop: 4, marginBottom: 12 }}>
          Tints the decorative background only — not admin system branding.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {APPEARANCE_ACCENTS.map((acc) => {
            const active = (draft.appearance_accent || '') === acc.id;
            return (
              <button
                key={acc.id || 'default'}
                type="button"
                title={acc.label}
                onClick={() => setDraft((d) => ({ ...d, appearance_accent: acc.id }))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: active ? '3px solid var(--primary-color)' : '2px solid #e2e8f0',
                  background: acc.id ? acc.color : 'linear-gradient(135deg, var(--primary-color), #94a3b8)',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="user-portal-card settings-section-card" style={sharedStyles.sectionCardPremium}>
        <h4 style={sharedStyles.cardTitlePremium}>Display mode</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {APPEARANCE_MODES.map((m) => {
            const active = draft.appearance_mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, appearance_mode: m.id }))}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: active ? '2px solid var(--primary-color)' : '1px solid #e2e8f0',
                  background: active ? 'color-mix(in srgb, var(--primary-color) 10%, white)' : 'white',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="settings-form-actions" style={sharedStyles.formActionsPremium}>
        <button
          type="button"
          className="settings-primary-btn"
          style={{ ...sharedStyles.primaryBtnPremium, opacity: saving || !isDirty ? 0.6 : 1 }}
          disabled={saving || !isDirty}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : 'Save appearance'}
        </button>
        <button
          type="button"
          className="settings-secondary-btn"
          style={sharedStyles.secondaryBtnPremium}
          disabled={!isDirty || saving}
          onClick={handleReset}
        >
          Discard changes
        </button>
      </div>
    </div>
  );
};

export default AppearancePreferences;


