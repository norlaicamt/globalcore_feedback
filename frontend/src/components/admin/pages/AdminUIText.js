import React, { useState, useEffect } from "react";
import { getAdminSettings, updateAdminSetting } from "../../../services/api";

const SectionCard = ({ title, subtitle, children, theme }) => (
  <div style={{ background: theme.surface, borderRadius: "12px", padding: "20px 24px", border: `1px solid ${theme.border}` }}>
    <p style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "700", color: theme.text }}>{title}</p>
    {subtitle && <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: theme.textMuted }}>{subtitle}</p>}
    {children}
  </div>
);

const TextRow = ({ title, value, onChange, theme, placeholder, rows = 3 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px 0", borderBottom: `1px solid ${theme.border}` }}>
    <label style={{ fontSize: "12px", fontWeight: "700", color: theme.textMuted }}>{title}</label>
    <textarea 
      value={value || ""} 
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${theme.border}`,
        background: theme.bg, color: theme.text, fontSize: "13px", fontFamily: "inherit", resize: "none"
      }}
    />
  </div>
);

const AdminUIText = ({ theme, darkMode }) => {
  const [settings, setSettings] = useState({
    general_report_title: "Select the establishment category",
    general_report_instruction: "General feedback is for sharing thoughts, complaints, or suggestions about any service, office, restaurant, or business. Select the category below.",
    general_report_title_fil: "Pumili ng kategorya ng establisimyento",
    general_report_instruction_fil: "Ang pangkalahatang puna ay para sa pagbabahagi ng mga ideya o reklamo tungkol sa mga serbisyo, opisina, restaurant, at iba pang negosyo. Piliin ang kategorya sa ibaba.",
  });
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getAdminSettings();
        if (data && data.length > 0) {
          const mapped = {};
          data.forEach(s => {
            if (s.key.includes('title') || s.key.includes('instruction')) {
              mapped[s.key] = s.value;
            }
          });
          setSettings(prev => ({ ...prev, ...mapped }));
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdateText = async (key, value) => {
    setUpdatingKey(key);
    try {
      await updateAdminSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (e) {
      console.error("Failed to update text setting", e);
    } finally {
      setUpdatingKey(null);
    }
  };

  if (loading) return <div style={{ color: theme.textMuted, fontSize: "13px" }}>Loading configuration...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <SectionCard theme={theme} title="Feedback SetUp" subtitle="Customize the instructions and titles shown to users when they start a new feedback report.">
         <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* English Version */}
            <div style={{ padding: "24px", background: darkMode ? "rgba(59, 130, 246, 0.05)" : "#F8FAFC", borderRadius: "16px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} />
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#3B82F6", textTransform: 'uppercase', letterSpacing: '0.05em' }}>English Instructions</p>
              </div>
              <TextRow 
                theme={theme} title="Step 1 Title" placeholder="e.g. Select the establishment category"
                value={settings.general_report_title} 
                onChange={(v) => handleUpdateText('general_report_title', v)}
              />
              <TextRow 
                theme={theme} title="Instruction Body" placeholder="Provide details on what this report is for..."
                value={settings.general_report_instruction} 
                onChange={(v) => handleUpdateText('general_report_instruction', v)}
              />
            </div>
            
            {/* Filipino Version */}
            <div style={{ padding: "24px", background: darkMode ? "rgba(245, 158, 11, 0.05)" : "#FFFBEB", borderRadius: "16px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#F59E0B", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filipino Instructions</p>
              </div>
              <TextRow 
                theme={theme} title="Step 1 Title (Filipino)" placeholder="e.g. Pumili ng kategorya..."
                value={settings.general_report_title_fil} 
                onChange={(v) => handleUpdateText('general_report_title_fil', v)}
              />
              <TextRow 
                theme={theme} title="Instruction Body (Filipino)" placeholder="Provide details in Filipino..."
                value={settings.general_report_instruction_fil} 
                onChange={(v) => handleUpdateText('general_report_instruction_fil', v)}
              />
            </div>

            <div style={{ padding: '16px', background: darkMode ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <p style={{ margin: 0, fontSize: '12px', color: '#1E40AF', fontWeight: '500' }}>
                Changes are saved automatically and reflect instantly on the User Dashboard.
              </p>
            </div>
         </div>
      </SectionCard>
    </div>
  );
};

export default AdminUIText;
