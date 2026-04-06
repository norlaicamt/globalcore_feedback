import React, { useState, useEffect } from "react";
import { getAdminSettings, updateAdminSetting } from "../../../services/api";

const ToggleRow = ({ title, description, checked, onChange, loading, theme, darkMode }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${theme.border}`, opacity: loading ? 0.6 : 1 }}>
    <div style={{ flex: 1, paddingRight: "16px" }}>
      <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: theme.text }}>{title}</p>
      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: theme.textMuted }}>{description}</p>
    </div>
    <div onClick={loading ? null : onChange} style={{
      width: "40px", height: "22px", borderRadius: "11px", padding: "2px",
      background: checked ? "#34D399" : theme.bg, cursor: loading ? "wait" : "pointer", transition: "background 0.2s",
      display: "flex", alignItems: "center", flexShrink: 0, border: `1px solid ${theme.border}`
    }}>
      <div style={{
        width: "18px", height: "18px", borderRadius: "50%", background: "white",
        transition: "transform 0.2s", transform: checked ? "translateX(18px)" : "translateX(0)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
      }} />
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, children, theme }) => (
  <div style={{ background: theme.surface, borderRadius: "12px", padding: "20px 24px", border: `1px solid ${theme.border}` }}>
    <p style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "700", color: theme.text }}>{title}</p>
    {subtitle && <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: theme.textMuted }}>{subtitle}</p>}
    {children}
  </div>
);

const AdminSettings = ({ theme, darkMode }) => {
  const [settings, setSettings] = useState({
    allow_voice: true,
    public_feed: true,
    email_notifications: false,
    status_notifications: true
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
            mapped[s.key] = s.value === 'true';
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

  const handleToggle = async (key) => {
    const newValue = !settings[key];
    setUpdatingKey(key);
    try {
      await updateAdminSetting(key, String(newValue));
      setSettings(prev => ({ ...prev, [key]: newValue }));
    } catch (e) {
      console.error("Failed to update setting", e);
    } finally {
      setUpdatingKey(null);
    }
  };

  if (loading) return <div style={{ color: theme.textMuted, fontSize: "13px" }}>Loading settings...</div>;

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>

      <SectionCard theme={theme} title="System Features" subtitle="Control feature availability for all users">
        <ToggleRow
          theme={theme}
          darkMode={darkMode}
          title="Voice Note Submissions"
          description="Allow users to record audio notes in the feedback form"
          checked={settings.allow_voice} 
          onChange={() => handleToggle('allow_voice')}
          loading={updatingKey === 'allow_voice'}
        />
        <ToggleRow
          theme={theme}
          darkMode={darkMode}
          title="Community Feed"
          description="The public feed is visible to all logged-in users"
          checked={settings.public_feed} 
          onChange={() => handleToggle('public_feed')}
          loading={updatingKey === 'public_feed'}
        />
        <ToggleRow
          theme={theme}
          darkMode={darkMode}
          title="Email Notifications"
          description="Send email alerts when a user's feedback receives a reply"
          checked={settings.email_notifications} 
          onChange={() => handleToggle('email_notifications')}
          loading={updatingKey === 'email_notifications'}
        />
        <div style={{ paddingTop: "14px" }}>
          <ToggleRow
            theme={theme}
            darkMode={darkMode}
            title="Status Change Notifications"
            description="Notify users when admin updates their feedback status"
            checked={settings.status_notifications} 
            onChange={() => handleToggle('status_notifications')}
            loading={updatingKey === 'status_notifications'}
          />
        </div>
      </SectionCard>

      <SectionCard theme={theme} title="Admin Credentials" subtitle={<>Stored in the backend <code style={{ background: theme.bg, border: `1px solid ${theme.border}`, padding: "1px 6px", borderRadius: "4px", fontSize: "11px" }}>.env</code> file</>}>
        <div style={{ background: theme.bg, borderRadius: "8px", padding: "14px 16px", fontSize: "12px", color: theme.text, fontFamily: "monospace", lineHeight: "2", border: `1px solid ${theme.border}` }}>
          ADMIN_EMAIL={process.env.ADMIN_EMAIL || 'admin@globalcore.com'}<br />
          ADMIN_PASSWORD=********<br />
          ADMIN_NAME={process.env.ADMIN_NAME || 'GlobalCore Admin'}
        </div>
        <p style={{ fontSize: "11px", color: theme.textMuted, marginTop: "10px" }}>
          Edit these values in <code style={{ fontSize: "11px" }}>.env</code> and restart the backend server to apply changes.
        </p>
      </SectionCard>

      <div style={{ background: theme.surface, borderRadius: "12px", padding: "20px 24px", border: `1.5px solid ${darkMode ? "rgba(220, 38, 38, 0.4)" : "#FEE2E2"}` }}>
        <p style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "700", color: "#EF4444" }}>Danger Zone</p>
        <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: theme.textMuted }}>These actions are permanent and cannot be undone.</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: darkMode ? "rgba(220, 38, 38, 0.1)" : "#FFF5F5", borderRadius: "8px", border: `1px solid ${darkMode ? "rgba(220, 38, 38, 0.2)" : "#FEE2E2"}` }}>
          <div>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: theme.text }}>Remove Test Accounts</p>
            <p style={{ margin: 0, fontSize: "11px", color: theme.textMuted }}>Delete users flagged as test data</p>
          </div>
          <button style={{ padding: "6px 14px", background: darkMode ? "#991B1B" : "#FEE2E2", color: darkMode ? "white" : "#B91C1C", border: "1px solid transparent", borderRadius: "7px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
            Run Cleanup
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
