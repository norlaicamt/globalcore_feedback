import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSystemLabels } from '../services/adminApi';

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
  const [loading, setLoading] = useState(true);

  const refreshLabels = useCallback(async () => {
    try {
      const data = await getSystemLabels();
      const mapped = {};
      data.forEach(l => {
        mapped[l.key] = l.value;
      });
      setLabels(mapped);
    } catch (error) {
      console.error("Failed to fetch terminology labels:", error);
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

  return (
    <TerminologyContext.Provider value={{ labels, getLabel, refreshLabels, loading }}>
      {children}
    </TerminologyContext.Provider>
  );
};
