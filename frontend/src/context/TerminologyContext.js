import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSystemLabels } from '../services/adminApi';
import { getAdminSettings } from '../services/api';

const TerminologyContext = createContext();

export const useTerminology = () => {
  const context = useContext(TerminologyContext);
  if (!context) {
    throw new Error('useTerminology must be used within a TerminologyProvider');
  }
  return context;
};

export const TerminologyProvider = ({ children }) => {
  const [labels, setLabels] = useState({});
  const [systemSettings, setSystemSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Helper to convert hex to rgb for rgba() usage
  const hexToRgb = (hex) => {
    let defaultRgb = "31, 42, 86"; // fallback navy blue
    if (!hex) return defaultRgb;
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return defaultRgb;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  const refreshLabels = useCallback(async () => {
    try {
      const { getSystemInfo } = require('../services/api');

      // Fetch public endpoints unconditionally; admin labels only when a session exists.
      // getSystemLabels() calls /admin/labels which requires X-Session-Token.
      // If we call it without a token, the adminApi interceptor fires a 401 redirect
      // (window.location.href = '/admin') which aborts ALL concurrent Axios requests,
      // producing "AxiosError: Network Error" on the public login page.
      const hasAdminSession = Boolean(
        (() => {
          try {
            const raw = localStorage.getItem('admin.current');
            return raw ? JSON.parse(raw)?.session_token : null;
          } catch { return null; }
        })()
      );

      const fetchWithRetry = async (fn, retries = 2, delay = 1000) => {
        for (let i = 0; i <= retries; i++) {
          try { return await fn(); } catch (e) {
            if (i === retries) return {};
            await new Promise(r => setTimeout(r, delay));
          }
        }
      };

      const [labelsData, settingsData, publicInfo] = await Promise.all([
        // Only fetch admin labels when an admin session is present
        hasAdminSession
          ? getSystemLabels().catch(() => [])
          : Promise.resolve([]),
        // Admin settings also require auth — guard the same way
        hasAdminSession
          ? getAdminSettings().catch(() => [])
          : Promise.resolve([]),
        fetchWithRetry(getSystemInfo),
      ]);

      const mappedLabels = {};
      (labelsData || []).forEach(l => {
        mappedLabels[l.key] = l.value;
      });
      setLabels(mappedLabels);

      const mappedSettings = {};
      (settingsData || []).forEach(s => {
        mappedSettings[s.key] = s.value;
      });

      // Merge public branding settings
      if (publicInfo.organization_name) mappedSettings.primary_organization_name = publicInfo.organization_name;
      if (publicInfo.primary_color) mappedSettings.primary_color = publicInfo.primary_color;

      setSystemSettings(mappedSettings);

      // Inject Dynamic Theme CSS Variables (primary color only — safe for dark mode)
      const root = document.documentElement;
      const primaryHex = mappedSettings.primary_color;
      if (primaryHex && primaryHex.startsWith('#')) {
        root.style.setProperty('--primary-color', primaryHex);
        root.style.setProperty('--primary-rgb', hexToRgb(primaryHex));
      }
      // Note: we intentionally do NOT override dark mode background colors.
      // Only --primary-color drives buttons, highlights, sidebar gradient, and focus rings.

    } catch (error) {
      console.error("Failed to fetch terminology/settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLabels();
  }, [refreshLabels]);

  // Safe getter with fallback
  const getLabel = (key, fallback) => {
    return labels[key] || fallback;
  };

  const systemName = systemSettings.primary_organization_name || "GlobalCore Feedback";

  return (
    <TerminologyContext.Provider value={{ labels, getLabel, refreshLabels, loading, systemName, systemSettings }}>
      {children}
    </TerminologyContext.Provider>
  );
};
