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

  const refreshLabels = useCallback(async () => {
    try {
      const [labelsData, settingsData] = await Promise.all([
        getSystemLabels(),
        getAdminSettings()
      ]);
      
      const mappedLabels = {};
      labelsData.forEach(l => {
        mappedLabels[l.key] = l.value;
      });
      setLabels(mappedLabels);

      const mappedSettings = {};
      (settingsData || []).forEach(s => {
        mappedSettings[s.key] = s.value;
      });
      setSystemSettings(mappedSettings);
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
